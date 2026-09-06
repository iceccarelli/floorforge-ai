/**
 * The simulator's output must survive the real ingest path, end to end.
 *
 * lib/simulation.ts:35 promises that "the day a real D1 posts to
 * /api/telemetry, nothing downstream changes". That promise was false. Two of
 * the five event types it emits — `pressure_reading` at 1 Hz and
 * `coverage_checkpoint` — were accepted by the validator and rejected by the
 * Postgres enum, so the reference telemetry producer was producing telemetry
 * the platform could not store (FLOORFORGE_SYSTEM_BASELINE.md §3.1).
 *
 * This file is what makes that sentence true and keeps it true: it runs a whole
 * simulated job, pushes every event it emits through `ingestTelemetry` exactly
 * as a machine would — batched, authenticated, chunked at MAX_BATCH_SIZE — and
 * fails if a single event is refused or stored as anything other than
 * `simulated`.
 *
 * It also serves as the regression benchmark base the planner work will need:
 * a fixed job id produces a fixed event stream, so any change to the simulator
 * shows up here as a diff rather than as a vibe.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { makeConfig, JobSimulation } from "@/lib/simulation";
import { ingestTelemetry, MAX_BATCH_SIZE } from "@/lib/telemetry/ingest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");

const TENANT = "11111111-1111-1111-1111-111111111111";
const JOB_ID = "job-sim-contract";
const STARTED_AT = new Date("2026-09-06T08:00:00.000Z");
// After the job finishes, so no event looks like a clock-skew fault.
const NOW = Date.parse("2026-09-07T08:00:00.000Z");

/** Deterministic by construction: makeConfig seeds the PRNG from the job id. */
function runSimulation(jobId = JOB_ID, sqft = 1200) {
  return new JobSimulation(makeConfig(sqft, undefined, jobId, STARTED_AT));
}

// ---------------------------------------------------------------------------
// A store with one credential per machine
// ---------------------------------------------------------------------------

function makeFleetStore(deviceIds) {
  const credentials = deviceIds.map((robotId, i) => ({
    id: `cred-${robotId}`,
    robot_id: robotId,
    tenant_id: TENANT,
    kind: "simulator",
    key_prefix: `ffk_sim${i}`,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    key: `ffk_sim_key_${robotId}`,
  }));

  const rows = [];
  const rejects = [];

  return {
    credentials,
    rows,
    rejects,
    keyFor: (robotId) => credentials.find((c) => c.robot_id === robotId).key,

    async findActiveCredentialByKeyHash(hash) {
      const hit = credentials.find((c) => sha256Hex(c.key) === hash);
      if (!hit) return null;
      const { key, ...rest } = hit;
      void key;
      return rest;
    },
    async getJobs(ids) {
      return ids.includes(JOB_ID)
        ? [{ id: JOB_ID, tenant_id: TENANT, status: "in_progress" }]
        : [];
    },
    async insertEvents(insertRows) {
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
    async touchCredential() {},
  };
}

/**
 * Ships a simulated run the way an edge would: grouped by machine, in
 * MAX_BATCH_SIZE chunks, with a per-machine seq. The simulator numbers its
 * events across the whole job, so each machine's stream is renumbered from
 * zero — `seq` is defined per (robot_id, job_id), not per job.
 */
async function shipRun(sim, store) {
  const byDevice = new Map();
  for (const e of sim.allEvents()) {
    if (!byDevice.has(e.device_id)) byDevice.set(e.device_id, []);
    byDevice.get(e.device_id).push(e);
  }

  const reports = [];
  for (const [deviceId, events] of byDevice) {
    const numbered = events.map((e, i) => ({
      seq: i,
      job_id: e.job_id,
      device_id: e.device_id,
      timestamp: e.timestamp,
      event_type: e.event_type,
      data: e.data,
    }));

    for (let i = 0; i < numbered.length; i += MAX_BATCH_SIZE) {
      reports.push(
        await ingestTelemetry({
          store,
          sha256Hex,
          authorizationHeader: `Bearer ${store.keyFor(deviceId)}`,
          body: numbered.slice(i, i + MAX_BATCH_SIZE),
          now: () => NOW,
        })
      );
    }
  }
  return reports;
}

function deviceIdsOf(sim) {
  return [...new Set(sim.allEvents().map((e) => e.device_id))];
}

// ---------------------------------------------------------------------------

test("the simulator emits something worth testing", () => {
  const sim = runSimulation();
  const events = sim.allEvents();

  assert.ok(events.length > 1000, `only ${events.length} events — check the run`);
  // Two machines: the drum cuts the field, the edger takes the band at the wall.
  assert.equal(deviceIdsOf(sim).length, 2);

  const types = new Set(events.map((e) => e.event_type));
  // The two that could not be stored before migration 002. Named explicitly so
  // that deleting them from the simulator does not make this file pass by
  // having nothing left to check.
  assert.ok(types.has("pressure_reading"), "the 1 Hz pressure stream is gone");
  assert.ok(types.has("coverage_checkpoint"), "coverage checkpoints are gone");
});

test("every event the simulator emits is storable by the migrated schema", () => {
  // The direct regression. This is the assertion whose absence cost 100% of the
  // pressure stream.
  const values = new Set();
  for (const file of readdirSync(path.join(ROOT, "migrations")).sort()) {
    if (!file.endsWith(".sql")) continue;
    const sql = readFileSync(path.join(ROOT, "migrations", file), "utf8");
    const created = /CREATE TYPE event_type AS ENUM \(([\s\S]*?)\);/.exec(sql);
    if (created) for (const m of created[1].matchAll(/'([a-z_]+)'/g)) values.add(m[1]);
    for (const m of sql.matchAll(
      /ALTER TYPE event_type ADD VALUE(?: IF NOT EXISTS)? '([a-z_]+)'/g
    )) {
      values.add(m[1]);
    }
  }

  const emitted = [...new Set(runSimulation().allEvents().map((e) => e.event_type))];
  const unstorable = emitted.filter((t) => !values.has(t));
  assert.deepEqual(
    unstorable,
    [],
    "the reference telemetry producer emits event types the database cannot store"
  );
});

test("a whole simulated job survives the ingest path with nothing refused", async () => {
  const sim = runSimulation();
  const store = makeFleetStore(deviceIdsOf(sim));
  const reports = await shipRun(sim, store);

  const rejected = reports.reduce((n, r) => n + r.rejected, 0);
  const accepted = reports.reduce((n, r) => n + r.accepted, 0);

  assert.equal(
    rejected,
    0,
    `${rejected} events refused: ` +
      JSON.stringify(
        [
          ...new Set(
            reports.flatMap((r) =>
              r.results.filter((x) => x.outcome === "rejected").map((x) => x.reason)
            )
          ),
        ].slice(0, 5)
      )
  );
  assert.equal(accepted, sim.allEvents().length);
  assert.equal(store.rows.length, sim.allEvents().length);
  assert.equal(store.rejects.length, 0);
});

test("a simulated run is stored as simulated, without exception", async () => {
  // If one row in a job of thousands were stamped `measured`, the whole job
  // would be admissible-looking and wrong.
  const sim = runSimulation();
  const store = makeFleetStore(deviceIdsOf(sim));
  await shipRun(sim, store);

  const provenances = new Set(store.rows.map((r) => r.provenance));
  assert.deepEqual([...provenances], ["simulated"]);
});

test("replaying a whole run after a lost response stores nothing twice", async () => {
  // The realistic outage: the edge flushed, the uplink dropped before the
  // response arrived, the machine retries everything it has.
  const sim = runSimulation();
  const store = makeFleetStore(deviceIdsOf(sim));

  await shipRun(sim, store);
  const before = store.rows.length;

  const replay = await shipRun(sim, store);
  assert.equal(store.rows.length, before, "a replay duplicated stored telemetry");
  assert.equal(replay.reduce((n, r) => n + r.accepted, 0), 0);
  assert.equal(replay.reduce((n, r) => n + r.duplicate, 0), before);
});

test("the run is deterministic for a given job id", () => {
  // The basis for every future planner benchmark: a change to the simulator has
  // to show up as a diff, not as a different answer every run.
  const a = runSimulation().allEvents();
  const b = runSimulation().allEvents();
  assert.equal(a.length, b.length);
  assert.deepEqual(a, b);
});

test("a different job id produces a different run", () => {
  // Determinism must not have collapsed into a constant.
  const a = runSimulation(JOB_ID).allEvents();
  const b = runSimulation("job-sim-contract-other").allEvents();

  const pressureOf = (events) =>
    events.filter((e) => e.event_type === "pressure_reading").map((e) => e.data.psi);

  assert.notDeepEqual(pressureOf(a), pressureOf(b));
});

test("resume high-water marks cover both machines on the job", async () => {
  const sim = runSimulation();
  const devices = deviceIdsOf(sim);
  const store = makeFleetStore(devices);
  await shipRun(sim, store);

  for (const device of devices) {
    const stored = store.rows.filter((r) => r.robot_id === device);
    const max = await store.maxSeq(device, JOB_ID);
    assert.equal(
      max,
      stored.length - 1,
      `${device} has a gap: ${stored.length} rows but max_seq ${max}`
    );
  }
});
