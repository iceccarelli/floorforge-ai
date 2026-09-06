# tests/

```bash
npm test
```

No database, no network, no browser, no new dependency. Runs in about 25 seconds
and is a blocking step in `.github/workflows/verify.yml`.

## Why there was nothing here before, and why that mattered

`migrations/001_initial_schema.sql` stored eleven telemetry event types while
`lib/types.ts` and `lib/validators.ts` accepted fifteen. The four missing were
exactly the four the firmware contract owns, including `pressure_reading` — the
1 Hz stream, and the raw material for the process intelligence this company
calls its moat. A device following the contract passed validation and was
rejected by Postgres, which the route turned into a 500 with no dead-letter, so
every pressure sample was lost.

It was a two-line difference between two files in the same repository, and it
survived a dedicated product-truth audit that cited **both of them**, because
nothing compared them. `audit/scripts/` sweeps the rendered site for
accessibility, contrast, overflow and parse errors; none of it can see a
database, an auth boundary or a telemetry event.

So the tests here are organised around the things that were actually wrong,
not around functions that return 2.

## What is here

| File | What it proves |
|---|---|
| `contract/event-vocabulary.test.mjs` | TypeScript, the validator and the migration series agree on the telemetry vocabulary. Parses the SQL, so the artefact the database is built from is what is checked. |
| `contract/job-state-machine.test.mjs` | `lib/jobState.ts` and the trigger in migration 002 encode the same nine transition rules. A job cannot reach `approved` without having run. |
| `telemetry/ingest.test.mjs` | The delivery contract: authentication, per-robot scoping, cross-tenant refusal, idempotent replay, poison-event isolation, dead-lettering, resume, batch limits, clock-skew rejection. |
| `telemetry/simulator-contract.test.mjs` | A whole simulated job — both machines, thousands of events, chunked and authenticated — survives the real ingest path with nothing refused and everything stamped `simulated`. |

The last one is what makes `lib/simulation.ts:35` true: *"the day a real D1
posts to /api/telemetry, nothing downstream changes."*

## How it runs without a build step

`node --test`, plus Node 22's native TypeScript stripping. The only missing
piece is the `@/` path alias and TypeScript's extensionless relative imports,
which `support/resolver.mjs` supplies in about twenty lines.

The alternative was vitest or jest plus a transform pipeline: a large dependency
tree, a second config format and a second module resolver, to test a codebase
whose entire build is one `next build`.

`tsconfig.json` sets `erasableSyntaxOnly`, so `tsc` refuses any syntax that
cannot be stripped — parameter properties, `enum`, namespaces. That keeps the
tests running against **the real modules** rather than a compiled copy that
could drift from them, which is the failure mode this whole directory exists to
prevent.

## Adding a test

Put behavioural tests next to the subsystem they exercise, and drift tests in
`contract/`. A contract test earns its place when the same fact is written down
in two files that no compiler compares — a TypeScript union and a Postgres
enum, an application rule and a database trigger. Those are the pairs this
repository has already lost money on.

## What is deliberately not tested here

- **Rendered UI, accessibility, contrast, payload.** `audit/` already does this
  against a served build, and needs a browser. Keeping the two suites apart is
  why a Playwright outage cannot block a deploy (`audit/DEFERRED.md` D-1).
- **Live Supabase behaviour.** RLS policies and the status trigger are asserted
  by reading the migration, not by executing it. That catches drift between the
  application and the schema — it does not prove Postgres enforces what the file
  says. Proving that needs a database in CI, and is worth doing once a pilot
  depends on it.
