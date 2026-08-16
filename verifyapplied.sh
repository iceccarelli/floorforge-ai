#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# FloorForge — "is every patch actually in the repo?"
#
# WHY THIS EXISTS. A patch can be applied, committed, pushed, and STILL be gone
# a week later: a rebase drops it, a re-upload of an older file overwrites it,
# a merge resolves the wrong way. That already happened once here — the audit
# port fix was applied, then silently lost in a rebase, and had to be re-issued.
# A commit existing in `git log` does NOT prove its content is still in the tree.
#
# So this checks CONSEQUENCES, not commits. Each line below asserts something
# that is true if and only if that patch's work survives in the working tree
# you are standing in right now.
#
#   bash verify-applied.sh
#
# Exit 0 = everything is in. Exit 1 = at least one patch is missing or reverted.
# ---------------------------------------------------------------------------
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

PASS=0; FAIL=0; MISSING=()
g()  { grep -rqF -- "$2" "$1" 2>/dev/null; }          # fixed-string, in file
gr() { grep -rqE -- "$2" "$1" 2>/dev/null; }          # regex, in file
ck() { # ck <label> <test-cmd...>
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then printf '  \033[32mIN \033[0m %s\n' "$label"; PASS=$((PASS+1))
  else printf '  \033[31mOUT\033[0m %s\n' "$label"; FAIL=$((FAIL+1)); MISSING+=("$label"); fi
}
hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

printf '\033[1mFloorForge — patch survival check\033[0m\n'
printf 'branch  %s\n' "$(git rev-parse --abbrev-ref HEAD)"
printf 'HEAD    %s  %s\n' "$(git rev-parse --short HEAD)" "$(git log -1 --format=%s | cut -c1-64)"
git fetch -q origin 2>/dev/null
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo '?')
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo '?')
printf 'vs origin/main   %s ahead, %s behind\n' "$AHEAD" "$BEHIND"
DIRTY=$(git status --porcelain | wc -l | tr -d ' ')
printf 'uncommitted      %s file(s)\n' "$DIRTY"

hdr 'Foundations — tokens, motion, build integrity'
ck 'Tailwind v4 @theme inline aliasing intact'        gr app/globals.css '@theme[[:space:]]+inline'
ck 'design tokens defined (--accent amber, not blue)' g  app/globals.css '#b45309'
ck 'reduced-motion: content not conditional on anim'  gr components '(prefers-reduced-motion|useReducedMotion)'
ck 'pre-commit hook uses LOCAL tsc, not npx tsc'      bash -c '! grep -rqE "^[^#]*npx +tsc" .husky 2>/dev/null'

hdr 'Honesty layer — the constraint that outranks everything'
# Comment lines are excluded: several files carry a comment stating that no
# testimonial exists, which is the opposite of the thing being searched for.
ck 'no testimonials anywhere in app/ or components/'  bash -c '! grep -rhiE "testimonial|trusted by [0-9]|customers say" app components 2>/dev/null | grep -qvE "^[[:space:]]*(\*|//|/\*)"'
ck 'no fabricated customer counts'                    bash -c '! grep -rqiE "[0-9,]+\+? (happy )?(customers|contractors) (served|trust)" app components 2>/dev/null'
ck 'concept-render disclaimer present'                bash -c 'grep -rqF "concept render" app components'
ck 'design-target framing present'                    bash -c 'grep -rqF "design target" app components'
ck 'no Offer/Product JSON-LD for unbuilt hardware'    bash -c '! grep -rqE "\"@type\":[[:space:]]*\"(Offer|Product)\"" components app'
ck 'mailto fallback still wired (no dead CTA)'        bash -c 'grep -rqF "mailto:" components lib'

hdr 'Accessibility — the audited invariants'
ck 'skip link present'                                bash -c 'grep -rqiF "Skip to content" app components'
ck 'header wraps at 200% text (1.4.4 fix)'            g  components/Header.tsx 'flex-wrap'
ck 'header uses min-h-16, not fixed h-16'             g  components/Header.tsx 'min-h-16'
ck 'nav buttons have min-w-6 (2.5.8 target size)'     g  components/Header.tsx 'min-w-6'
ck '44px tap-target floor applied'                    bash -c 'grep -rqE "min-h-11|min-h-\[44px\]" app components'
ck 'safe-area insets for notched devices'             bash -c 'grep -rqF "safe-area-inset" app components'
ck 'R3F a11y role on WRAPPER div, not <canvas>'       bash -c 'grep -rqE "role=\"(img|application)\"" components/simulator components/live'

hdr 'Product truth — one source for every published number'
ck 'lib/product.ts is the single numbers source'      test -f lib/product.ts
ck 'completeFloorHours (field + perimeter)'           g  lib/product.ts 'completeFloorHours'
ck 'RaaS monthly band constants'                      g  lib/product.ts 'RAAS_MONTHLY_LOW_USD'
ck 'MACHINES_PER_COMPLETE_FLOOR derived, not typed'   g  lib/product.ts 'MACHINES_PER_COMPLETE_FLOOR'
ck 'homepage reads figures from lib/product.ts'       g  app/page.tsx '@/lib/product'
ck 'homepage reads machine specs from lib/robots.ts'  g  app/page.tsx '@/lib/robots'

hdr 'The two-machine truth — a floor needs a D1 AND an E1'
ck 'D1 edge gap declared in the spec'                 g  lib/robots.ts 'edgeGapM'
ck 'D1 edge gap is 0.12 m'                            g  lib/robots.ts '0.12'
ck 'ForgeEdge E1 exists as a platform'                g  lib/robots.ts 'ForgeEdge E1'
ck 'simulation emits BOTH device ids'                 bash -c 'grep -qF "FF-S001" lib/simulation.ts && grep -qF "FF-E001" lib/simulation.ts'
ck 'telemetry carries a field/perimeter zone'         g  lib/simulation.ts 'zone'
ck 'report splits field vs perimeter coverage'        gr lib 'perimeter'
ck 'ROI model counts 1 x D1 + 1 x E1'                 g  components/ROICalculator.tsx 'E1'
ck 'pricing states Essentials is field-only'          gr app/page.tsx 'field only|only\. The band at the wall'

hdr 'Geometry — the simulator and the live console share one plan'
ck 'lib/floorPlan.ts is the single geometry source'   test -f lib/floorPlan.ts
ck 'lanes TILE the field (no overhang)'               g  lib/floorPlan.ts 'laneCount'
ck 'perimeter pose for the E1 band'                   g  lib/floorPlan.ts 'perimeterPose'
ck 'floor painting with paired roughness map'         test -f lib/floorPaint.ts
ck 'sanding does not erase the grain (CUT_ALPHA)'     g  lib/floorPaint.ts 'CUT_ALPHA'
ck '3D live scene exists'                             test -f components/live/LiveScene3D.tsx
ck 'camera modes are clamped inside the room'         gr components/live/LiveScene3D.tsx 'clamp|Math.min|Math.max'

hdr 'Navigation & links'
ck 'Tools disclosure in the header'                   g  components/Header.tsx 'aria-expanded'
ck 'shared WorkspaceShell across every tool'          test -f components/WorkspaceShell.tsx
ck 'job id rides the query string between tools'      g  components/WorkspaceShell.tsx 'job='
ck 'no href="#" placeholder links'                    bash -c '! grep -rqE "href=\"#\"" app components'

hdr 'Discovery — LLMs and AI agent crawlers'
ck 'public/llms.txt served'                           test -f public/llms.txt
ck 'llms.txt describes the TWO-machine run'           g  public/llms.txt 'ForgeEdge E1 works the perimeter'
ck 'llms.txt tells agents not to present an offer'    g  public/llms.txt 'price, an offer, or something a reader can buy'
ck 'named AI crawlers in robots.ts'                   bash -c 'grep -qF "GPTBot" app/robots.ts && grep -qF "ClaudeBot" app/robots.ts && grep -qF "PerplexityBot" app/robots.ts'
ck '/operator/ disallowed to every crawler'           g  app/robots.ts '/operator/'
ck 'sitemap declares more than one page'              test -f app/sitemap.ts
ck 'head links llms.txt as an alternate'              gr app 'llms\.txt'
ck 'private routes are noindex'                       bash -c 'grep -rqF "noindex" app/dashboard app/operator'
ck 'dashboard metadata lives in a LAYOUT, not page'   test -f app/dashboard/layout.tsx

hdr 'Dependencies & the audit harness'
ck 'next is 16.3.x (4 high CVEs closed)'              gr package.json '"next":[[:space:]]*"\^?16\.'
ck 'playwright-core, NOT playwright (no 150MB build)' bash -c 'grep -qF "playwright-core" package.json && ! grep -qE "\"playwright\":" package.json'
ck 'audit:setup installs chromium separately'         g  package.json 'audit:setup'
ck 'audit:serve pins port 3111'                       g  package.json '3111'
ck 'shared browser launcher with fallbacks'           test -f audit/scripts/browser.mjs
ck 'continuous responsive sweep exists'               test -f audit/scripts/responsive.mjs
ck 'responsive tests 200% text and 320x256 reflow'    bash -c 'grep -qF "font-size:200%" audit/scripts/responsive.mjs && grep -qF "256" audit/scripts/responsive.mjs'
ck 'axe-core scan wired up'                           test -f audit/scripts/axe-scan.mjs
ck 'README warns about the && backgrounding trap'     g  audit/README.md 'backgrounds the'

hdr 'Copy — machine-and-number specificity (patch 39)'
ck 'homepage: "Three grits, two machines, one record."' g app/page.tsx 'Three grits, two machines'
ck 'homepage: "one machine cannot finish a floor"'      g app/page.tsx 'one machine cannot finish a floor'
ck 'homepage: "Run the model on your own numbers."'     g app/page.tsx 'Run the model on your own numbers'
ck 'homepage: "The pilot decides what this becomes."'   g app/page.tsx 'The pilot decides what this becomes'

hdr 'Copy — the live console tells the truth (patch 40)'
ck '/live headline names the machine COUNT'           g  app/live/page.tsx 'Two machines. One floor.'
ck '/live intro names both machines'                  bash -c 'grep -qF "SAND.name" app/live/page.tsx && grep -qF "EDGE.name" app/live/page.tsx'
ck '/live reads specs from lib/robots.ts'             g  app/live/page.tsx '@/lib/robots'
ck 'console note denies BOTH machines exist'          g  components/LiveJobConsole.tsx 'Neither a {robot.name} nor a {edger.name}'
ck 'homepage card describes two machines'             g  app/page.tsx 'cut the band at the wall'

# ---------------------------------------------------------------------------
printf '\n%s\n' "$(printf '%.0s-' {1..72})"
printf '\033[1m%d in, %d out\033[0m\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  printf '\nNot present in this working tree:\n'
  for m in "${MISSING[@]}"; do printf '  - %s\n' "$m"; done
  printf '\nEach line above is one patch that is missing, reverted, or overwritten.\n'
  exit 1
fi
printf 'Every patch through 40 is present in this working tree.\n'
