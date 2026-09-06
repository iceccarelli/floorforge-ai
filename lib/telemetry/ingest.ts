/**
 * Telemetry ingest — the interface a real machine is built against.
 *
 * WHAT WAS HERE BEFORE. `app/api/telemetry/route.ts` took any JSON from anyone
 * on the internet, validated it against a vocabulary four values wider than the
 * database enum, and inserted it. That produced three failures at once:
 *
 *   - A device following SOFTWARE_HARDWARE_CONTRACT.md:103 passed validation and
 *     was rejected by Postgres. The route turned that into a 500 with no retry
 *     contract, no buffer and no dead-letter, so 100% of the 1 Hz pressure
 *     stream was lost. (FLOORFORGE_SYSTEM_BASELINE.md §3.1)
 *   - Any caller could post events for any robot on any job. Quality evidence,
 *     warranty evidence and the training corpus were forgeable. (§3.4)
 *   - Nothing recorded whether a row came from a machine or from
 *     lib/simulation.ts, which emits the same event types into the same
 *     endpoint. (§3.6)
 *
 * WHY THIS FILE IS SEPARATE FROM THE ROUTE. Everything below is a pure function
 * of its inputs and an injected `TelemetryStore`. The route is a thin adapter
 * that supplies a Supabase-backed store; the tests supply an in-memory one. The
 * ingest contract — who may write, what counts as a duplicate, what happens to
 * a poison event — is the part that has to be provable, so it is the part that
 * does not touch the network.
 *
 * THE DELIVERY CONTRACT, stated once:
 *
 *   The edge assigns `seq`, monotonically increasing per (robot_id, job_id),
 *   before an event leaves the machine. It buffers locally and retries until
 *   the platform reports each event as `accepted`, `duplicate` or `rejected`.
 *   All three are terminal. At-least-once from the edge, exactly-once in
 *   storage, and a poison event can never wedge the queue because it comes back
 *   `rejected` with a reason rather than as a 500.
 *
 *   On reconnect the edge reads `resume.max_seq` from any response and replays
 *   only what the platform does not have.
 *
 * WHAT IS NOT HERE, DELIBERATELY. No AI, no inference, no smoothing, no
 * "helpful" correction of an out-of-range reading. This layer decides whether a
 * row is admissible and stores it exactly as the machine sent it. Anything that
 * interprets a reading belongs downstream of the stored truth, never in front
 * of it.
 */

import * as types from "@/lib/types";
import { validateTelemetryEvent } from "@/lib/validators";

// ============================================================================
// LIMITS
// ============================================================================

/**
 * A 1 Hz stream from one machine is 3,600 events per hour. 500 lets an edge
 * flush eight minutes of backlog in one request while keeping a single body
 * small enough to fail fast. It is a bound on blast radius, not a throughput
 * target: an edge with more than this buffered sends several requests, which is
 * what the resume contract is for.
 */
export const MAX_BATCH_SIZE = 500;

/**
 * A machine whose real-time clock has not been set yet reports 1970, or a date
 * years out. Timestamps are the axis every replay, benchmark and quality
 * comparison is built on, so an implausible one is rejected rather than stored:
 * a wrong timestamp is not a small error, it is a row that silently reorders
 * the history of a job.
 */
export const MAX_CLOCK_SKEW_AHEAD_MS = 24 * 60 * 60 * 1000;
export const EARLIEST_PLAUSIBLE_TIMESTAMP_MS = Date.UTC(2024, 0, 1);

// ============================================================================
// STORE PORT
// ============================================================================

export interface JobOwnership {
  id: string;
  tenant_id: string;
  status: types.JobStatus;
}

export interface TelemetryInsertRow {
  job_id: string;
  robot_id: string;
  timestamp: string;
  event_type: types.EventType;
  data: Record<string, unknown>;
  seq: number;
  provenance: types.Provenance;
  device_credential_id: string;
  firmware_version?: string;
  software_version?: string;
}

export interface TelemetryRejectRow {
  device_credential_id: string | null;
  claimed_robot_id: string | null;
  claimed_job_id: string | null;
  reason_code: RejectCode;
  reason: string;
  raw: unknown;
}

export interface TelemetryStore {
  /** Looks up an *active* credential by SHA-256 hex of the presented key. */
  findActiveCredentialByKeyHash(
    keyHash: string
  ): Promise<types.DeviceCredential | null>;

  /** Ownership and status for the given job ids. Missing ids are simply absent. */
  getJobs(jobIds: string[]): Promise<JobOwnership[]>;

  /**
   * Inserts with ON CONFLICT (robot_id, job_id, seq) DO NOTHING and returns the
   * `seq` values that were actually written. Everything else in the batch was
   * already stored, which is the definition of a duplicate here.
   */
  insertEvents(rows: TelemetryInsertRow[]): Promise<{ insertedSeqs: number[] }>;

  /** Dead-letter. Best-effort: a reject that cannot be stored must not fail ingest. */
  recordRejects(rows: TelemetryRejectRow[]): Promise<void>;

  /** Highest stored seq for the pair, or null if the platform holds nothing. */
  maxSeq(robotId: string, jobId: string): Promise<number | null>;

  /** Liveness for the fleet view. Best-effort. */
  touchCredential(credentialId: string): Promise<void>;
}

// ============================================================================
// RESULT VOCABULARY
// ============================================================================

export type RejectCode =
  | "VALIDATION_FAILED"
  | "INVALID_SEQ"
  | "ROBOT_MISMATCH"
  | "JOB_NOT_FOUND"
  | "JOB_TENANT_MISMATCH"
  | "JOB_ARCHIVED"
  | "IMPLAUSIBLE_TIMESTAMP";

export type EventOutcome = "accepted" | "duplicate" | "rejected";

export interface EventResult {
  index: number;
  seq: number | null;
  outcome: EventOutcome;
  reason_code?: RejectCode;
  reason?: string;
}

export interface IngestReport {
  accepted: number;
  duplicate: number;
  rejected: number;
  results: EventResult[];
  /** Per (robot_id, job_id) high-water marks, for edge resume after an outage. */
  resume: Array<{ robot_id: string; job_id: string; max_seq: number | null }>;
}

export type IngestFailureCode =
  | "UNAUTHENTICATED"
  | "CREDENTIAL_UNKNOWN"
  | "MALFORMED_BODY"
  | "EMPTY_BATCH"
  | "BATCH_TOO_LARGE";

export class IngestError extends Error {
  readonly code: IngestFailureCode;
  readonly status: number;

  constructor(code: IngestFailureCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "IngestError";
  }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Devices present `Authorization: Bearer <key>`. The key is never stored — the
 * platform holds SHA-256 of it — so this is a lookup by digest, not a string
 * comparison, and there is no timing channel to exploit.
 */
export function parseBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

export type Sha256Hex = (input: string) => string;

/**
 * Resolves an `Authorization: Bearer` header to an active credential, or throws.
 *
 * Shared by ingest and by the resume endpoint, so there is exactly one place
 * that decides what a valid device is. Two implementations of that question is
 * how one of them ends up more permissive than the other.
 */
export async function authenticateDevice(
  store: Pick<TelemetryStore, "findActiveCredentialByKeyHash">,
  sha256Hex: Sha256Hex,
  authorizationHeader: string | null | undefined
): Promise<types.DeviceCredential> {
  const token = parseBearerToken(authorizationHeader);
  if (!token) {
    throw new IngestError(
      "UNAUTHENTICATED",
      "Missing Authorization: Bearer <device key>",
      401
    );
  }

  const credential = await store.findActiveCredentialByKeyHash(sha256Hex(token));
  if (!credential) {
    // Unknown and revoked are the same answer on purpose. Telling a caller that
    // a key existed but was revoked confirms the key, and confirms the machine.
    throw new IngestError("CREDENTIAL_UNKNOWN", "Unknown or revoked device key", 401);
  }
  return credential;
}

// ============================================================================
// INGEST
// ============================================================================

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Normalises a request body into a list of candidate events.
 * Accepts a single event, a bare array, or `{ events: [...] }` — the three
 * shapes a firmware author will reach for. Anything else is a malformed body.
 */
export function normaliseBatch(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (isPlainObject(body) && Array.isArray(body.events)) return body.events;
  if (isPlainObject(body)) return [body];
  throw new IngestError(
    "MALFORMED_BODY",
    "Body must be a telemetry event, an array of events, or { events: [...] }",
    400
  );
}

function readSeq(raw: unknown): number | null {
  if (!isPlainObject(raw)) return null;
  const v = raw.seq;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) return null;
  return v;
}

// ----------------------------------------------------------------------------
// Composite keys
// ----------------------------------------------------------------------------
//
// A robot id or job id could in principle contain any separator character
// chosen by hand, and a collision here would silently merge two machines'
// streams. JSON encoding is unambiguous for every input, which is worth more
// than the microseconds a string concatenation would save on a 500-row batch.

function idempotencyKey(robotId: string, jobId: string, seq: number): string {
  return JSON.stringify([robotId, jobId, seq]);
}

function pairKey(robotId: string, jobId: string): string {
  return JSON.stringify([robotId, jobId]);
}

function splitPairKey(key: string): [string, string] {
  return JSON.parse(key) as [string, string];
}

export interface IngestOptions {
  store: TelemetryStore;
  sha256Hex: Sha256Hex;
  authorizationHeader: string | null | undefined;
  body: unknown;
  /** Injected so tests are not a function of the wall clock. */
  now?: () => number;
}

export async function ingestTelemetry(opts: IngestOptions): Promise<IngestReport> {
  const { store, sha256Hex, authorizationHeader, body } = opts;
  const now = opts.now ?? Date.now;

  // --- 1. Who is this ------------------------------------------------------
  const credential = await authenticateDevice(store, sha256Hex, authorizationHeader);

  // --- 2. Envelope ---------------------------------------------------------
  const candidates = normaliseBatch(body);
  if (candidates.length === 0) {
    throw new IngestError("EMPTY_BATCH", "At least one event is required", 400);
  }
  if (candidates.length > MAX_BATCH_SIZE) {
    throw new IngestError(
      "BATCH_TOO_LARGE",
      `Batch of ${candidates.length} exceeds the limit of ${MAX_BATCH_SIZE}. ` +
        `Send in chunks and use resume.max_seq to confirm what landed.`,
      413
    );
  }

  // --- 3. Per-event admissibility -----------------------------------------
  const results: EventResult[] = new Array(candidates.length);
  const rejects: TelemetryRejectRow[] = [];
  const admissible: Array<{ index: number; row: TelemetryInsertRow }> = [];

  const reject = (
    index: number,
    seq: number | null,
    code: RejectCode,
    reason: string,
    raw: unknown,
    jobId: string | null
  ) => {
    results[index] = { index, seq, outcome: "rejected", reason_code: code, reason };
    rejects.push({
      device_credential_id: credential.id,
      claimed_robot_id: credential.robot_id,
      claimed_job_id: jobId,
      reason_code: code,
      reason,
      raw,
    });
  };

  // Job ownership is resolved in one query for the whole batch rather than per
  // event: a 500-event flush from one machine touches one job.
  const claimedJobIds = Array.from(
    new Set(
      candidates
        .map((c) => (isPlainObject(c) && typeof c.job_id === "string" ? c.job_id : null))
        .filter((v): v is string => v !== null)
    )
  );
  const jobs = claimedJobIds.length ? await store.getJobs(claimedJobIds) : [];
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  const nowMs = now();
  const provenance = types.provenanceForDeviceKind(credential.kind);

  for (let i = 0; i < candidates.length; i++) {
    const raw = candidates[i];
    const seq = readSeq(raw);
    const claimedJobId =
      isPlainObject(raw) && typeof raw.job_id === "string" ? raw.job_id : null;

    if (seq === null) {
      reject(
        i,
        null,
        "INVALID_SEQ",
        "Each event requires `seq`: a non-negative integer, monotonically " +
          "increasing per (robot_id, job_id), assigned by the edge. It is what " +
          "makes a retry distinguishable from a second reading.",
        raw,
        claimedJobId
      );
      continue;
    }

    const validation = validateTelemetryEvent(raw);
    if (!validation.valid) {
      reject(
        i,
        seq,
        "VALIDATION_FAILED",
        validation.errors!.map((e) => `${e.field}: ${e.message}`).join("; "),
        raw,
        claimedJobId
      );
      continue;
    }
    const event = validation.data!;

    // A machine may only ever speak for itself. Without this, one leaked
    // credential forges the quality record of every machine in the fleet.
    if (event.robot_id !== credential.robot_id) {
      reject(
        i,
        seq,
        "ROBOT_MISMATCH",
        `Credential is bound to robot ${credential.robot_id}; event claims ${event.robot_id}`,
        raw,
        event.job_id
      );
      continue;
    }

    const ts = Date.parse(event.timestamp);
    if (ts > nowMs + MAX_CLOCK_SKEW_AHEAD_MS || ts < EARLIEST_PLAUSIBLE_TIMESTAMP_MS) {
      reject(
        i,
        seq,
        "IMPLAUSIBLE_TIMESTAMP",
        `Timestamp ${event.timestamp} is outside the plausible window. ` +
          `Check the machine's real-time clock before replaying.`,
        raw,
        event.job_id
      );
      continue;
    }

    const job = jobById.get(event.job_id);
    if (!job) {
      reject(i, seq, "JOB_NOT_FOUND", `No job ${event.job_id}`, raw, event.job_id);
      continue;
    }
    if (job.tenant_id !== credential.tenant_id) {
      // Same answer shape as JOB_NOT_FOUND would give, but recorded distinctly
      // in the dead-letter table: a credential probing another tenant's job ids
      // is a security event, not a bug report.
      reject(
        i,
        seq,
        "JOB_TENANT_MISMATCH",
        `No job ${event.job_id}`,
        raw,
        event.job_id
      );
      continue;
    }
    if (job.status === "archived") {
      reject(
        i,
        seq,
        "JOB_ARCHIVED",
        `Job ${event.job_id} is archived and no longer accepts telemetry`,
        raw,
        event.job_id
      );
      continue;
    }

    const envelope = raw as Record<string, unknown>;
    admissible.push({
      index: i,
      row: {
        job_id: event.job_id,
        robot_id: event.robot_id,
        timestamp: event.timestamp,
        event_type: event.event_type,
        data: event.data,
        seq,
        provenance,
        device_credential_id: credential.id,
        firmware_version:
          typeof envelope.firmware_version === "string"
            ? envelope.firmware_version
            : undefined,
        software_version:
          typeof envelope.software_version === "string"
            ? envelope.software_version
            : undefined,
      },
    });
  }

  // --- 4. Store ------------------------------------------------------------
  //
  // A batch can contain the same seq twice — an edge that retried mid-flush.
  // Deduplicating here keeps the insert from conflicting with itself; the first
  // occurrence is written and the rest are reported as duplicates, which is the
  // same answer the database would give on a second request.
  const seenInBatch = new Set<string>();
  const toInsert: Array<{ index: number; row: TelemetryInsertRow }> = [];
  const dupInBatch: Array<{ index: number; row: TelemetryInsertRow }> = [];
  for (const entry of admissible) {
    const key = idempotencyKey(entry.row.robot_id, entry.row.job_id, entry.row.seq);
    if (seenInBatch.has(key)) dupInBatch.push(entry);
    else {
      seenInBatch.add(key);
      toInsert.push(entry);
    }
  }

  let insertedSeqs = new Set<number>();
  if (toInsert.length > 0) {
    const res = await store.insertEvents(toInsert.map((e) => e.row));
    insertedSeqs = new Set(res.insertedSeqs);
  }

  for (const entry of toInsert) {
    results[entry.index] = {
      index: entry.index,
      seq: entry.row.seq,
      outcome: insertedSeqs.has(entry.row.seq) ? "accepted" : "duplicate",
    };
  }
  for (const entry of dupInBatch) {
    results[entry.index] = {
      index: entry.index,
      seq: entry.row.seq,
      outcome: "duplicate",
    };
  }

  // Dead-lettering must never turn a successful ingest into a failure. If the
  // rejects table is unavailable the accepted events still stand, and the
  // machine still gets a per-event answer.
  if (rejects.length > 0) {
    try {
      await store.recordRejects(rejects);
    } catch {
      /* observability degrades; ingest does not */
    }
  }
  try {
    await store.touchCredential(credential.id);
  } catch {
    /* liveness degrades; ingest does not */
  }

  // --- 5. Resume high-water marks -----------------------------------------
  const pairs = Array.from(
    new Set(admissible.map((e) => pairKey(e.row.robot_id, e.row.job_id)))
  );
  const resume = await Promise.all(
    pairs.map(async (p) => {
      const [robot_id, job_id] = splitPairKey(p);
      return { robot_id, job_id, max_seq: await store.maxSeq(robot_id, job_id) };
    })
  );

  const accepted = results.filter((r) => r.outcome === "accepted").length;
  const duplicate = results.filter((r) => r.outcome === "duplicate").length;
  const rejected = results.filter((r) => r.outcome === "rejected").length;

  return { accepted, duplicate, rejected, results, resume };
}
