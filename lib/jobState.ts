/**
 * Job status transitions.
 *
 * migrations/001_initial_schema.sql:380-406 wrote out nine transition rules in
 * a comment and then enforced exactly one of them — nothing leaves `archived`.
 * Everything else was legal, so a job could go `draft -> approved` without ever
 * having run, and `app/api/jobs/[id]/route.ts:56` wrote `status` straight from
 * the request body with no enum check at all, so `{"status":"definitely_done"}`
 * reached Postgres.
 *
 * A completion report is a commercial document. If a job can reach `approved`
 * without passing through `in_progress` and `completed`, then "approved" means
 * nothing, and so does every report, warranty and pilot metric derived from it.
 *
 * TWO ENFORCEMENT POINTS, DELIBERATELY. This table is enforced here, where a
 * bad transition becomes a 409 with a message naming what was allowed, and
 * again by the trigger in migrations/002_telemetry_integrity.sql §6, which
 * refuses it even if a future code path forgets to ask. The two are kept
 * identical by tests/contract/job-state-machine.test.mjs, which parses the SQL
 * and fails when they drift — the same class of drift that made the event
 * vocabulary unstorable for months.
 *
 * The application check is not redundant with the database check. Without it
 * the user-facing failure is an opaque Postgres exception; without the database
 * check, the rule holds only for callers who went through this file.
 */

import type { JobStatus } from "@/lib/types";

export const JOB_TRANSITIONS: Readonly<Record<JobStatus, readonly JobStatus[]>> =
  Object.freeze({
    /** Being written. May be queued for a machine, started by hand, or abandoned. */
    draft: ["queued", "in_progress", "failed", "archived"],
    /** Scheduled. May go back to draft while nothing has run yet. */
    queued: ["in_progress", "draft", "failed", "archived"],
    /** A machine is working. Only pausing, finishing or failing from here. */
    in_progress: ["paused", "completed", "failed", "archived"],
    /** Stopped mid-job. Resume or abandon — a paused job was never completed. */
    paused: ["in_progress", "failed", "archived"],
    /** The machine finished. Inspection decides between approved and rework. */
    completed: ["approved", "rework", "failed", "archived"],
    /** Inspected and accepted. Terminal except for archival. */
    approved: ["archived"],
    /** Inspection refused it. Back into the queue for another attempt. */
    rework: ["queued", "failed", "archived"],
    /** Terminal. */
    failed: ["archived"],
    /** Immutable. The audit trail is the point. */
    archived: [],
  });

export const JOB_STATUSES = Object.keys(JOB_TRANSITIONS) as JobStatus[];

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && value in JOB_TRANSITIONS;
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  // A no-op update is always legal: a PATCH that restates the current status
  // alongside a coverage update is the common case, not an error.
  if (from === to) return true;
  return JOB_TRANSITIONS[from].includes(to);
}

export class IllegalTransitionError extends Error {
  readonly code = "ILLEGAL_STATUS_TRANSITION";
  constructor(
    readonly from: JobStatus,
    readonly to: JobStatus
  ) {
    const allowed = JOB_TRANSITIONS[from];
    super(
      `Illegal job status transition: ${from} → ${to}. ` +
        (allowed.length
          ? `Allowed from ${from}: ${allowed.join(", ")}.`
          : `${from} is terminal.`)
    );
    this.name = "IllegalTransitionError";
  }
}

export function assertTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}

/**
 * Statuses in which a job is expected to be producing telemetry. Used by the
 * fleet view to tell "quiet because it is finished" from "quiet because it
 * stopped reporting", which are the same picture and very different problems.
 */
export const TELEMETRY_ACTIVE_STATUSES: readonly JobStatus[] = Object.freeze([
  "in_progress",
  "paused",
]);
