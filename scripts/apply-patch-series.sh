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

# ── 7. Dry run — THIS is the gate ────────────────────────────────────────────

echo
echo "── dry run (${#PATCHES[@]} patch(es), nothing is modified)"
FAIL=0
for p in "${PATCHES[@]}"; do
  if git apply --check "$p" 2>/dev/null; then
    grn "  ✓ $(basename "$p")"
  else
    # an already-applied patch fails identically to a broken one — say which
    if git apply --reverse --check "$p" 2>/dev/null; then
      ylw "  ⊙ $(basename "$p") — ALREADY APPLIED, will skip"
    else
      red  "  ✗ $(basename "$p") — WOULD FAIL"
      git apply --check "$p" 2>&1 | sed 's/^/      /'
      FAIL=1
    fi
  fi
done
if [ "$FAIL" -ne 0 ]; then
  echo
  red "✗ dry run failed — nothing applied"
  echo "  Most likely: the tree drifted in a file the patch edits, the patch is"
  echo "  malformed, or it is partially applied. Request a series regenerated"
  echo "  against $HEAD_SHA rather than forcing this one."
  exit 1
fi

# ── 8. Apply ─────────────────────────────────────────────────────────────────
echo
echo "── applying"
for p in "${PATCHES[@]}"; do
  if git apply --reverse --check "$p" 2>/dev/null; then
    ylw "  ⊙ skipped (already applied): $(basename "$p")"
    continue
  fi
  git apply "$p"
  grn "  ✓ applied: $(basename "$p")"
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
