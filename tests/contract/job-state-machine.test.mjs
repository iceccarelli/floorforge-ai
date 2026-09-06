/**
 * The job state machine is enforced in two places. They must agree.
 *
 * lib/jobState.ts returns a 409 naming what was allowed; the trigger in
 * migrations/002_telemetry_integrity.sql §6 refuses the write even if a future
 * code path never asks. Neither is redundant — without the first the failure is
 * an opaque Postgres exception, without the second the rule holds only for
 * callers who went through that one file.
 *
 * Two enforcement points is also two places to drift, which is the failure this
 * repository has already had once with the event vocabulary. So the SQL is
 * parsed and compared against the TypeScript.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  JOB_TRANSITIONS,
  JOB_STATUSES,
  canTransition,
  assertTransition,
  isJobStatus,
  IllegalTransitionError,
} from "@/lib/jobState";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Reads the CASE arms out of validate_job_status_transition(). */
function sqlTransitions() {
  const sql = readFileSync(
    path.join(ROOT, "migrations", "002_telemetry_integrity.sql"),
    "utf8"
  );

  const fn = /CREATE OR REPLACE FUNCTION validate_job_status_transition\(\)([\s\S]*?)\$\$ LANGUAGE plpgsql;/.exec(
    sql
  );
  assert.ok(fn, "validate_job_status_transition() not found in migration 002");

  const table = {};
  for (const m of fn[1].matchAll(
    /WHEN '([a-z_]+)'\s+THEN ARRAY\[([^\]]*)\]::job_status\[\]/g
  )) {
    const from = m[1];
    const to = [...m[2].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
    table[from] = to.sort();
  }
  return table;
}

test("the SQL trigger and lib/jobState.ts encode the same transition table", () => {
  const sql = sqlTransitions();
  const ts = Object.fromEntries(
    Object.entries(JOB_TRANSITIONS).map(([from, to]) => [from, [...to].sort()])
  );

  assert.deepEqual(
    Object.keys(sql).sort(),
    Object.keys(ts).sort(),
    "the two tables cover different sets of statuses"
  );

  for (const from of Object.keys(ts)) {
    assert.deepEqual(
      sql[from],
      ts[from],
      `transitions out of "${from}" differ between the database trigger and ` +
        `lib/jobState.ts. The database wins on writes that bypass the API, so a ` +
        `disagreement means the 409 the caller sees is not the rule being enforced.`
    );
  }
});

test("every JobStatus in lib/types.ts has a row in the transition table", () => {
  // Reading the union from source rather than from JOB_TRANSITIONS, so adding a
  // status to types.ts without deciding what it may transition to fails here
  // rather than at runtime with `Cannot read properties of undefined`.
  const src = readFileSync(path.join(ROOT, "lib", "types.ts"), "utf8");
  const block = /export type JobStatus =([\s\S]*?);\n/.exec(src);
  assert.ok(block, "lib/types.ts no longer declares `export type JobStatus`");

  const declared = [...block[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(declared, [...JOB_STATUSES].sort());
});

test("a job cannot be approved without having run", () => {
  // The reason this file exists. migrations/001 enforced one rule of nine, and
  // PATCH /api/jobs/[id] wrote status straight from the request body, so
  // draft -> approved was legal. A completion report is a commercial document;
  // if `approved` can be set on a job that never started, then every report,
  // warranty and pilot metric derived from it means nothing.
  assert.equal(canTransition("draft", "approved"), false);
  assert.equal(canTransition("queued", "approved"), false);
  assert.equal(canTransition("in_progress", "approved"), false);
  assert.equal(canTransition("completed", "approved"), true);
});

test("archived is immutable", () => {
  for (const to of JOB_STATUSES) {
    if (to === "archived") continue;
    assert.equal(
      canTransition("archived", to),
      false,
      `archived -> ${to} must be refused; the audit trail is the point`
    );
  }
});

test("a status may be restated without being a transition", () => {
  // A PATCH that sends the current status alongside a coverage update is the
  // common case from the operator console, not an error.
  for (const s of JOB_STATUSES) {
    assert.equal(canTransition(s, s), true, `${s} -> ${s} must be a no-op`);
  }
});

test("the happy path from draft to archived is walkable", () => {
  const path_ = [
    "draft",
    "queued",
    "in_progress",
    "paused",
    "in_progress",
    "completed",
    "approved",
    "archived",
  ];
  for (let i = 1; i < path_.length; i++) {
    assert.doesNotThrow(
      () => assertTransition(path_[i - 1], path_[i]),
      `${path_[i - 1]} -> ${path_[i]} should be legal`
    );
  }
});

test("rework returns a job to the queue rather than to completed", () => {
  assert.equal(canTransition("completed", "rework"), true);
  assert.equal(canTransition("rework", "queued"), true);
  assert.equal(canTransition("rework", "completed"), false);
  assert.equal(canTransition("rework", "approved"), false);
});

/** node:assert's throws() does not hand back the error, and the error is the point. */
function captureThrow(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }
  assert.fail("expected the call to throw, and it did not");
}

test("an illegal transition names what was allowed", () => {
  const err = captureThrow(() => assertTransition("draft", "approved"));
  assert.ok(err instanceof IllegalTransitionError);
  assert.equal(err.code, "ILLEGAL_STATUS_TRANSITION");
  assert.equal(err.from, "draft");
  assert.equal(err.to, "approved");
  // An error a contractor's integrator has to guess at is a support ticket.
  assert.match(err.message, /Allowed from draft: /);
  assert.match(err.message, /queued/);
});

test("a terminal status says so", () => {
  const err = captureThrow(() => assertTransition("archived", "draft"));
  assert.ok(err instanceof IllegalTransitionError);
  assert.match(err.message, /archived is terminal/);
});

test("isJobStatus rejects arbitrary strings", () => {
  // PATCH /api/jobs/[id]:56 previously assigned `body.status` with no check, so
  // this exact string reached Postgres.
  assert.equal(isJobStatus("definitely_finished"), false);
  assert.equal(isJobStatus(""), false);
  assert.equal(isJobStatus(null), false);
  assert.equal(isJobStatus(42), false);
  // Object.prototype keys must not read as statuses.
  assert.equal(isJobStatus("constructor"), false);
  assert.equal(isJobStatus("toString"), false);
  assert.equal(isJobStatus("in_progress"), true);
});
