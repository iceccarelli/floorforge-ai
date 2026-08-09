# `audit/` — Phase 0 evidence

Everything in `audit/FINDINGS.md` is produced by a script in `audit/scripts/`. Nothing
here is an impression; if a number appears in a finding, the command that produced it is
listed next to it.

Base commit for every measurement: **`43bf65dfac6f870d65059c309e73aa8da7f5b4e9`**.

| File | What it is |
|---|---|
| `FINDINGS.md` | The defect list. P0–P3, each with route, viewport, auth state, `file:line`, measurement, customer impact, proposed fix, blast radius. |
| `DESIGN_SYSTEM.md` | Reconciliation against the root `DESIGN_SYSTEM.md` — what to keep, where the built site diverges, where I disagree and why. Includes the element × state matrix. |
| `DEFERRED.md` | What I chose not to fix, and what is not mine to decide. |
| `scripts/` | The instruments. |

## Running them

```bash
npm ci
npm run build
npx next start -p 3111 &          # scripts default to http://localhost:3111
```

Two scripts are dependency-free apart from the repo's own `typescript` and can run
anywhere, including the fast CI gate:

```bash
node audit/scripts/parse-check.mjs      # patch-hygiene gate — Part I.2
node audit/scripts/token-contrast.mjs   # deterministic WCAG table for every token pair
node audit/scripts/token-drift.mjs      # hardcoded-colour / arbitrary-value census
```

The rest drive a real browser. They are deliberately **not** in `package.json` — see
`DEFERRED.md` §D-1:

```bash
npm i --no-save playwright sharp axe-core
npx playwright install --with-deps chromium

node audit/scripts/overflow.mjs          # 6 routes x 10 viewports; exit 1 on any overflow
node audit/scripts/tap-targets.mjs       # WCAG 2.2 AA 2.5.8, phone viewports
node audit/scripts/contrast.mjs          # screenshot-sampled contrast, all routes
node audit/scripts/input-font-size.mjs   # iOS Safari focus-zoom (< 16px)
node audit/scripts/reduced-motion.mjs    # invisible-content guard; exit 1 on any
node audit/scripts/axe-scan.mjs          # axe-core WCAG 2.1/2.2 A+AA + best-practice
node audit/scripts/structure.mjs         # headings, landmarks, chrome parity
node audit/scripts/payload.mjs           # cold transfer per route + three.js containment
```

Every script exits non-zero when it finds something, so any of them can become a CI gate
without modification. Point them at a deployment with `AUDIT_BASE_URL`:

```bash
AUDIT_BASE_URL=https://floorforge-ai.vercel.app node audit/scripts/overflow.mjs
```

## Notes on the instruments

- **`contrast.mjs` samples backgrounds from a real screenshot**, not by walking
  `background-color` up the DOM, so gradients, images and translucent overlays are
  measured as the user sees them. It runs the page with `reducedMotion: "reduce"` so
  `<Reveal>` content is not skipped at `opacity: 0`. Tailwind v4 emits `color-mix()` /
  `oklab()` for `/alpha` utilities; the script normalises those through a canvas rather
  than regexing `rgba()`. Text over photographic renders is inherently
  sample-point-dependent — treat those rows as a risk signal, not a verdict.
- **`token-contrast.mjs` is the authority for token pairs.** Pure arithmetic, no browser,
  identical output every run. Prefer it over `contrast.mjs` when both cover a pair.
- **`overflow.mjs` ignores elements inside a self-scrolling ancestor**, so a horizontally
  scrollable rail is not reported as page overflow.
- **`parse-check.mjs` is the gate Part I.2 mandates.** It runs the TypeScript compiler
  API over every tracked `.ts`/`.tsx`, and additionally fails on a literal `\n` outside a
  string/template/regex/comment and on a `${...}` stranded inside a plain string literal
  — both detected through the scanner and AST, never by blind text replacement.

## Auth-state coverage

With no Clerk keys configured, `lib/auth.ts` disables auth and `proxy.ts` becomes a
pass-through, so `/dashboard` and `/operator/*` render for everyone. **All results for
gated routes are the signed-out / auth-disabled state.** The other two states in the
mission's matrix require Clerk credentials and were not tested. See `FINDINGS.md` §8.
