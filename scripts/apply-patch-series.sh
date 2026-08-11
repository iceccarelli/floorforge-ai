#!/usr/bin/env bash
#
# Apply a FLOORFORGE_*.patch series safely.
#
# WHY THIS EXISTS
# ---------------
# Applying a patch series by hand has failed twice in two days, both times the
# same way: `cd` into a directory that does not exist fails silently, the shell
# stays where it was, and every subsequent command runs against the WRONG REPO.
# On 2026-08-08 that put a FloorForge patch into ecowoods-app's main branch.
#
# This script makes both mistakes impossible:
#   1. It refuses to run unless `origin` points at the expected repository.
#   2. It harvests any delivery patch that was uploaded into the tree, untracks
#      it, and commits the removal before doing anything else.
#   3. It dry-runs the whole series before modifying anything, and tells an
#      already-applied patch apart from a broken one — `git apply --check`
#      alone cannot.
#
# USAGE
#   scripts/apply-patch-series.sh                        # patches from /tmp/ffpatches
#   scripts/apply-patch-series.sh /path/to/patches       # patches from elsewhere
#   BASE_SHA=<sha> scripts/apply-patch-series.sh         # override expected base
#
set -euo pipefail

EXPECTED_REPO="iceccarelli/floorforge-ai"
# Informational. Override per-run with BASE_SHA=<sha>.
EXPECTED_BASE="${BASE_SHA:-43bf65dfac6f870d65059c309e73aa8da7f5b4e9}"
PATCH_DIR="${1:-/tmp/ffpatches}"

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
grn()  { printf '\033[32m%s\033[0m\n' "$*"; }
ylw()  { printf '\033[33m%s\033[0m\n' "$*"; }
die()  { red "✗ $*"; exit 1; }



# ── 1. Are we in a git repo at all? ──────────────────────────────────────────
git rev-parse --git-dir >/dev/null 2>&1 || die "not inside a git repository: $(pwd)"
cd "$(git rev-parse --show-toplevel)"

# ── 2. Is it the RIGHT repo? This is the check that was missing. ─────────────
ORIGIN="$(git remote get-url origin 2>/dev/null || echo '<none>')"
case "$ORIGIN" in
  *"$EXPECTED_REPO"*) grn "✓ repository — $EXPECTED_REPO" ;;
  *)
    red "✗ WRONG REPOSITORY"
    echo "    working tree : $(pwd)"
    echo "    origin       : $ORIGIN"
    echo "    expected     : $EXPECTED_REPO"
    echo
    echo "  Nothing has been modified. Clone the right repo and try again:"
    echo "      git clone https://github.com/$EXPECTED_REPO"
    exit 1
    ;;
esac

# ── 3. Working tree clean? ───────────────────────────────────────────────────
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  die "working tree has uncommitted changes — commit or stash them first"
fi

# ── 4. Harvest stray patch files that were uploaded into the tree ────────────
mkdir -p "$PATCH_DIR"
STRAY=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    FLOORFORGE_*.patch)
      ylw "⚠ found a delivery patch committed into the working tree: $f"
      echo "    moving it to $PATCH_DIR and untracking it"
      [ -e "$PATCH_DIR/$(basename "$f")" ] || cp "$f" "$PATCH_DIR/"
      git rm --cached --quiet "$f"
      rm -f "$f"
      STRAY=$((STRAY + 1))
      ;;
  esac
done < <(git ls-files '*.patch')

if [ "$STRAY" -gt 0 ]; then
  git commit --quiet -m "chore: untrack delivery patch uploaded to main instead of applied"
  grn "✓ harvested $STRAY stray patch file(s) — committed the removal"
fi

# ── 5. Locate the series (needed before the base check) ──────────────────────
shopt -s nullglob
PATCHES=("$PATCH_DIR"/FLOORFORGE_*.patch)
[ ${#PATCHES[@]} -gt 0 ] || die "no FLOORFORGE_*.patch files found in $PATCH_DIR"

# Every path this series creates or modifies. Drift confined to these paths is
# expected — it means earlier patches in the series have already been committed.
SERIES_PATHS="$(mktemp)"
trap 'rm -f "$SERIES_PATHS"' EXIT
for p in "${PATCHES[@]}"; do
  git apply --numstat "$p" 2>/dev/null | awk -F'\t' '{print $3}'
done | sort -u > "$SERIES_PATHS"

# ── 6. Report drift from the recorded base ───────────────────────────────────
#
# ADVISORY, not the gate. `git apply --check` in step 7 is the real test of
# whether a patch still fits, and it is exact. What drift tells you is softer
# and still worth knowing: that the audit behind these patches was measured
# against code that has since moved, so a finding may be stale even when the
# patch applies cleanly.
#
# It cannot be a hard gate, because a series that lands incrementally changes
# the very files it owns.
HEAD_SHA="$(git rev-parse HEAD)"
if [ "$HEAD_SHA" = "$EXPECTED_BASE" ]; then
  grn "✓ base commit — $EXPECTED_BASE"
elif ! git rev-parse --verify --quiet "$EXPECTED_BASE^{commit}" >/dev/null; then
  ylw "⚠ base $EXPECTED_BASE not in this clone — run 'git fetch --all' if the dry run fails"
else
  OUTSIDE="$(git diff --name-only "$EXPECTED_BASE" HEAD | grep -Fxv -f "$SERIES_PATHS" || true)"
  COUNT="$(printf '%s\n' "$OUTSIDE" | grep -c . || true)"
  grn "✓ HEAD is $HEAD_SHA (recorded base $EXPECTED_BASE)"
  if [ "${COUNT:-0}" -gt 0 ]; then
    echo "    ${COUNT} file(s) outside this series differ from the recorded base."
    echo "    That is expected once earlier patches have landed. Step 7 decides"
    echo "    whether these patches still apply."
  fi
fi

# ── 7. Dry run — classify every patch ────────────────────────────────────────
#
# Three signals, in order of reliability:
#
#   1. THE LEDGER. Every patch this script applies is recorded by content hash
#      in .git/floorforge-applied — inside .git, so it can never be committed,
#      and per-clone, which is exactly the right scope. A hash in the ledger is
#      proof, not inference.
#   2. `git apply --check` — the patch fits, apply it.
#   3. `git apply --reverse --check` — it is already applied.
#
# Signal 3 is unreliable once a LATER patch has edited the same lines: an
# already-landed patch then satisfies neither check and looks broken. That
# misclassification aborted two runs on 2026-08-10/11 and is why the ledger
# exists. A patch that cannot be classified is skipped with a warning rather
# than killing the run — a stale patch in the directory must never block a
# fresh one. The run only fails if NOTHING could be applied.
LEDGER="$(git rev-parse --git-dir)/floorforge-applied"
touch "$LEDGER"

echo
echo "── dry run (${#PATCHES[@]} patch(es), nothing is modified)"
STATUS=()
PENDING=0
UNCLASSIFIED=0
for p in "${PATCHES[@]}"; do
  h="$(sha256sum "$p" | cut -d" " -f1)"
  if grep -qF "$h" "$LEDGER" 2>/dev/null; then
    STATUS+=("applied")
    ylw "  ⊙ $(basename "$p") — already applied (ledger), will skip"
  elif git apply --check "$p" 2>/dev/null; then
    STATUS+=("pending")
    PENDING=$((PENDING + 1))
    grn "  ✓ $(basename "$p")"
  elif git apply --reverse --check "$p" 2>/dev/null; then
    STATUS+=("applied")
    ylw "  ⊙ $(basename "$p") — already applied, will skip"
  else
    STATUS+=("unclassified")
    UNCLASSIFIED=$((UNCLASSIFIED + 1))
    ylw "  ⊙ $(basename "$p") — cannot apply and cannot reverse; assuming it landed earlier, skipping"
  fi
done

if [ "$PENDING" -eq 0 ]; then
  echo
  if [ "$UNCLASSIFIED" -gt 0 ]; then
    ylw "Nothing to apply. $UNCLASSIFIED patch(es) could not be classified — if one of"
    ylw "them is genuinely new, the tree has drifted from what it was built against;"
    ylw "request a series regenerated against $(git rev-parse HEAD)."
    ylw "Otherwise the directory just holds patches that have already landed:"
    ylw "    rm -rf $PATCH_DIR"
  else
    grn "Nothing to apply — every patch in $PATCH_DIR has already landed."
  fi
  exit 0
fi

# ── 8. Apply ─────────────────────────────────────────────────────────────────
echo
echo "── applying"
for i in "${!PATCHES[@]}"; do
  p="${PATCHES[$i]}"
  [ "${STATUS[$i]}" = "pending" ] || continue
  git apply "$p"
  sha256sum "$p" | cut -d" " -f1 >> "$LEDGER"
  grn "  ✓ applied: $(basename "$p")"
  mkdir -p "$PATCH_DIR/applied"
  mv "$p" "$PATCH_DIR/applied/" 2>/dev/null || true
done

echo
git status --short
echo
grn "Applied. Now verify before trusting any of it:"
cat <<'EOF'
    npm ci
    npx tsc --noEmit
    npm run lint
    npm run build
    node scripts/check-repo-hygiene.mjs
EOF
