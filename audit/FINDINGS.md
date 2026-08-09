# FloorForge — Phase 0 Findings

**Base commit:** `43bf65dfac6f870d65059c309e73aa8da7f5b4e9`
**Branch:** `main`
**Audit date:** 2026-08-08
**Method:** pristine `git clone` → `npm ci` → `npm run build` → `next start -p 3111`,
then scripted measurement (`audit/scripts/`) against the production build, plus one
live-production check of `https://floorforge-ai.vercel.app/`.

Every row below carries a `file:line`, a measured number, or a reproducible script
invocation. Nothing here is an impression. Where an instrument could not settle a
question, the row says so rather than guessing.

---

## 0. How to reproduce every number in this document

```bash
git clone https://github.com/iceccarelli/floorforge-ai && cd floorforge-ai
git checkout 43bf65dfac6f870d65059c309e73aa8da7f5b4e9
npm ci && npm run build && npx next start -p 3111 &

node audit/scripts/parse-check.mjs        # patch-hygiene gate (Part I.2)
node audit/scripts/token-contrast.mjs     # deterministic contrast table, no browser
node audit/scripts/token-drift.mjs        # hardcoded colour / arbitrary-value census
node audit/scripts/overflow.mjs           # 6 routes x 10 viewports
node audit/scripts/tap-targets.mjs        # WCAG 2.2 AA 2.5.8
node audit/scripts/contrast.mjs           # screenshot-sampled contrast, all routes
node audit/scripts/input-font-size.mjs    # iOS Safari focus-zoom
node audit/scripts/reduced-motion.mjs     # invisible-content guard
node audit/scripts/axe-scan.mjs           # axe-core WCAG 2.1/2.2 A+AA
node audit/scripts/structure.mjs          # headings, landmarks, chrome parity
node audit/scripts/payload.mjs            # cold transfer + three.js containment
```

`audit/scripts/*.mjs` need `playwright`, `sharp` and `axe-core` on the module path.
They are deliberately **not** added to `package.json` — see `audit/DEFERRED.md` §D-1.

---

## 1. Severity summary

| Sev | Count | Definition |
|---|---|---|
| **P0** | 6 | Breaks usability or trust on a conversion path |
| **P1** | 9 | Inconsistency a prospect would notice — especially marketing-vs-console drift |
| **P2** | 11 | Polish: missing state, uneven motion, alignment drift |
| **P3** | 6 | Hygiene: dead code, stale docs, committed binaries |

Aggregate measured totals on the base commit:

| Instrument | Result |
|---|---|
| `npx tsc --noEmit` | **clean** (exit 0) |
| `npm run lint` | **exit 1 — 2 errors, 3 warnings** |
| `npm run build` | **succeeds** (14/14 static pages) |
| `parse-check.mjs` | 46 files parse clean, 0 stranded `${}`, 0 literal `\n` |
| Horizontal overflow | **5 of 60** route × viewport combinations fail |
| Tap targets < 44 × 44 | **847 element instances / 118 unique** across 6 routes |
| axe-core violating nodes | **28** (3 critical) |
| Contrast: token pairs | **5 of 31 FAIL** |
| Contrast: rendered text runs | **42 of 599 FAIL** (17 unique colour/bg/size combos) |
| Content invisible under reduced motion | **12 blocks / 311 words on `/`** |
| Token drift (hardcoded colour + arbitrary value) | **555 instances across 25 files** |
| Cold mobile transfer, `/` | **2,290.7 KB initial → 2,692.1 KB after scroll** (uncompressed) |
| `three` / `@react-three/drei` in homepage JS | **absent — correctly contained** |

---

## 2. P0 — conversion-path and trust defects

### P0-1 · Every waitlist CTA in production resolves to a personal Gmail address

| | |
|---|---|
| **Route** | `/` (all viewports, all auth states) — and production, verified live |
| **Evidence** | `components/WaitlistCTA.tsx:8-9`, `:75-89` |
| **Verified on production** | Yes. Fetched `https://floorforge-ai.vercel.app/` on 2026-08-08. The pilot-program section renders a single link: `mailto:vince.ceccarelli@gmail.com?subject=FloorForge%20pilot%20waitlist`. No form fields are present. The address appears **three times** on the live page. |

```ts
// components/WaitlistCTA.tsx:8
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;
const CONTACT_EMAIL = "vince.ceccarelli@gmail.com";
```

`NEXT_PUBLIC_*` is inlined at build time. With the variable unset in Vercel, line 75
(`if (!FORMSPREE_ID)`) is statically true for every production build, so the complete
five-field lead-capture form at `:91-158` **never ships**. What ships is one mailto
button.

**Why a customer cares.** A commercial refinishing contractor evaluating a
$299–$799/mo platform clicks "Join the pilot waitlist" and their OS opens Outlook with
a blank draft to a Gmail address. On a phone with no mail client configured, nothing
happens at all. The company has no sales team and no second channel; this is the entire
inbound path.

**The engineering is not the defect.** The Formspree integration at `:34-61` is
complete and correct, and the mailto fallback is the right call — a dead button would
be worse. **The failure is configuration, not code.** See `FLOORFORGE_MANIFEST.md` §
"The one configuration change no patch can make".

**Blast radius:** none for the fallback itself. Setting the env var flips the branch and
ships the form with zero code change.

---

### P0-2 · 23 % of the homepage is invisible under `prefers-reduced-motion` and with JavaScript off

| | |
|---|---|
| **Route** | `/` |
| **Evidence** | `components/Reveal.tsx:21-37`; used at `app/page.tsx:178, 233, 263` |
| **Screenshot** | `02-home-1440-REDUCED-MOTION.png` vs `01-home-1440-normal.png` |
| **Script** | `node audit/scripts/reduced-motion.mjs` → `invisible: 12` |

Measured, `prefers-reduced-motion: reduce`, viewport 1440 × 900, after full-page scroll
and 1.5 s settle:

```
mq: true, invisible blocks: 12
  { opacity: "0", transform: "matrix(1, 0, 0, 1, 0, 16)",
    inlineStyle: "opacity:0;transform:translateY(16px)",
    text: "Interactive concept demoDrive the robots…" }
  …
under prefers-reduced-motion: no-preference → invisible blocks: 0
```

The prerendered HTML contains the string `opacity:0;transform:translateY(16px)`
**12 times** (`curl -s localhost:3111/ | grep -c`). With JavaScript disabled entirely:

```
{"hiddenBlocks":12,"hiddenWords":311,"totalWords":1356}
```

**What is hidden:** the simulator teaser, all six capability cards under
"Everything a refinishing operation needs", and all five steps of
"From scan to sign-off". That is the entire product explanation — 311 of 1,356 words.

**Root cause.** `Reveal` guards correctly *on the client*:

```tsx
// components/Reveal.tsx:21-25
const reduce = useReducedMotion();
if (reduce) return <div className={className}>{children}</div>;
```

but `/` is statically prerendered (`○ /` in the build output), and on the server
`useReducedMotion()` is false, so `motion.div initial={{opacity:0,y:16}}` serialises the
inline style into the shipped HTML. After hydration the component switches to a plain
`<div>` that carries no `style` prop — and the already-committed inline style is not
cleared. The elements never animate in either (they stay at `opacity: 0`, so
`whileInView` did not run), which confirms the reduce branch *did* take effect. **No
hydration warning is logged** — Playwright captured zero console errors or warnings on
`/` in both motion modes. It fails silently.

**Why a customer cares.** Reduced motion is a common OS default, not an edge case, and
it is disproportionately enabled by users with vestibular conditions and by anyone who
turned it on to save battery. Those visitors see a hero, a pricing table, and blank
space where the product is explained. Search and AI crawlers that render without
executing JS see the same thing.

**Blast radius:** one component, three call sites. This is the cheapest P0 on the list.

---

### P0-3 · `/dashboard` overflows horizontally on every phone tested

| | |
|---|---|
| **Route** | `/dashboard` |
| **Evidence** | `app/dashboard/page.tsx:57-70` |
| **Screenshot** | `03-dashboard-375-OVERFLOW.png` |
| **Script** | `node audit/scripts/overflow.mjs` → 5 of 60 combinations fail |

| Viewport | `scrollWidth` | `clientWidth` | Overflow |
|---|---|---|---|
| 320 × 640 | 455 | 320 | **135 px** |
| iPhone SE 375 × 667 | 455 | 375 | **80 px** |
| iPhone 15 Pro 393 × 852 | 456 | 393 | **63 px** |
| Pixel 8 412 × 915 | 455 | 412 | **43 px** |
| iPhone 15 Pro Max 430 × 932 | 455 | 430 | **25 px** |

Culprit: the fixed-height sticky sub-header row at `app/dashboard/page.tsx:57-70`,
a `flex … justify-between` with no wrap and no responsive collapse. The right-hand
cluster (`flex items-center gap-3 text-sm`, `left: 357 → right: 455`) is pushed off
the viewport, taking the avatar chip with it.

**`/` does not overflow at any of the ten viewports.** The marketing page is clean; the
console is not. That asymmetry is the theme of this audit.

**Why a customer cares.** `/dashboard` is linked from the footer of every page as
"Dashboard Preview" — it is a prospect-facing artefact. A page that pans sideways on a
phone reads as unfinished software, which is precisely the objection a pre-launch
robotics company cannot afford.

---

### P0-4 · The ROI calculator's sliders have no accessible name and a 16 px tall hit area

| | |
|---|---|
| **Route** | `/` (`#roi`) |
| **Evidence** | `components/ROICalculator.tsx:68-80`, `:84-96` |
| **Script** | `axe-scan.mjs` → `label`, impact **critical**, 2 nodes: `input[min="1500"]`, `input[min="20"]` |

```tsx
// components/ROICalculator.tsx:68-78 — no htmlFor, no id, no aria-label
<label className="block text-xs …">FLOOR AREA (SQFT)</label>
<input type="range" min="1500" max="45000" step="500" … />
```

Both range inputs are announced by a screen reader as an unlabelled slider with a bare
number and no unit (`aria-valuetext` is absent too). Measured hit area at 393 × 852:
**16 px tall** (`tap-targets.mjs`) — against a 44 px requirement.

The job-type toggle at `:102-112` compounds it: two `<button>`s whose only selected-state
signal is `bg-accent text-white`. No `aria-pressed`, no `role="radiogroup"`. The
selection is conveyed by colour alone — a WCAG 1.4.1 failure as well as an ARIA gap.

**Why a customer cares.** The ROI model is the page's single strongest argument and the
mission's own conversion path. A contractor operating one-handed on a job site cannot
reliably drag a 16 px target, and a keyboard or screen-reader user cannot tell what they
are adjusting.

---

### P0-5 · `/operator/*` renders two headers, two `<main>` landmarks and two footers

| | |
|---|---|
| **Routes** | `/operator/applications`, `/operator/jobs` |
| **Evidence** | `app/operator/layout.tsx:20-65` nested inside `app/layout.tsx:51-55` |
| **Screenshot** | `04-operator-jobs-1440-DOUBLE-CHROME.png` |
| **Script** | `structure.mjs`; `axe-scan.mjs` → `landmark-no-duplicate-main`, `landmark-main-is-top-level`, `landmark-unique` |

```
/operator/jobs   header=2  main=2  footer=2  nav=2 (labelled 0)
                 header heights=[81, 89]   footer heights=[53, 432]
/                header=1  main=1  footer=1  nav=1 (labelled 0)
```

`app/operator/layout.tsx` builds a complete second page chrome — its own `<header>`
with an `<h1>`, its own `<nav>`, its own `<main>`, its own `<footer>` — and Next.js nests
all of it inside the root layout's `<main id="main">`. The screenshot shows the result:
the marketing header, then a second console header, then the console footer, then ~400 px
of dead white space, then the marketing footer.

Two `<main>` elements is an unambiguous WCAG 1.3.1 failure; a screen-reader user who
jumps to the main landmark lands in the wrong one.

---

### P0-6 · `npm run lint` fails on `main`

| | |
|---|---|
| **Evidence** | `app/operator/applications/page.tsx:51`, `app/operator/jobs/page.tsx:51` |
| **Command** | `npm run lint` → **exit 1**, `✖ 5 problems (2 errors, 3 warnings)` |

```
error  react-hooks/immutability
  `fetchJobs` is accessed before it is declared, which prevents the earlier
  access from updating when this value changes over time.
```

This is why `FLOORFORGE_02_ci_verification.patch` is not a five-line YAML file. Adding
the mandated `npm ci → tsc → lint → build` workflow to this commit produces a red first
run. The two errors must be fixed **in the same patch that introduces the gate**, or the
gate has to ship disabled — and a disabled gate is worse than none. Fixing them is a
logic change (hoisting a function declaration above its `useEffect`), which Part II.4
places in scope only insofar as it unblocks CI; it is recorded in
`audit/DEFERRED.md` §D-2 as a decision for the owner.

`npx tsc --noEmit` is clean and `npm run build` succeeds, so this is a lint-only failure
today — but it is exactly the class of thing that reaches production unnoticed when
nothing runs on push.

---

## 3. P1 — inconsistency a prospect would notice

### P1-1 · The operator console is a different product: 163 token violations, zero tokens used

`token-drift.mjs`, top of the census:

| File | Total | hex | rgb/hsl | arbitrary `[...]` | raw palette | `white`/`black` |
|---|---|---|---|---|---|---|
| `app/operator/jobs/page.tsx` | **89** | 0 | 0 | 0 | **79** | 10 |
| `app/operator/applications/page.tsx` | **74** | 0 | 0 | 0 | **68** | 6 |
| `components/ShowcaseCarousel.tsx` | 54 | 0 | 0 | 24 | 7 | 23 |
| `components/simulator/ProTeardown.tsx` | 47 | 7 | 1 | 11 | 0 | 28 |
| `app/globals.css` | 33 | 25 | 8 | 0 | 0 | 0 |
| `app/page.tsx` | 32 | 0 | 0 | 24 | 0 | 8 |
| … | | | | | | |
| **TOTAL (25 files)** | **555** | 116 | 9 | 110 | 183 | 137 |

The console's primary action colour is `bg-blue-600` (`app/operator/jobs/page.tsx:166,
179`) on a site whose accent token is `#b45309` amber. Status pills use
`bg-blue-100 / bg-gray-100 / bg-gray-200` (`:25-33`), borders use `border-gray-300`
(`:146`), body copy uses `text-gray-500 / text-gray-700 / text-gray-900`. Not one
`--accent`, `--border`, `--muted-foreground` or `--card` reference appears in either
operator route.

This is the "marketing page and product console drifting into two products" failure the
brief predicted, and the screenshot makes it undeniable: an amber industrial header
sitting directly above a blue-and-grey admin table.

### P1-2 · The published design system's contrast figures are wrong by 40–55 %

`DESIGN_SYSTEM.md` (root, v1.0, dated 2026-08-03) states "All combinations meet WCAG AA"
and publishes four ratios. Measured with `token-contrast.mjs` (pure arithmetic,
reproducible):

| Pair | `DESIGN_SYSTEM.md` claims | Measured | Delta |
|---|---|---|---|
| `#0f172a` on `#ffffff` | 16.3:1 | **17.85:1** | +9 % |
| `#64748b` on `#ffffff` | 7.1:1 | **4.76:1** | **−33 %** |
| `#b45309` on `#ffffff` | 7.8:1 | **5.02:1** | **−36 %** |
| `#b45309` on `#fef3c7` | 6.2:1 | **4.51:1** | **−27 %** |

All four still pass AA, so nothing is broken *because* of the doc — but the team has been
choosing colour pairs and text sizes against headroom that does not exist.
`--muted-foreground` on white is 4.76:1, not 7.1:1: it has 0.26 of margin, not 2.6. The
pair the document does not list is the one that actually fails (see P1-3).

**I disagree with this section of `DESIGN_SYSTEM.md` and recommend replacing its
contrast table with generated output from `audit/scripts/token-contrast.mjs`,** so the
numbers cannot drift from the tokens again. Full reconciliation in
`audit/DESIGN_SYSTEM.md`.

### P1-3 · Five token pairs fail WCAG AA

`node audit/scripts/token-contrast.mjs` → 31 pairs measured, 5 FAIL:

| Foreground | Background | Req | Measured | Where |
|---|---|---|---|---|
| `--muted-foreground` `#64748b` | `--accent-light` `#fef3c7` | 4.5:1 | **4.27:1** | amber badges; `/simulator` platform caption |
| `--border` `#e2e8f0` | `--bg` `#ffffff` | 3:1 | **1.23:1** | every card, input and chip boundary |
| `--border` `#e2e8f0` | `--muted` `#f8fafc` | 3:1 | **1.18:1** | card boundaries on muted sections |
| `#ffffff @ 0.40` | `--primary` `#0f172a` | 4.5:1 | **3.80:1** | footer copyright, `Footer.tsx:48` — **every route** |
| `#b45309 @ 0.70` | `--muted` `#f8fafc` | 3:1 | **2.89:1** | how-it-works step numerals, `app/page.tsx:265` |

The `--border` result is the structural one. At 1.23:1 the card and input boundaries are
effectively invisible to anyone with reduced contrast sensitivity — every `.card`,
every `.input`, every chip on the site. WCAG 1.4.11 requires 3:1 for UI component
boundaries. This is one token, and fixing it fixes the whole site.

### P1-4 · Rendered-text contrast: 42 failing runs, 17 unique combinations

`node audit/scripts/contrast.mjs` — 599 text runs measured across 6 routes with
backgrounds sampled from real screenshots (so gradients, images and translucent overlays
are measured as seen, not as declared). Confirmed failures beyond the token pairs:

| Ratio | Size/weight | Colour on background | Route | Text |
|---|---|---|---|---|
| **3.54** | 11 px / 600 | `#fff` on `rgb(195,117,58)` | `/` | active category count badge (`bg-white/20` over `--accent`) |
| **2.91** | 60 px / 600 | `text-accent/70` on `--muted` | `/` | how-it-works numerals "01"…"05" |
| **4.36** | **9 px** / 400 | `--muted-foreground` on `#f5f5f4` | `/simulator` | *"Concept simulation. Figures are design targets…"* |
| **4.27** | 12 px / 400 | `--muted-foreground` on `--accent-light` | `/simulator` | platform caption |
| **4.23** | 10 px / 400 | `--muted-foreground` on `#eef2f6` | `/simulator` | *"Drag to orbit · scroll to zoom…"* |
| **4.35** | 12 px / 500 | `--accent` on `#f7ede6` | `/dashboard` | "PRODUCTION" pill |
| **4.47** | 12 px / 600 | `--accent` on `#f4f1ef` | `/dashboard` | "CROSS-PLATFORM OPPORTUNITY" |
| **4.20** | 14 px / 500 | `--muted-foreground` on `#eef1f4` | `/dashboard` | "Fleet Health" tab |
| **3.80** | 10 px / 400 | `text-white/40` on `--primary` | **all 6** | footer copyright |

The `/simulator` row deserves its own note. That 9 px, 4.36:1 line is an **honesty
disclaimer** — "Figures are design targets, not measured specifications". It is
simultaneously the smallest and one of the lowest-contrast pieces of text on the site.
Per Part II.1 this must not be removed, weakened or relocated; it should be *promoted*.
A disclaimer set at 9 px in low-contrast grey reads as legal throat-clearing. Set at
13–14 px in `--foreground` with an accent rule it reads as an engineering statement, and
it is more credible. That is a typography fix, not a content change, and it belongs in
`FLOORFORGE_03_tokens.patch` / `FLOORFORGE_07_a11y.patch`.

**Instrument limitation, stated plainly:** four additional "failures" in the raw output
are white card-overlay captions sitting on concept renders
(`ShowcaseCarousel.tsx:362-371`). The sampler returned 1.0–4.4:1 depending on which
pixel of the render it landed on. I am **not** recording those as confirmed failures —
but the underlying risk is real and worth its own row: white text over an arbitrary
photographic render, protected only by a partial `from-slate-950/75` scrim, has no
guaranteed contrast floor. Recorded as **P2-11**.

### P1-5 · 118 unique tap targets below 44 × 44 CSS px

`node audit/scripts/tap-targets.mjs` — 847 instances, 118 unique, across all six routes
and five phone viewports. Per route: `/` 21, `/simulator` 21, `/pro-simulator` 19,
`/dashboard` 17, `/operator/applications` 19, `/operator/jobs` 21.

The ones that matter:

| Element | Measured | File |
|---|---|---|
| Mobile menu toggle (**every route**) | 38 × 38 | `components/Header.tsx:128-134` |
| ROI + simulator range inputs | **width × 16** | `ROICalculator.tsx:70, 86`; `ControlPanel.tsx` |
| Showcase category chips ×5 | 159–195 × **38** | `ShowcaseCarousel.tsx:439-458` |
| Every footer link (10) | 55–124 × **18** | `components/Footer.tsx:57-105` |
| Footer social icon | **26 × 26** | `components/Footer.tsx:116-125` |
| Simulator room presets / cutaway | 228–786 × **38** | `components/simulator/ControlPanel.tsx` |
| Dashboard "+ New Job from Scan" | 157 × **36** | `app/dashboard/page.tsx:144` |
| Dashboard "View live telemetry" | 146 × **28** | `app/dashboard/page.tsx:170` |
| Mailto CTA in the fallback | 364 × **21** | `WaitlistCTA.tsx:79-83` |

The mailto row is the worst of these in business terms: the site's only working
conversion CTA on production has a 21 px tall hit area, because a `<Button>` is nested
inside a bare `<a>` and the anchor — not the button — is what the browser sizes.

That nesting is also invalid HTML: `<a>` may not contain a `<button>`
(`WaitlistCTA.tsx:79-83`). Recorded as **P2-1**.

The root cause for the `.btn` family is one media query:

```css
/* app/globals.css:295-304 */
@media (max-width: 768px) {
  .btn { padding: 10px 18px; font-size: 13px; }   /* → ~33 px tall */
}
```

The site *shrinks* its buttons at exactly the viewport where they need to grow.

### P1-6 · Three CTAs hardcode `mailto:` and bypass `WaitlistCTA`

Mission item II.2.3 asked for this audit. Result — every waitlist CTA does route through
the single component, **except** three "Contact" affordances that do not:

| # | File:line | Element |
|---|---|---|
| 1 | `components/Header.tsx:85-90` | Desktop "Contact us" |
| 2 | `components/Footer.tsx:72-74` | Footer "Contact Us" |
| 3 | `components/Footer.tsx:84-89` | Footer "Email" |

Plus the address appears a fourth time in structured data
(`components/StructuredData.tsx:25`), publishing a personal Gmail to every crawler that
parses the `Organization` node.

The eight *waitlist* CTAs — hero (`page.tsx:133`), simulator teaser (`page.tsx:208`),
ROI (`ROICalculator.tsx:163`), pricing ×3 (`page.tsx:378, 397, 415`), final CTA
(`page.tsx:447`), header (`Header.tsx:117`), mobile menu (`Header.tsx:179`), lightbox
(`ShowcaseCarousel.tsx:238`) — all scroll to `#waitlist`, which renders `WaitlistCTA`.
That part is correct and should be preserved.

**Recommendation, not a change.** The Gmail address is a credibility problem on a B2B
robotics site quoting $799/mo — a prospect reads it as "there is no company here yet". A
domain address (`pilot@floorforge.ai`) costs nothing and changes the read entirely. Per
Part VII.6 I am **not** changing the address; it is the owner's call.

### P1-7 · `/dashboard` has no `<h1>` and starts its heading hierarchy at `<h3>`

`structure.mjs` → `/dashboard: h1Count=0, headings: h3`. `axe-scan.mjs` →
`page-has-heading-one`, moderate. A crawler and a screen-reader user both encounter a
page with no title-level heading, whose first heading is two levels deep.

### P1-8 · The `<canvas>` on both WebGL routes uses a prohibited ARIA attribute

`components/simulator/Simulator.tsx:49` and `components/simulator/ProTeardown.tsx:154`
put `aria-label` on `<Canvas>`. `<canvas>` has no implicit ARIA role, so `aria-label`
is prohibited — axe flags `aria-prohibited-attr` (serious) on both routes. The label is
therefore **not announced**: the intent was right, the mechanism does not work. The fix
is `role="img"` plus the label, and — better — a real text equivalent (see P1-9).

### P1-9 · No `<nav>` on any route has an accessible name

`structure.mjs` → `navLabelled: 0` on all six routes. `/operator/*` has two unlabelled
`<nav>` elements, which axe reports as `landmark-unique`. A screen-reader user
navigating by landmark gets "navigation, navigation" with no way to tell them apart.

---

## 4. P2 — polish and state coverage

| ID | Finding | Evidence |
|---|---|---|
| **P2-1** | `<Button>` nested inside `<a>` — invalid HTML, and the anchor sizes the target | `WaitlistCTA.tsx:79-83` |
| **P2-2** | Waitlist form is not a `<form>`: no Enter-to-submit, no `required`, no `aria-describedby`, no per-field error state; labels have no `htmlFor`/`id` | `WaitlistCTA.tsx:99-154` |
| **P2-3** | Mobile menu button has no `aria-expanded` / `aria-controls`; its label is the static "Toggle menu" in both states | `Header.tsx:128-134` |
| **P2-4** | Mobile menu animates `height: 0 → auto` — a layout-animating property, and `Header.tsx` never calls `useReducedMotion()`, so it animates for users who opted out | `Header.tsx:141-146` |
| **P2-5** | Header nav items are `<button>`s, not `<a href="/#…">`: not crawlable, no middle-click, no open-in-new-tab, and no active-section treatment (`aria-current` absent) | `Header.tsx:63-71` |
| **P2-6** | Two CTAs reach the chatbot by `document.querySelector('[aria-label="Open FloorForge Assistant"]')?.click()`. Renaming that label silently kills both buttons | `app/page.tsx:455`; `ROICalculator.tsx:178` |
| **P2-7** | `scrollIntoView({behavior:"smooth"})` used in 4 places with no reduced-motion guard | `page.tsx:18`; `ROICalculator.tsx:168`; `ShowcaseCarousel.tsx:246, 295` |
| **P2-8** | Radix `Dialog.Content` sets `onOpenAutoFocus={e => e.preventDefault()}` — the lightbox opens without moving focus into it, so it is not announced | `ShowcaseCarousel.tsx:87` |
| **P2-9** | Category tabs have no `role="tab"`/`aria-selected`/`aria-pressed`; selection is colour-only | `ShowcaseCarousel.tsx:439-458` |
| **P2-10** | `.btn` and `.quick-reply` animate `transition: all`, violating transform/opacity-only discipline; durations (0.1/0.15/0.2/0.3/0.4/0.6 s) and easings are hardcoded in eight places with no tokens | `globals.css:84, 143, 167, 198, 212, 278` |
| **P2-11** | White overlay captions sit on arbitrary concept renders behind a partial scrim — no guaranteed contrast floor | `ShowcaseCarousel.tsx:362-371` |
| **P2-12** | Disabled state for the rail arrows is `opacity-0` (invisible) rather than a designed inert treatment; no `:disabled` styling exists anywhere in `globals.css` | `ShowcaseCarousel.tsx:317-331` |
| **P2-13** | `/operator/jobs` `<select>` has no accessible name (axe `select-name`, **critical**) and a 14 px font that triggers iOS focus-zoom | `app/operator/jobs/page.tsx:140-155` |

**Element × state matrix.** The full grid is in `audit/DESIGN_SYSTEM.md` §5. Summary of
the empty cells across the whole site: `rest` 100 % covered, `hover` ~90 %,
`focus-visible` covered globally for `button`/`a` by `globals.css:288-292` but **not**
for `input`, `select`, `textarea`, `[role]` or `[tabindex]` elements; `active` covered
only on `Button` (`active:scale-[0.985]`); **`disabled` has no designed treatment
anywhere except `disabled:opacity-50` on `Button`; `loading` exists only on the waitlist
submit; `error`/`success` exist only as `sonner` toasts, never inline on a field.**

---

## 5. P3 — hygiene

| ID | Finding | Measured |
|---|---|---|
| **P3-1** | 11 committed archives + 1 multi-megabyte PNG = **19.7 MB** in the working tree; `.git` is **67 MB** | see table below |
| **P3-2** | Three `*.patch` files committed despite `.gitignore:41` listing `*.patch` | `04-pro-teardown-native.patch` (21.5 KB), `showcase-systems.patch` (32.0 KB), `showcase-v2-categorized.patch` (48.0 KB) |
| **P3-3** | **22 markdown documents at repo root**, ~380 KB, several superseded | see `audit/DESIGN_SYSTEM.md` §7 |
| **P3-4** | `openclaw-workspace-state.json` (141 B) is tool state, not source | root |
| **P3-5** | Dead no-op `setTimeout(() => {/* Could enhance… */}, 300)` | `ROICalculator.tsx:180-182` |
| **P3-6** | Redundant inline `style={{ scrollbarWidth: "none" }}` duplicating `.no-scrollbar` | `ShowcaseCarousel.tsx:339` |

Committed binaries (`git ls-files`, sizes from the working tree):

```
showcase-assets.zip                          4,434,178 B
floorforge-image-library-ALL-78.png          4,038,604 B
floorforge_social_campaign_machines (1).zip  1,411,151 B
floorforge_social_campaign_machines (2).zip  1,411,151 B
floorforge_social_campaign_machines (4).zip  1,100,775 B
floorforge_social_campaign_machines (3).zip    387,900 B
floorforge_social_campaign_machines.zip        336,115 B
floorforge_social_campaign.zip                 329,815 B
floorforge_social_campaign (4).zip             303,160 B
floorforge_social_campaign (3).zip             299,170 B
floorforge_social_campaign (2).zip             287,799 B
floorforge_social_campaign (1).zip             273,534 B
────────────────────────────────────────────────────────
11 archives + 1 PNG                         19,712,352 B  (18.8 MiB)
```

**Correction to the brief's ground truth:** the brief states "12 zip archives". There
are **11** (`git ls-files '*.zip' | wc -l` → 11). The 22-document count, the 78 `.webp`
count, the 352-line `globals.css`, the 11 inline `style={{}}`, the 6 routes and the
5 API routes all check out exactly.

`proxy.ts` (root, 755 B) is **not** stray: it is the Clerk middleware, renamed for
Next.js 16's proxy convention (commit `ce40ec7`). It belongs in version control. It also
contains a genuinely good decision worth preserving — auth degrades to a pass-through
when Clerk keys are absent, so the site deploys with zero env vars.

---

## 6. Performance and media — measured

`node audit/scripts/payload.mjs`, cold context per route, iPhone-15-Pro emulation
(393 × 852 @ DPR 3), against `next start`. **Bytes are uncompressed** — Vercel serves
Brotli, so real-world transfer will be materially lower. Stated as a floor for
comparison, not as a Lighthouse figure.

| Route | Initial KB | After full scroll KB | Images KB | JS KB | `three`? | `drei`? |
|---|---|---|---|---|---|---|
| `/` | 2,290.7 | **2,692.1** | 1,276.6 | 1,015.5 | **no** | **no** |
| `/simulator` | 2,211.6 | 2,211.6 | 0 | 1,960.9 | yes | yes |
| `/pro-simulator` | 2,209.5 | 2,210.1 | 0 | 1,949.3 | yes | yes |
| `/dashboard` | 1,271.3 | 1,276.3 | 0 | 1,014.6 | no | no |
| `/operator/applications` | 1,279.3 | 1,280.3 | 0 | 1,017.3 | no | no |
| `/operator/jobs` | 1,279.7 | 1,280.8 | 0 | 1,017.3 | no | no |

**Findings, and one non-finding.**

- **`three` and `@react-three/drei` are correctly excluded from the homepage bundle.**
  Proven by scanning every script served to `/` for `THREE.WebGLRenderer`,
  `BufferGeometry` and drei markers: zero hits, versus 928.7 KB of matched chunk on
  `/simulator`. `SimulatorLoader.tsx` and `ProTeardownLoader.tsx` use
  `next/dynamic` with `ssr: false` correctly. **This is not a defect. It is already
  right.**

- **The `sizes` audit the brief anticipated does not find a defect either.** All four
  `next/image` call sites carry a correct `sizes`
  (`ShowcaseCarousel.tsx:119, 226, 358, 485`). The `w=3840` seen in live HTML is
  `next/image`'s **`src` fallback attribute**, which is always the largest configured
  device size; the browser selects from `srcset` using `sizes` and never fetches it. All
  78 source renders are 784 × 1168, so the optimiser cannot emit anything larger than
  784 px wide regardless. **I am recording this as a false positive rather than
  inventing a finding to match the brief.**

- **The real image lever is count, not dimensions.** `/` mounts **43 `<img>` elements**
  on first paint — the 10-item featured rail plus all 33 renders in the default
  "Field Sanding" category (`ShowcaseCarousel.tsx:473-494`; `lib/showcase.ts` category
  split: sand 33, edge 7, dust 12, finish 13, qa 13 = 78). They are lazy, so **898.9 KB
  of images still land before any scroll**, rising to 1,276.6 KB after. Only the active
  category renders, so 78 never mount at once — the brief's worst case does not occur.
  Recommendation for `FLOORFORGE_09`: move the full library behind an explicit
  "Show all 33" control or its own route, keeping the featured rail on `/`. **Do not
  delete renders** — they are the product's only evidence.

- **The prerendered HTML for `/` is 174.7 KB.** That is unusual for a marketing page and
  is driven by 43 inlined `<img>` elements with full `srcset` strings plus the entire
  copy deck.

- **CLS.** `ShowcaseCarousel.tsx:21-23` documents fixed-aspect boxes with
  `next/image fill`, so layout is reserved before load. Fonts use `next/font` via
  `geist` (`app/layout.tsx:2-3, 44`), which self-hosts and avoids FOIT. **No CLS source
  identified in review.** Not measured under throttling — see §8.

- **INP.** The ROI recompute is a `useMemo` over five arithmetic operations
  (`ROICalculator.tsx:20-46`). No layout reads, no DOM writes per frame. **No INP risk
  found in the ROI path.** Not measured under 4× CPU throttling — see §8.

### WebGL audit (Part III.5)

| Check | Result |
|---|---|
| Dynamically imported, excluded from `/` | **Yes** — proven above |
| `prefers-reduced-motion` respected | **No** — `grep -rn 'useReducedMotion\|prefers-reduced-motion' components/simulator/` returns **nothing** |
| Pauses when off-screen or tab hidden | **No** — no `visibilitychange`, no `frameloop="demand"`, no `invalidate()` anywhere in `components/simulator/` |
| Graceful non-WebGL fallback | **None found** — no context-lost handler, no capability check |
| Keyboard focus trap | Not reproduced — the canvas is not in the tab order, so no trap was observed. Conversely it is not keyboard-operable at all. |
| Text equivalent of what it conveys | **Absent** — `aria-label` on `<canvas>` is prohibited and not announced (P1-8). `/simulator` has exactly **one heading** and no textual description of the coverage pass the canvas demonstrates. |
| Inline styles genuinely dynamic | **10 of 11 yes, 1 no.** `MetricsHUD.tsx:52, 65, 86, 115`, `ProTeardown.tsx:143, 167, 185`, `ControlPanel.tsx:65`, `page.tsx:201`, `dashboard/page.tsx:165` all interpolate runtime values. `ShowcaseCarousel.tsx:339` is static and duplicates `.no-scrollbar`. One hardcoded hex hides inside a dynamic one: `MetricsHUD.tsx:65` falls back to `"#94a3b8"`. |

A continuously-running render loop on a page a prospect may leave open is a battery and
INP liability, and it is the single highest-value fix on both simulator routes.

---

## 7. Machine readability (Phase 8 pre-work)

| Check | Result |
|---|---|
| One `<h1>` per route | **5 of 6.** `/dashboard` has none (P1-7) |
| Skipped heading levels | **None** on any route |
| `<main>` unique | **No** on `/operator/*` (P0-5) |
| `<nav>` labelled | **0 of 8** across all routes (P1-9) |
| `<figure>`/`<figcaption>` on the render gallery | **0** — 43 bare `<img>` in `<button>` wrappers |
| Images with `alt` | **43 / 43.** No missing alt anywhere |
| `<th scope>` | N/A — there are **no `<table>` elements**. Spec data is a `<dl>` (`ShowcaseCarousel.tsx:172-181`), which is semantically appropriate. The brief's "spec tables use `<th scope>`" item does not apply. |
| JSON-LD | Present on every route, 694 B, valid `@graph` with `Organization` + `WebSite` |
| JSON-LD asserts a shipping product | **No.** No `Product`, no `Offer`, no `AggregateRating`, no `review`. `StructuredData.tsx:4-9` documents this as deliberate. **This is correct and must stay correct.** |
| `robots.txt` | Present, correct, disallows `/dashboard`, declares sitemap + host |
| `sitemap.xml` | Present — **but see below** |
| `llms.txt` | **Absent** (404) |
| OG image | **Absent** (`/opengraph-image` → 404). `twitter:card` is `summary`, not `summary_large_image` |
| Canonical on `/` | **Absent.** Declared only on `/simulator` and `/pro-simulator` |

**Two real defects here:**

1. **`/simulator` and `/pro-simulator` are missing from the sitemap.** `app/sitemap.ts`
   lists `/` plus five **fragment URLs** (`/#features`, `/#roi`, …). Fragments are not
   distinct URLs; search engines normalise them away, so the sitemap effectively declares
   one page. The interactive 3D simulator — the site's most distinctive asset and its
   best answer to "why should I care about a pre-launch robotics company" — is not
   listed. (`/pro-simulator` sets `robots: {index: false}` deliberately and should stay
   out; `/simulator` should be in.)

2. **No OG image.** For a company whose acquisition channel is one link pasted into a
   contractor's inbox or a trade Slack, a preview card with no image and a `summary`
   twitter card is a measurable conversion loss. This is Phase 8/10 work.

**Alt-text pattern (Part III.4 / Phase 7.5).** All 43 rendered images use
`` `${cat.platform} — ${cat.label} (concept render ${id})` `` — e.g. *"ForgeSand D1 —
Field Sanding (concept render s04-06)"*. My assessment: **keep "concept render", drop
the ID.** The phrase carries the honesty labelling into the accessibility layer, which is
genuinely good. The ID (`s04-06`) is an internal filename with no meaning to a listener,
and a screen-reader user tabbing the 33-item grid hears it 33 times. Recommend
surfacing the ID visually in the lightbox (where it already appears,
`ShowcaseCarousel.tsx:125-127`) and removing it from `alt`.

---

## 8. What I could not verify

Stated plainly, per Part VII.7.

| Not verified | Why |
|---|---|
| **Lighthouse scores** (all four categories, `/` and `/simulator`) | Not run. No Lighthouse/CI runner in this environment. Every performance number above is a raw byte count from Playwright, not a Lighthouse metric, and is labelled as such. |
| **CLS / LCP / INP under throttled 4G + 4× CPU** | Not measured. Reviewed for *sources* of CLS and INP and found none, which is a weaker claim than a measurement and is worded that way. |
| **Compressed (Brotli) transfer sizes** | Local `next start` served uncompressed. The KB figures are an upper bound. |
| **Real iOS Safari and a low-end Android GPU** | Not available. All mobile results are Chromium device emulation with touch and DPR set. Per Part VII.5 that is not a substitute for the WebGL canvas or the range sliders, and the P0-4 slider finding should be re-confirmed on hardware. |
| **VoiceOver (iOS/macOS) and NVDA** | Not run. All accessibility findings are from axe-core plus code review. Manual AT testing is required before Phase 7 can be signed off. |
| **Clerk-gated auth states** | **Only one of three states was testable.** With no Clerk keys, `lib/auth.ts` disables auth and `proxy.ts` becomes a pass-through, so `/dashboard` and `/operator/*` render for everyone. Every result for those routes is the **signed-out, auth-disabled** state. "Signed in without entitlement" and "signed in with access" require Clerk credentials and were not tested. Note that production appears to run in this same keyless mode — the live footer links `/dashboard` publicly — which is itself worth confirming with the owner. |
| **Google Rich Results Test / Schema.org validator** | Not run — both require an external submission. The JSON-LD was validated structurally (parses, valid `@graph`, `@id` cross-references resolve, no prohibited types). |
| **Whether a dark mode exists** | **Determined: it does not.** `app/globals.css` has a single `:root` block, no `.dark` class, no `@media (prefers-color-scheme: dark)`, and `app/layout.tsx:46` hardcodes `bg-white text-slate-900`. There is no toggle. Theme parity is therefore N/A, and the brief's characterisation of the identity as "amber against dark surfaces" does not match the built site, which is amber on white. Recorded in `audit/DESIGN_SYSTEM.md` §2. |

---

## 9. Findings index

| ID | Sev | Route(s) | File:line |
|---|---|---|---|
| P0-1 | P0 | `/` + production | `components/WaitlistCTA.tsx:8-9, 75-89` |
| P0-2 | P0 | `/` | `components/Reveal.tsx:21-37` |
| P0-3 | P0 | `/dashboard` | `app/dashboard/page.tsx:57-70` |
| P0-4 | P0 | `/` | `components/ROICalculator.tsx:68-112` |
| P0-5 | P0 | `/operator/*` | `app/operator/layout.tsx:20-65` |
| P0-6 | P0 | build | `app/operator/{applications,jobs}/page.tsx:51` |
| P1-1 | P1 | `/operator/*` | 163 instances, `token-drift.mjs` |
| P1-2 | P1 | docs | `DESIGN_SYSTEM.md` §"Contrast & Accessibility" |
| P1-3 | P1 | all | `app/globals.css:27-41` |
| P1-4 | P1 | all | 17 unique combos, `contrast.mjs` |
| P1-5 | P1 | all | 118 unique, `tap-targets.mjs`; `globals.css:295-304` |
| P1-6 | P1 | all | `Header.tsx:85`; `Footer.tsx:72, 84`; `StructuredData.tsx:25` |
| P1-7 | P1 | `/dashboard` | `app/dashboard/page.tsx` |
| P1-8 | P1 | `/simulator`, `/pro-simulator` | `Simulator.tsx:49`; `ProTeardown.tsx:154` |
| P1-9 | P1 | all | `Header.tsx:62`; `operator/layout.tsx:34` |
| P2-1 … P2-13 | P2 | see §4 | see §4 |
| P3-1 … P3-6 | P3 | see §5 | see §5 |
