#!/usr/bin/env bash
# Install the FloorForge git hooks into this clone.
#
# Uses core.hooksPath so the hooks are version-controlled and every clone gets
# the same ones — no copying into .git/hooks, nothing to drift.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
chmod +x scripts/hooks/pre-commit scripts/hooks/pre-push scripts/hooks/install.sh
chmod +x scripts/apply-patch-series.sh 2>/dev/null || true
git config core.hooksPath scripts/hooks
echo "✓ hooks installed — core.hooksPath = scripts/hooks"
echo "    pre-commit : blocks committed *.patch and files > 500 KB"
echo "    pre-push   : hygiene + AST parse + tsc + lint + build — all blocking"
echo
echo "  To bypass once (you should not need to): git commit --no-verify"
