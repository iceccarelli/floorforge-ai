#!/usr/bin/env node
/**
 * Mint a device credential for telemetry ingest.
 *
 *   node scripts/issue-device-key.mjs --robot FF-S001 \
 *        --tenant 7c9e6679-7425-40de-944b-e07fc1f90ae7 \
 *        --kind hardware --label "D1 prototype, bench"
 *
 * Prints the key once, and the SQL that registers it. The platform never stores
 * the key — only its SHA-256 — so if this output is lost the credential is
 * revoked and a new one issued. There is no recovery path by design: a key the
 * server can recover is a key an attacker can recover.
 *
 * WHY THIS EMITS SQL RATHER THAN CONNECTING. It needs no credentials, no
 * network and no dependencies, so it runs identically on a laptop, in
 * Codespaces and on a bench next to the machine being provisioned. The person
 * running it reads the statement before it touches the fleet, which is the
 * right amount of friction for handing out a key that can write quality
 * evidence.
 *
 * `--kind` is the safety-relevant argument:
 *
 *   hardware      telemetry is stamped `measured`. Only ever for a real machine.
 *   simulator     stamped `simulated`. For lib/simulation.ts and successors.
 *   test_harness  stamped `simulated`. For CI and load tests.
 *
 * The stamp is applied server-side from this field and cannot be overridden by
 * the device. Issuing a `hardware` key to a simulator is the one action here
 * that can poison the dataset, which is why the value is typed out by a human
 * rather than inferred.
 */

import { randomBytes, createHash } from "node:crypto";

const KINDS = new Set(["hardware", "simulator", "test_harness"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    if (!flag?.startsWith("--")) usage(`Unexpected argument: ${flag}`);
    const value = argv[i + 1];
    if (value === undefined) usage(`Missing value for ${flag}`);
    out[flag.slice(2)] = value;
  }
  return out;
}

function usage(message) {
  if (message) console.error(`\n  error: ${message}\n`);
  console.error(
    `  usage: node scripts/issue-device-key.mjs \\\n` +
      `           --robot <robot_id> --tenant <tenant_uuid> \\\n` +
      `           --kind hardware|simulator|test_harness [--label "<text>"]\n`
  );
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (!args.robot) usage("--robot is required (robots.id, e.g. FF-S001)");
if (!args.tenant) usage("--tenant is required (tenants.id, a UUID)");
if (!UUID_RE.test(args.tenant)) usage(`--tenant must be a UUID, got: ${args.tenant}`);
if (!args.kind) usage("--kind is required");
if (!KINDS.has(args.kind)) {
  usage(`--kind must be one of: ${[...KINDS].join(", ")} — got: ${args.kind}`);
}

// 32 bytes of CSPRNG output. The `ffk_` prefix makes a leaked key greppable in
// logs and recognisable by secret scanners.
const key = `ffk_${randomBytes(32).toString("base64url")}`;
const keyHash = createHash("sha256").update(key, "utf8").digest("hex");
const keyPrefix = key.slice(0, 8);
const label = args.label ?? null;

const sqlLabel = label === null ? "NULL" : `'${label.replace(/'/g, "''")}'`;

console.log(`
────────────────────────────────────────────────────────────────────────
  DEVICE KEY — shown once, never recoverable

    ${key}

  robot     ${args.robot}
  tenant    ${args.tenant}
  kind      ${args.kind}  →  telemetry stamped '${
    args.kind === "hardware" ? "measured" : "simulated"
  }'
  label     ${label ?? "(none)"}
────────────────────────────────────────────────────────────────────────

  1. Store the key on the machine. The platform holds only its SHA-256.

  2. Register it — run this against the project database:

INSERT INTO device_credentials (robot_id, tenant_id, kind, label, key_prefix, key_hash)
VALUES ('${args.robot}', '${args.tenant}', '${args.kind}', ${sqlLabel}, '${keyPrefix}', '${keyHash}');

  3. Verify from the machine:

curl -sS -H "Authorization: Bearer ${key}" \\
  "$FLOORFORGE_BASE_URL/api/telemetry/resume?job_id=<job_id>"

  To revoke:

UPDATE device_credentials
   SET status = 'revoked', revoked_at = NOW()
 WHERE key_prefix = '${keyPrefix}' AND robot_id = '${args.robot}';
`);
