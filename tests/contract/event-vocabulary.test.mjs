/**
 * The event vocabulary must mean the same thing in every layer.
 *
 * This is the test that would have caught FLOORFORGE_SYSTEM_BASELINE.md §3.1
 * on the day it was introduced. `lib/types.ts` and `lib/validators.ts` accepted
 * fifteen telemetry event types; `migrations/001_initial_schema.sql` stored
 * eleven. The four missing were exactly the four the firmware contract owns,
 * including `pressure_reading` — the 1 Hz stream. A device following the
 * contract passed validation and was rejected by Postgres, which the route
 * turned into a 500 with no dead-letter, so every pressure sample was lost.
 *
 * It was a two-line difference between two files in the same repository. It
 * survived a dedicated product-truth audit that cited both of them, because
 * nothing compared them. So: something compares them.
 *
 * The SQL is parsed rather than imported because it is the actual artefact the
 * database is built from. A hand-maintained TypeScript copy of the enum would
 * be a third place to drift.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateTelemetryEvent } from "@/lib/validators";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");

// ---------------------------------------------------------------------------
// Layer 1 — the TypeScript union
// ---------------------------------------------------------------------------

function typeScriptEventTypes() {
  const src = read("lib/types.ts");
  const block = /export type EventType =([\s\S]*?);\n/.exec(src);
  assert.ok(block, "lib/types.ts no longer declares `export type EventType`");
  return [...block[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]).sort();
}

// ---------------------------------------------------------------------------
// Layer 2 — the Postgres enum, as built by the migration series
// ---------------------------------------------------------------------------

function migrationFiles() {
  return readdirSync(path.join(ROOT, "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort(); // 001, 002, ... — lexical order is apply order by construction
}

function postgresEventTypes() {
  const values = new Set();

  for (const file of migrationFiles()) {
    const sql = read(path.join("migrations", file));

    const created = /CREATE TYPE event_type AS ENUM \(([\s\S]*?)\);/.exec(sql);
    if (created) {
      for (const m of created[1].matchAll(/'([a-z_]+)'/g)) values.add(m[1]);
    }

    for (const m of sql.matchAll(
      /ALTER TYPE event_type ADD VALUE(?: IF NOT EXISTS)? '([a-z_]+)'/g
    )) {
      values.add(m[1]);
    }
  }

  assert.ok(values.size > 0, "no event_type enum found in migrations/");
  return [...values].sort();
}

// ---------------------------------------------------------------------------

test("every event type the API accepts, the database can store", () => {
  const ts = typeScriptEventTypes();
  const pg = postgresEventTypes();

  const acceptedButUnstorable = ts.filter((t) => !pg.includes(t));
  assert.deepEqual(
    acceptedButUnstorable,
    [],
    `These types pass validation and would be rejected by Postgres, which the ` +
      `ingest route can only report as a rejected event — the machine's data is ` +
      `refused at the last possible moment. Add them to a migration with ` +
      `ALTER TYPE event_type ADD VALUE.`
  );
});

test("every event type the database can store, the API accepts", () => {
  const ts = typeScriptEventTypes();
  const pg = postgresEventTypes();

  const storableButUnknown = pg.filter((t) => !ts.includes(t));
  assert.deepEqual(
    storableButUnknown,
    [],
    `These types exist in the database and are rejected by lib/validators.ts, ` +
      `so nothing can ever write them. Either add them to EventType or remove ` +
      `them from the schema — a value only one layer believes in is how the ` +
      `two vocabularies diverged in the first place.`
  );
});

test("the validator accepts exactly the EventType union, no more and no less", () => {
  const ts = typeScriptEventTypes();

  // The validator keeps its own literal array (lib/validators.ts:447). It is a
  // second copy of the union, so it is checked as one.
  for (const eventType of ts) {
    const result = validateTelemetryEvent({
      job_id: "job-1",
      robot_id: "FF-S001",
      timestamp: "2026-09-06T10:00:00.000Z",
      event_type: eventType,
      data: {},
    });
    assert.equal(
      result.valid,
      true,
      `EventType includes "${eventType}" but validateTelemetryEvent rejects it: ` +
        JSON.stringify(result.errors)
    );
  }

  const notAType = validateTelemetryEvent({
    job_id: "job-1",
    robot_id: "FF-S001",
    timestamp: "2026-09-06T10:00:00.000Z",
    event_type: "definitely_not_an_event",
    data: {},
  });
  assert.equal(notAType.valid, false, "validator accepted an unknown event type");
});

test("the four firmware-contract types are present in all three layers", () => {
  // Named explicitly rather than left to the set comparison above, because
  // these four are the specific regression: they are what
  // SOFTWARE_HARDWARE_CONTRACT.md:103 tells the hardware team to emit, and
  // `pressure_reading` at 1 Hz is the raw material for the closed-loop process
  // intelligence the company calls its moat. A generic "the sets match" test
  // would still pass if someone deleted all four from every layer at once.
  const firmwareTypes = [
    "pressure_reading",
    "coverage_checkpoint",
    "job_paused",
    "job_resumed",
  ];

  const ts = typeScriptEventTypes();
  const pg = postgresEventTypes();

  for (const t of firmwareTypes) {
    assert.ok(ts.includes(t), `lib/types.ts EventType is missing "${t}"`);
    assert.ok(pg.includes(t), `the Postgres event_type enum is missing "${t}"`);
  }
});
