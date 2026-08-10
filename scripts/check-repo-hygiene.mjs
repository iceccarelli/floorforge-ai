#!/usr/bin/env node
/**
 * Repo-hygiene guard. Dependency-free — Node built-ins and git only.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-08-08 and again on 2026-08-09, a delivery `.patch` file was uploaded
 * to `main` through the GitHub web UI instead of being applied — once to
 * ecowoods-app, once to this repo. Both times the file landed as a commit.
 * `.gitignore` already listed `*.patch` and did not help: `.gitignore` only
 * governs `git add`, and a web upload commits directly.
 *
 * A local hook cannot see a web upload either. That is why this script is wired
 * into BOTH a local hook (fast feedback) and a GitHub Actions job (the one that
 * actually catches a web upload, because it runs on the pushed commit no matter
 * how the commit was made).
 *
 * WHAT IT ENFORCES
 * ----------------
 *   1. No tracked `*.patch` file.        Patches are applied from /tmp, never committed.
 *   2. No tracked file above MAX_BYTES.  Binaries belong in object storage.
 *
 * MODES
 * -----
 *   node scripts/check-repo-hygiene.mjs             # working tree (CI)
 *   node scripts/check-repo-hygiene.mjs --staged    # staged changes only (pre-commit)
 *
 * THE ALLOWLIST IS TEMPORARY
 * --------------------------
 * FLOORFORGE_01_repo_hygiene.patch deleted the three stale delivery patches and
 * scripts/untrack-binaries.sh untracked the 8.4 MB that was provably redundant.
 * What is left is the social-campaign archives, which hold the only copy of
 * their contents — see the comment on ALLOWLIST for how to empty it.
 *
 * A missing allowlist entry is not an error, so the order in which these land
 * does not matter.
 */
import { execSync } from "node:child_process";
import { statSync } from "node:fs";

const MAX_BYTES = 500 * 1024;

const ALLOWLIST = new Set([
  // The social-campaign archives, and only these.
  //
  // Unlike showcase-assets.zip (a byte-identical copy of
  // public/showcase/gallery/) and floorforge-image-library-ALL-78.png (a
  // derived contact sheet), these hold the ONLY copy of 12 files: 5 JPG,
  // 5 WebP, a README and a JSON, none of which exists anywhere else in the
  // repo. They are also ~4x redundant with each other — 7.1 MB tracked for
  // 1.8 MB of unique content.
  //
  // Store those 12 files off-repo, run `git rm --cached` on these ten, and
  // empty this Set. An empty ALLOWLIST is the goal state.
  "floorforge_social_campaign.zip",
  "floorforge_social_campaign (1).zip",
  "floorforge_social_campaign (2).zip",
  "floorforge_social_campaign (3).zip",
  "floorforge_social_campaign (4).zip",
  "floorforge_social_campaign_machines.zip",
  "floorforge_social_campaign_machines (1).zip",
  "floorforge_social_campaign_machines (2).zip",
  "floorforge_social_campaign_machines (3).zip",
  "floorforge_social_campaign_machines (4).zip",
]);

const staged = process.argv.includes("--staged");

const git = (cmd) => execSync(cmd, { encoding: "utf8" }).split("\0").filter(Boolean);

const files = staged
  ? git("git diff --cached --name-only --diff-filter=ACMR -z")
  : git("git ls-files -z");

const patches = [];
const oversized = [];

for (const f of files) {
  if (ALLOWLIST.has(f)) continue;
  if (f.endsWith(".patch") || f.endsWith(".diff")) {
    patches.push(f);
    continue;
  }
  let size;
  try {
    size = statSync(f).size;
  } catch {
    continue; // deleted or unreadable in this checkout
  }
  if (size > MAX_BYTES) oversized.push({ f, size });
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
let failed = false;

if (patches.length) {
  failed = true;
  console.error(`\n✗ ${patches.length} patch file(s) tracked in the repository:\n`);
  for (const f of patches) console.error(`    ${f}`);
  console.error(`
  Patch files are applied, never committed. Move them outside the working tree:

      mkdir -p /tmp/ffpatches
      git rm --cached <file> && mv <file> /tmp/ffpatches/
      git commit -m "chore: untrack delivery patch"

  Then apply with scripts/apply-patch-series.sh, which verifies the remote and
  the base SHA before it touches anything.
`);
}

if (oversized.length) {
  failed = true;
  const total = oversized.reduce((a, b) => a + b.size, 0);
  console.error(`\n✗ ${oversized.length} tracked file(s) above ${kb(MAX_BYTES)} (${kb(total)} total):\n`);
  for (const { f, size } of oversized.sort((a, b) => b.size - a.size)) {
    console.error(`    ${kb(size).padStart(9)}  ${f}`);
  }
  console.error(`
  Large binaries make every clone slower for everyone, forever — git history
  keeps them even after deletion. Store them outside the repo and link to them.
`);
}

if (failed) process.exit(1);

console.log(
  `repo-hygiene: ${files.length} ${staged ? "staged" : "tracked"} file(s) checked — ` +
    `no unlisted patch files, none above ${kb(MAX_BYTES)}.` +
    (ALLOWLIST.size ? ` ${ALLOWLIST.size} grandfathered entr${ALLOWLIST.size === 1 ? "y" : "ies"} skipped.` : "")
);
