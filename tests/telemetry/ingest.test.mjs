/**
 * The telemetry ingest contract.
 *
 * These are the properties a machine is built against. If any of them stops
 * being true, an edge in the field either loses data, spins forever on a poison
 * event, or writes evidence it has no right to write.
 *
 * The store is in-memory and the clock is injected, so nothing here depends on
 * a database, a network or the time of day. That is the whole reason
 * lib/telemetry/ingest.ts is a pure function of an injected store.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  ingestTelemetry,
  IngestError,
  MAX_BATCH_SIZE,
} from "@/lib/telemetry/ingest";

const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");

const NOW = Date.parse("2026-09-06T12:00:00.000Z");
const now = () => NOW;

const TENANT_A = "11111111-1111-1111-1111-111111111111";
const TENANT_B = "22222222-2222-2222-2222-222222222222";

const HARDWARE_KEY = "ffk_hardware_key";
const SIM_KEY = "ffk_simulator_key";
const REVOKED_KEY = "ffk_revoked_key";
const OTHER_ROBOT_KEY = "ffk_other_robot_key";

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

function makeStore(overrides = {}) {
  const credentials = [
    {
      id: "cred-hw",
      robot_id: "FF-S001",
      tenant_id: TENANT_A,
      kind: "hardware",
      key_prefix: "ffk_hard",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      _hash: sha256Hex(HARDWARE_KEY),
    },
    {
      id: "cred-sim",
      robot_id: "FF-S001",
      tenant_id: TENANT_A,
      kind: "simulator",
      key_prefix: "ffk_simu",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      _hash: sha256Hex(SIM_KEY),
    },
    {
      id: "cred-other",
      robot_id: "FF-S999",
      tenant_id: TENANT_A,
      kind: "hardware",
      key_prefix: "ffk_othe",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      _hash: sha256Hex(OTHER_ROBOT_KEY),
    },
    // Revoked credentials are simply not returned by the lookup, exactly as
    // the `.eq("status","active")` filter in lib/db/service.ts does it.
    {
      id: "cred-revoked",
      robot_id: "FF-S001",
      tenant_id: TENANT_A,
      kind: "hardware",
      key_prefix: "ffk_revo",
      status: "revoked",
      created_at: "2026-01-01T00:00:00.000Z",
      _hash: sha256Hex(REVOKED_KEY),
    },
  ];

  const jobs = [
    { id: "job-a", tenant_id: TENANT_A, status: "in_progress" },
    { id: "job-archived", tenant_id: TENANT_A, status: "archived" },
    { id: "job-other-tenant", tenant_id: TENANT_B, status: "in_progress" },
  ];

  const rows = [];
  const rejects = [];
  const touched = [];

  const store = {
    rows,
    rejects,
    touched,

    async findActiveCredentialByKeyHash(hash) {
      const hit = credentials.find((c) => c._hash === hash && c.status === "active");
      if (!hit) return null;
      const { _hash, ...rest } = hit;
      void _hash;
      return rest;
    },

    async getJobs(ids) {
      return jobs.filter((j) => ids.includes(j.id));
    },

    async insertEvents(insertRows) {
      // Mirrors ON CONFLICT (robot_id, job_id, seq) DO NOTHING ... RETURNING seq.
      const insertedSeqs = [];
      for (const row of insertRows) {
        const clash = rows.some(
          (r) =>
            r.robot_id === row.robot_id &&
            r.job_id === row.job_id &&
            r.seq === row.seq
        );
        if (clash) continue;
        rows.push(row);
        insertedSeqs.push(row.seq);
      }
      return { insertedSeqs };
    },

    async recordRejects(rs) {
      rejects.push(...rs);
    },

    async maxSeq(robotId, jobId) {
      const seqs = rows
        .filter((r) => r.robot_id === robotId && r.job_id === jobId)
        .map((r) => r.seq);
      return seqs.length ? Math.max(...seqs) : null;
    },

    async touchCredential(id) {
      touched.push(id);
    },
  };

  return Object.assign(store, overrides);
}

function event(overrides = {}) {
  return {
    seq: 0,
    job_id: "job-a",
    robot_id: "FF-S001",
    timestamp: "2026-09-06T11:59:00.000Z",
    event_type: "pressure_reading",
    data: { psi: 3.1, sensor_health: "ok" },
    ...overrides,
  };
}

function ingest(store, key, body, extra = {}) {
  return ingestTelemetry({
    store,
    sha256Hex,
    authorizationHeader: key === null ? null : `Bearer ${key}`,
    body,
    now,
    ...extra,
  });
}

async function captureThrow(fn) {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  assert.fail("expected the call to reject, and it resolved");
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

test("an unauthenticated request is refused", async () => {
  // Before this, POST /api/telemetry accepted quality evidence from anyone on
  // the internet for any robot on any job.
  const store = makeStore();
  const err = await captureThrow(() => ingest(store, null, event()));
  assert.ok(err instanceof IngestError);
  assert.equal(err.code, "UNAUTHENTICATED");
  assert.equal(err.status, 401);
  assert.equal(store.rows.length, 0);
});

test("a malformed Authorization header is not a credential", async () => {
  const store = makeStore();
  for (const header of ["", "Bearer", "Basic abc", "ffk_hardware_key"]) {
    const err = await captureThrow(() =>
      ingestTelemetry({
        store,
        sha256Hex,
        authorizationHeader: header,
        body: event(),
        now,
      })
    );
    assert.equal(err.code, "UNAUTHENTICATED", `header ${JSON.stringify(header)}`);
  }
});

test("a revoked key is refused, and is indistinguishable from an unknown one", async () => {
  // Same code and message for both: telling a caller that a key existed but was
  // revoked confirms the key, and confirms the machine.
  const store = makeStore();
  const revoked = await captureThrow(() => ingest(store, REVOKED_KEY, event()));
  const unknown = await captureThrow(() => ingest(store, "ffk_never_issued", event()));

  assert.equal(revoked.code, "CREDENTIAL_UNKNOWN");
  assert.equal(unknown.code, "CREDENTIAL_UNKNOWN");
  assert.equal(revoked.message, unknown.message);
  assert.equal(revoked.status, 401);
});

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

test("provenance comes from the credential, not from the request body", async () => {
  // The single property that keeps the dataset admissible. lib/simulation.ts
  // emits events in the exact shape of the firmware contract; if a simulator
  // could stamp them `measured`, no query could ever separate what was measured
  // from what was modelled, and every quality claim would be unprovable.
  const store = makeStore();

  await ingest(store, SIM_KEY, event({ seq: 1, provenance: "measured" }));
  assert.equal(store.rows.length, 1);
  assert.equal(store.rows[0].provenance, "simulated");

  await ingest(store, HARDWARE_KEY, event({ seq: 2 }));
  assert.equal(store.rows[1].provenance, "measured");
});

test("stored rows carry the credential that produced them", async () => {
  const store = makeStore();
  await ingest(store, HARDWARE_KEY, event());
  assert.equal(store.rows[0].device_credential_id, "cred-hw");
});

// ---------------------------------------------------------------------------
// Forgery
// ---------------------------------------------------------------------------

test("a credential may only speak for its own robot", async () => {
  // One leaked key must not be able to forge the quality record of every
  // machine in the fleet.
  const store = makeStore();
  const report = await ingest(
    store,
    OTHER_ROBOT_KEY, // bound to FF-S999
    event({ robot_id: "FF-S001" })
  );

  assert.equal(report.accepted, 0);
  assert.equal(report.rejected, 1);
  assert.equal(report.results[0].reason_code, "ROBOT_MISMATCH");
  assert.equal(store.rows.length, 0);
});

test("a job in another tenant answers exactly as a job that does not exist", async () => {
  // Otherwise one valid device key becomes an oracle for enumerating every job
  // id on the platform.
  const store = makeStore();

  const foreign = await ingest(
    store,
    HARDWARE_KEY,
    event({ seq: 1, job_id: "job-other-tenant" })
  );
  const missing = await ingest(
    store,
    HARDWARE_KEY,
    event({ seq: 2, job_id: "job-does-not-exist" })
  );

  assert.equal(foreign.results[0].outcome, "rejected");
  assert.equal(missing.results[0].outcome, "rejected");
  assert.equal(
    foreign.results[0].reason,
    "No job job-other-tenant",
    "the caller-visible reason must not reveal that the job exists elsewhere"
  );
  assert.equal(missing.results[0].reason, "No job job-does-not-exist");

  // The dead-letter table does distinguish them: a credential probing another
  // tenant's job ids is a security event, not a bug report.
  const codes = store.rejects.map((r) => r.reason_code);
  assert.deepEqual(codes, ["JOB_TENANT_MISMATCH", "JOB_NOT_FOUND"]);
});

test("an archived job accepts nothing further", async () => {
  const store = makeStore();
  const report = await ingest(store, HARDWARE_KEY, event({ job_id: "job-archived" }));
  assert.equal(report.results[0].reason_code, "JOB_ARCHIVED");
  assert.equal(store.rows.length, 0);
});

// ---------------------------------------------------------------------------
// Idempotency and resume — the offline-first contract
// ---------------------------------------------------------------------------

test("replaying a batch stores nothing twice", async () => {
  // An edge that flushed successfully and lost the response retries the whole
  // batch. Every event must come back `duplicate`, not `accepted`, or the job's
  // pressure history is silently doubled.
  const store = makeStore();
  const batch = [event({ seq: 0 }), event({ seq: 1 }), event({ seq: 2 })];

  const first = await ingest(store, HARDWARE_KEY, batch);
  assert.equal(first.accepted, 3);
  assert.equal(first.duplicate, 0);

  const replay = await ingest(store, HARDWARE_KEY, batch);
  assert.equal(replay.accepted, 0);
  assert.equal(replay.duplicate, 3);
  assert.equal(store.rows.length, 3);
});

test("a batch that repeats a seq within itself is deduplicated", async () => {
  // An edge that retried mid-flush can send the same event twice in one body.
  // Without this the insert conflicts with itself.
  const store = makeStore();
  const report = await ingest(store, HARDWARE_KEY, [
    event({ seq: 7 }),
    event({ seq: 7 }),
    event({ seq: 8 }),
  ]);

  assert.equal(report.accepted, 2);
  assert.equal(report.duplicate, 1);
  assert.equal(store.rows.length, 2);
  assert.equal(report.results[0].outcome, "accepted");
  assert.equal(report.results[1].outcome, "duplicate");
});

test("the same seq on a different job is a different event", async () => {
  const store = makeStore({
    async getJobs(ids) {
      return [
        { id: "job-a", tenant_id: TENANT_A, status: "in_progress" },
        { id: "job-a2", tenant_id: TENANT_A, status: "in_progress" },
      ].filter((j) => ids.includes(j.id));
    },
  });

  await ingest(store, HARDWARE_KEY, event({ seq: 5, job_id: "job-a" }));
  await ingest(store, HARDWARE_KEY, event({ seq: 5, job_id: "job-a2" }));
  assert.equal(store.rows.length, 2, "seq is scoped to (robot_id, job_id)");
});

test("the response tells a reconnecting machine where to resume from", async () => {
  const store = makeStore();
  await ingest(store, HARDWARE_KEY, [event({ seq: 0 }), event({ seq: 1 })]);

  const report = await ingest(store, HARDWARE_KEY, [event({ seq: 2 })]);
  assert.deepEqual(report.resume, [
    { robot_id: "FF-S001", job_id: "job-a", max_seq: 2 },
  ]);
});

test("a missing or malformed seq is refused with an explanation", async () => {
  const store = makeStore();
  const report = await ingest(store, HARDWARE_KEY, [
    event({ seq: undefined }),
    event({ seq: -1 }),
    event({ seq: 1.5 }),
    event({ seq: "3" }),
  ]);

  assert.equal(report.accepted, 0);
  assert.equal(report.rejected, 4);
  for (const r of report.results) assert.equal(r.reason_code, "INVALID_SEQ");
  // The message has to be actionable: a firmware author reads it, not a doc.
  assert.match(report.results[0].reason, /non-negative integer/);
});

// ---------------------------------------------------------------------------
// Poison events
// ---------------------------------------------------------------------------

test("one bad event does not take the batch down with it", async () => {
  // This is what a 500 used to do. A single malformed event failed the whole
  // request, so a machine either dropped good data or retried the poison
  // forever.
  const store = makeStore();
  const report = await ingest(store, HARDWARE_KEY, [
    event({ seq: 0 }),
    event({ seq: 1, event_type: "not_a_real_event" }),
    event({ seq: 2 }),
  ]);

  assert.equal(report.accepted, 2);
  assert.equal(report.rejected, 1);
  assert.equal(report.results[1].reason_code, "VALIDATION_FAILED");
  assert.equal(store.rows.length, 2);
});

test("every rejected event is dead-lettered with its raw body", async () => {
  // A rejected event that vanishes is indistinguishable, from the operator's
  // side, from one that was never sent.
  const store = makeStore();
  const bad = event({ seq: 4, event_type: "nope" });
  await ingest(store, HARDWARE_KEY, [bad]);

  assert.equal(store.rejects.length, 1);
  assert.deepEqual(store.rejects[0].raw, bad);
  assert.equal(store.rejects[0].device_credential_id, "cred-hw");
  assert.equal(store.rejects[0].claimed_job_id, "job-a");
});

test("a dead-letter failure does not fail an otherwise good ingest", async () => {
  const store = makeStore({
    async recordRejects() {
      throw new Error("rejects table unavailable");
    },
  });

  const report = await ingest(store, HARDWARE_KEY, [
    event({ seq: 0 }),
    event({ seq: 1, event_type: "nope" }),
  ]);

  assert.equal(report.accepted, 1);
  assert.equal(report.rejected, 1);
  assert.equal(store.rows.length, 1, "observability degrades; ingest does not");
});

test("an implausible timestamp is refused rather than stored", async () => {
  // A machine whose real-time clock has not been set reports 1970 or a date
  // years out. Timestamps are the axis every replay and benchmark is built on.
  const store = makeStore();
  const report = await ingest(store, HARDWARE_KEY, [
    event({ seq: 0, timestamp: "1970-01-01T00:00:00.000Z" }),
    event({ seq: 1, timestamp: "2031-01-01T00:00:00.000Z" }),
    event({ seq: 2, timestamp: "2026-09-06T11:59:59.000Z" }),
  ]);

  assert.equal(report.results[0].reason_code, "IMPLAUSIBLE_TIMESTAMP");
  assert.equal(report.results[1].reason_code, "IMPLAUSIBLE_TIMESTAMP");
  assert.equal(report.results[2].outcome, "accepted");
});

test("a small clock skew is tolerated", async () => {
  // Rejecting anything a second ahead of the server would refuse telemetry from
  // a perfectly healthy machine with a slightly fast clock.
  const store = makeStore();
  const report = await ingest(
    store,
    HARDWARE_KEY,
    event({ seq: 0, timestamp: new Date(NOW + 60_000).toISOString() })
  );
  assert.equal(report.accepted, 1);
});

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

test("a single event, a bare array and { events: [...] } all work", async () => {
  // Three shapes a firmware author will reach for. Refusing two of them means
  // an integration failure that looks like an outage.
  for (const [label, body] of [
    ["single", event({ seq: 0 })],
    ["array", [event({ seq: 1 })]],
    ["wrapped", { events: [event({ seq: 2 })] }],
  ]) {
    const store = makeStore();
    const report = await ingest(store, HARDWARE_KEY, body);
    assert.equal(report.accepted, 1, `${label} envelope was not accepted`);
  }
});

test("an empty batch is refused", async () => {
  const store = makeStore();
  const err = await captureThrow(() => ingest(store, HARDWARE_KEY, []));
  assert.equal(err.code, "EMPTY_BATCH");
  assert.equal(err.status, 400);
});

test("an oversized batch is refused with a splittable answer", async () => {
  const store = makeStore();
  const tooMany = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) =>
    event({ seq: i })
  );
  const err = await captureThrow(() => ingest(store, HARDWARE_KEY, tooMany));

  assert.equal(err.code, "BATCH_TOO_LARGE");
  assert.equal(err.status, 413);
  assert.match(err.message, /resume\.max_seq/);
  assert.equal(store.rows.length, 0, "an oversized batch must be all-or-nothing");
});

test("a batch of exactly the limit is accepted", async () => {
  const store = makeStore();
  const full = Array.from({ length: MAX_BATCH_SIZE }, (_, i) => event({ seq: i }));
  const report = await ingest(store, HARDWARE_KEY, full);
  assert.equal(report.accepted, MAX_BATCH_SIZE);
});

test("a body that is not an envelope at all is refused", async () => {
  const store = makeStore();
  for (const body of ["a string", 42, null]) {
    const err = await captureThrow(() => ingest(store, HARDWARE_KEY, body));
    assert.equal(err.code, "MALFORMED_BODY", `body ${JSON.stringify(body)}`);
  }
});

// ---------------------------------------------------------------------------
// Firmware compatibility
// ---------------------------------------------------------------------------

test("device_id is accepted as a synonym for robot_id", async () => {
  // The firmware envelope calls it `device_id`
  // (SOFTWARE_HARDWARE_CONTRACT.md:88); the platform calls it `robot_id`.
  const store = makeStore();
  const report = await ingest(store, HARDWARE_KEY, {
    seq: 0,
    job_id: "job-a",
    device_id: "FF-S001",
    timestamp: "2026-09-06T11:59:00.000Z",
    event_type: "coverage_checkpoint",
    data: { pass_number: 1, distance_traveled_m: 40, estimated_coverage_pct: 12 },
  });

  assert.equal(report.accepted, 1);
  assert.equal(store.rows[0].robot_id, "FF-S001");
});

test("firmware and software versions are recorded when supplied", async () => {
  // Version provenance: a quality result that cannot say which firmware
  // produced it cannot be compared across a fleet upgrade.
  const store = makeStore();
  await ingest(
    store,
    HARDWARE_KEY,
    event({ seq: 0, firmware_version: "1.4.2", software_version: "2026.09.1" })
  );
  assert.equal(store.rows[0].firmware_version, "1.4.2");
  assert.equal(store.rows[0].software_version, "2026.09.1");
});

test("the credential's liveness is updated on a successful ingest", async () => {
  const store = makeStore();
  await ingest(store, HARDWARE_KEY, event());
  assert.deepEqual(store.touched, ["cred-hw"]);
});

test("results are returned in request order", async () => {
  // An edge matches results to its buffer by index. Reordering silently
  // mislabels which events landed.
  const store = makeStore();
  const report = await ingest(store, HARDWARE_KEY, [
    event({ seq: 0 }),
    event({ seq: 1, event_type: "nope" }),
    event({ seq: 2 }),
    event({ seq: 3, robot_id: "FF-S999" }),
  ]);

  assert.deepEqual(
    report.results.map((r) => r.index),
    [0, 1, 2, 3]
  );
  assert.deepEqual(
    report.results.map((r) => r.outcome),
    ["accepted", "rejected", "accepted", "rejected"]
  );
});
