#!/usr/bin/env bash
#
# Untrack the committed binaries that git should never have been carrying.
#
# WHY THIS IS A SCRIPT AND NOT PART OF THE PATCH
# ----------------------------------------------
# A unified diff that removes a 4.4 MB zip has to embed the whole pre-image, so
# `git diff --binary` for these files produces an 11 MB patch — absurd for a
# change whose entire purpose is to make the repo smaller. More importantly,
# `git rm --cached` is the operation you actually want: it removes the file from
# the index while LEAVING IT ON DISK. A patch would delete it outright.
#
# WHAT IS SAFE TO UNTRACK, AND HOW THAT WAS ESTABLISHED
# -----------------------------------------------------
#   showcase-assets.zip (4.4 MB)
#       Contains gallery/*.webp — 78 files, every one byte-identical to
#       public/showcase/gallery/ (verified with `cmp` on all 78). A pure
#       duplicate of content that stays tracked. Untracking loses nothing.
#
#   floorforge-image-library-ALL-78.png (4.0 MB)
#       A 1500x1968 labelled contact sheet of the 78 renders — each tile is
#       ~150 px wide against 784x1168 originals. A derived browsing index, not
#       a source. Regenerable from public/showcase/gallery/ at any time.
#
#   openclaw-workspace-state.json (141 B)
#       Local tool state. Not source.
#
# WHAT IS DELIBERATELY LEFT TRACKED
# ---------------------------------
#   floorforge_social_campaign*.zip (10 files, 7.1 MB)
#       These hold the ONLY copy of 12 files — 5 JPG, 5 WebP, a README and a
#       JSON — none of which exists anywhere else in the repo. They are also
#       ~4x redundant with each other: 7.1 MB tracked for 1.8 MB of unique
#       content. Store those 12 files off-repo, then untrack these too and
#       empty the ALLOWLIST in scripts/check-repo-hygiene.mjs.
#
# HISTORY IS NOT REWRITTEN
# ------------------------
# Untracking stops the bleeding; it does not shrink the clone. The blobs stay in
# history, `.git` stays around 67 MB, and every fresh clone still pays for them.
# Reclaiming that needs `git filter-repo` or BFG plus a force-push, which
# rewrites every commit SHA and invalidates the two open branches
# (feat/autonomous-refinishing-showcase, pro-simulator-integration). That is a
# coordinated operation for a moment when no work is in flight — recommended in
# audit/DEFERRED.md D-7, deliberately NOT done here.
#
# Nothing is lost either way: any untracked file can be restored from history.
#     git show 3c2c2d0:showcase-assets.zip > showcase-assets.zip
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

FILES=(
  "showcase-assets.zip"
  "floorforge-image-library-ALL-78.png"
  "openclaw-workspace-state.json"
)

echo "▸ untracking committed binaries (files stay on disk)"
FREED=0
DONE=0
for f in "${FILES[@]}"; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    SIZE=$(git cat-file -s "$(git rev-parse "HEAD:$f")")
    git rm --cached --quiet "$f"
    FREED=$((FREED + SIZE))
    DONE=$((DONE + 1))
    printf '  removed from index: %-40s %8d bytes (still on disk)\n' "$f" "$SIZE"
  else
    printf '  already untracked:  %s\n' "$f"
  fi
done

if [ "$DONE" -eq 0 ]; then
  echo "  nothing to do."
  exit 0
fi

echo
printf '  %d file(s), %.1f MB no longer tracked.\n' "$DONE" "$(echo "$FREED" | awk '{print $1/1048576}')"
echo
echo "  Next:"
echo "      node scripts/check-repo-hygiene.mjs"
echo "      git commit -m 'chore: untrack committed binaries (see scripts/untrack-binaries.sh)'"
