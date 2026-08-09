# FloorForge — Design System, reconciled

**Base commit:** `43bf65dfac6f870d65059c309e73aa8da7f5b4e9`
**Reconciles against:** `/DESIGN_SYSTEM.md` v1.0 (2026-08-03), `/PAGE_UX_CONTRACTS.md`,
`/AUDIT_2026-07-31.md`

This document does not replace the root `DESIGN_SYSTEM.md`. It records **where the built
site diverges from it**, **where I disagree with it and why**, and **what the token system
needs before Phase 3 can write a line of CSS**.

Rule of engagement 8 applies: someone made those decisions deliberately. Every
disagreement below is stated in writing with a reproducible number attached.

---

## 1. What the existing system gets right — keep all of it

These are deliberate, correct decisions. No patch in this series may undo them.

1. **The Tailwind v4 `@theme inline` aliasing pattern** (`app/globals.css:3-20` over
   `:root` at `:22-41`) is correct v4 idiom, not duplication. Do not collapse it.
   Per Part II.3 the only legitimate work here is checking that the alias set and the
   `:root` set are complete and matched — see §3.
2. **Honesty labelling.** Eight distinct disclaimers across `/`, `/simulator`,
   `/pro-simulator` and the footer. Verified present on production 2026-08-08. Part II.1
   is absolute: they may be typographically *promoted*, never removed, shrunk, softened
   or moved below the fold.
3. **JSON-LD restraint.** `components/StructuredData.tsx:4-9` documents *why* there is no
   `Product`, `Offer` or `AggregateRating`. That reasoning is right and the comment
   should survive any edit to the file.
4. **The mailto fallback.** `WaitlistCTA.tsx:75-89` guarantees the CTA is never dead.
   Keep it even after Formspree is configured.
5. **Zero-env-var deploy.** `proxy.ts:5-8` and `lib/auth.ts` degrade Clerk to a
   pass-through when keys are absent; `layout.tsx:61-63` only mounts `ClerkProvider`
   when configured. This is why the site deploys at all. Do not "simplify" it.
6. **Empty social links render nothing.** `Footer.tsx:11-27` — an icon appears only once
   its URL is filled in, because linking to a profile that does not exist reads as a
   broken site. Exactly the right instinct for a pre-launch product.
7. **Fixed-aspect image boxes.** `ShowcaseCarousel.tsx:21-23` reserves layout before load.
   No CLS source was found on `/`.
8. **`next/dynamic` containment of the WebGL stack.** Proven: zero `three` bytes on `/`.

---

## 2. Divergence #1 — there is no dark mode, and the identity is light

**Determined, not assumed.** `app/globals.css` contains one `:root` block. There is no
`.dark` selector, no `@media (prefers-color-scheme: dark)`, and no toggle anywhere in the
component tree. `app/layout.tsx:46` hardcodes `bg-white text-slate-900`.

Consequences:

- **Theme parity is N/A.** There is no second theme in which a token could fail to
  resolve. The Phase 3 requirement "verify every token resolves in both themes" has no
  work attached to it, and saying otherwise would be inventing a finding.
- The mission brief characterises the identity as *"amber/burnt-orange industrial
  against dark surfaces"*. **The built site is amber on white.** Dark surfaces appear
  only in three places: the footer and final CTA (`--primary` `#0f172a`), the ROI results
  panel (`bg-slate-950`, hardcoded), and the showcase image wells. If the intended
  identity really is dark-surface-dominant, that is a **brand decision for the owner**,
  not something a remediation patch should decide. Per Part VII.6 I am stopping and
  asking rather than shifting the palette. Logged in `audit/DEFERRED.md` §D-4.

---

## 3. Divergence #2 — the token set is incomplete, and 555 values bypass it

### 3.1 Colour tokens: complete and matched

All 14 colour tokens in `:root` (`globals.css:27-41`) have a `@theme inline` alias
(`:3-19`), and every alias resolves to a defined `:root` variable. **No orphans in either
direction.** This part of the system is sound.

### 3.2 Everything else is untokenised

There are **no** tokens for radius, shadow, duration, easing, spacing or type scale.
Consequently these values are hardcoded across the codebase:

| Category | Distinct values found | Where |
|---|---|---|
| Radius | `4px, 8px, 12px, 16px, 999px` | `globals.css:59, 79, 158, 178, 187, 233, 258, 265, 271` |
| Duration | `0.1s, 0.15s, 0.18s, 0.2s, 0.24s, 0.3s, 0.4s, 0.5s, 0.6s, 2.4s` | `globals.css` + framer-motion call sites |
| Easing | `cubic-bezier(0.23,1,0.32,1)` ×6, `cubic-bezier(0.66,0,0,1)`, `ease`, `ease-out` | `globals.css:62, 84, 167, 198, 278, 313` |
| Shadow | 4 one-off `box-shadow` declarations | `globals.css:69, 172, 242, 308-310` |

### 3.3 The drift census

`node audit/scripts/token-drift.mjs` — **555 instances across 25 files**:

| Kind | Count |
|---|---|
| Raw Tailwind palette classes (`bg-gray-100`, `text-blue-800`, `border-slate-200`, …) | **183** |
| Bare `white` / `black` colour utilities | **137** |
| Hardcoded hex literals | **116** |
| Arbitrary Tailwind values (`text-[15px]`, `basis-[82%]`, `hover:bg-[#92400e]`, …) | **110** |
| `rgb()` / `rgba()` / `hsl()` literals | **9** |

Two clusters deserve naming:

- **`app/operator/*` — 163 instances, zero tokens.** The console does not participate in
  the design system at all. It uses `bg-blue-600` as its primary action colour
  (`jobs/page.tsx:166, 179`) against a site accent of `#b45309`. See FINDINGS P1-1.
- **`components/ui/button.tsx:11-12`** hardcodes `hover:bg-[#1e293b]` and
  `hover:bg-[#92400e]` — and `#92400e` **is** `--accent-hover`. The token exists and the
  component ignores it. Same value is re-hardcoded at `globals.css:97-98`.

`components/simulator/RobotMesh.tsx` (27 hex), `lib/robots.ts` (25 hex),
`Room.tsx` (15), `FloorScene.tsx` (8) are **3D material colours**, not UI chrome. They
are legitimately outside the CSS token layer — see `audit/DEFERRED.md` §D-3 for the
proposed treatment.

### 3.4 Proposed additions for `FLOORFORGE_03_tokens.patch`

Add to `:root` and alias in `@theme inline` (names follow the existing convention):

```
--radius-sm | --radius-md | --radius-lg | --radius-full        4 / 8 / 12 / 999px
--duration-fast | --duration-base | --duration-slow            120ms / 180ms / 320ms
--ease-out-quint | --ease-standard                             existing cubic-beziers, named once
--shadow-card | --shadow-card-hover | --shadow-overlay         the three real elevations
--color-on-dark-muted                                          replaces text-white/50-on-dark
--color-success-on-dark                                        replaces the 6 `text-emerald-400`
```

The last two matter because `--success` `#15803d` is illegible on `bg-slate-950`, which
is *why* `ROICalculator.tsx:126, 134, 142, 150` reached for `text-emerald-400`. The
hardcode is a symptom of a missing token, not carelessness. Fix the cause.

---

## 4. Divergence #3 — I disagree with the published contrast table

`/DESIGN_SYSTEM.md` § "Contrast & Accessibility" asserts *"All combinations meet WCAG AA
(4.5:1 min for text)"* and publishes four ratios. Recomputed with
`audit/scripts/token-contrast.mjs` (WCAG 2.1 relative-luminance formula, pure
arithmetic, no browser, reproducible byte-for-byte):

| Pair | Doc claims | Measured | Verdict |
|---|---|---|---|
| `#0f172a` on `#ffffff` | 16.3:1 | **17.85:1** | doc understates |
| `#64748b` on `#ffffff` | 7.1:1 | **4.76:1** | **doc overstates by 49 %** |
| `#b45309` on `#ffffff` | 7.8:1 | **5.02:1** | **doc overstates by 55 %** |
| `#b45309` on `#fef3c7` | 6.2:1 | **4.51:1** | **doc overstates by 37 %** |

All four still pass, so nothing is broken *because* of the table. The damage is
downstream: a team that believes `--muted-foreground` has 2.6 of headroom on white will
happily put it on a tinted background. It has 0.26. And on `--accent-light` — the pair the
document does not list — it fails at **4.27:1**.

**Recommendation:** delete the hand-written table from `/DESIGN_SYSTEM.md` and replace it
with generated output from `audit/scripts/token-contrast.mjs`, run in CI. A contrast
table maintained by hand will drift from its tokens again.

**Full measured table — 31 pairs, 5 failing:**

| Foreground | Background | Req | Ratio | |
|---|---|---|---|---|
| `--fg` `#0f172a` | `--bg` `#ffffff` | 4.5 | 17.85 | PASS |
| `--fg` | `--muted` `#f8fafc` | 4.5 | 17.06 | PASS |
| `--muted-foreground` `#64748b` | `--bg` | 4.5 | 4.76 | PASS |
| `--muted-foreground` | `--muted` | 4.5 | 4.55 | PASS |
| `--muted-foreground` | `--accent-light` `#fef3c7` | 4.5 | **4.27** | **FAIL** |
| `--accent` `#b45309` | `--bg` | 4.5 | 5.02 | PASS |
| `--accent` | `--muted` | 4.5 | 4.80 | PASS |
| `--accent` | `--accent-light` | 4.5 | 4.51 | PASS |
| `--accent-hover` `#92400e` | `--bg` | 4.5 | 7.09 | PASS |
| `--primary-foreground` | `--accent` | 4.5 | 5.02 | PASS |
| `--primary-foreground` | `--accent-hover` | 4.5 | 7.09 | PASS |
| `--primary-foreground` | `--primary` `#0f172a` | 4.5 | 17.85 | PASS |
| `--success` `#15803d` | `--bg` | 4.5 | 5.02 | PASS |
| `emerald-400` `#34d399` | `slate-950` `#020617` | 4.5 | 10.49 | PASS |
| `--border` `#e2e8f0` | `--bg` | **3.0** | **1.23** | **FAIL** |
| `--border` | `--muted` | **3.0** | **1.18** | **FAIL** |
| `--accent` (focus ring) | `--bg` | 3.0 | 5.02 | PASS |
| `--accent` (focus ring) | `--primary` | 3.0 | 3.56 | PASS |
| `--accent` (focus ring) | `slate-950` | 3.0 | 4.02 | PASS |
| `#fff @ 0.40` | `--primary` | 4.5 | **3.80** | **FAIL** |
| `#fff @ 0.50` | `--primary` | 4.5 | 5.23 | PASS |
| `#fff @ 0.60` | `--primary` | 4.5 | 7.00 | PASS |
| `#fff @ 0.60` | `slate-950` | 4.5 | 7.31 | PASS |
| `#fff @ 0.80` | `--primary` | 4.5 | 11.64 | PASS |
| `#b45309 @ 0.70` | `--muted` | **3.0** | **2.89** | **FAIL** |

The `--border` result is the one to act on first. At 1.23:1 every card edge, input
boundary and chip outline on the site is below the WCAG 1.4.11 floor for UI components.
One token change fixes all of them; `#cbd5e1` (already used ad-hoc as the hover border at
`globals.css:70, 122`) reaches 1.47:1 and is still not enough — a border around
`#94a3b8` is needed for 3:1 on white. That is a visible design change and should be
proposed to the owner rather than applied silently.

---

## 5. Element × state matrix — the empty cells are the Phase 5 deliverable

Legend: **Y** designed · **g** inherited from the global `button/a:focus-visible` rule
(`globals.css:288-292`) · **—** absent.

| Element | Rest | Hover | Active | Focus-vis | Disabled | Loading | Error/Success |
|---|---|---|---|---|---|---|---|
| `Button` default/accent/secondary/ghost/outline | Y | Y | Y `active:scale-[0.985]` | Y `ring-2 ring-accent` | opacity-50 only | — | — |
| `.btn` family (CSS) | Y | Y | — | g | — | — | — |
| Header nav (desktop) | Y | Y underline | — | g | — | — | n/a |
| Header nav (mobile) | Y | Y | — | g | — | — | n/a |
| Header active-section indicator | **—** | — | — | — | — | — | — |
| Footer links | Y | Y | — | g | — | — | n/a |
| Pricing tier cards | Y | Y `.card:hover` | — | n/a | n/a | n/a | n/a |
| ROI range inputs | Y | — | — | **—** | — | n/a | n/a |
| ROI job-type toggle | Y | Y | — | g | — | n/a | **—** |
| Showcase category chips | Y | Y | — | g | — | n/a | n/a |
| Showcase rail arrows | Y | Y | — | g | **opacity-0** | n/a | n/a |
| Showcase gallery tiles | Y | Y scale | — | g | — | — | n/a |
| Lightbox close / prev / next | Y | Y | — | g | — | n/a | n/a |
| Waitlist text inputs | Y | — | — | Y `.input:focus` | — | n/a | **—** |
| Waitlist submit | Y | Y | Y | Y | opacity-50 | **Y** | toast only |
| Chatbot launcher | Y | Y | — | g | — | — | n/a |
| Chatbot input | Y | — | — | Y `.input:focus` | — | — | — |
| Simulator controls | Y | Y | — | g | — | **—** | — |
| Operator status filter pills | Y | Y | — | g | — | — | — |
| Operator `<select>` | Y | — | — | **—** | — | — | — |
| Radix Dialog / Tabs / Select / Progress / Dropdown | Y | partial | — | g | — | n/a | n/a |

**Systemic gaps, in priority order:**

1. **No `:focus-visible` for `input`, `select`, `textarea`, `[role]`, `[tabindex]`.**
   The global rule at `globals.css:288-292` covers only `button` and `a`. `.input:focus`
   (`:146-150`) is `:focus`, not `:focus-visible`, and uses a 3 px `rgba(180,83,9,0.08)`
   ring — 8 % opacity, effectively invisible.
2. **No disabled treatment at all** beyond `disabled:opacity-50` on `Button`. Nothing sets
   `cursor: not-allowed`, and opacity-50 on `--muted-foreground` lands at 2.4:1 — below
   the 3:1 floor the mission requires for disabled text.
3. **Loading exists in exactly one place** (the waitlist submit label). The simulator's
   dynamic-import skeleton is a `loading:` prop, not an interaction state. No control
   anywhere acknowledges an in-flight action.
4. **Error and success are toast-only.** No form field on the site can show an inline
   error. The waitlist validates email with `toast.error` (`WaitlistCTA.tsx:36`), which
   disappears and is never associated with the field via `aria-describedby`.
5. **No active-nav treatment on any route.** `aria-current` appears nowhere.

**Motion discipline gaps:** `transition: all` at `globals.css:84` (`.btn`) and `:212`
(`.quick-reply`); ten distinct durations with no tokens; `Header.tsx:141-146` animates
`height` (a layout property) and does not consult `useReducedMotion()`; the only
`prefers-reduced-motion` rule in the entire stylesheet is `globals.css:319-321`, which
covers the chat launcher and nothing else.

---

## 6. Chrome parity — measured

`structure.mjs`, 1440 × 900:

| Route | header count | header height | footer count | footer height |
|---|---|---|---|---|
| `/` | 1 | 81 px | 1 | 432 px |
| `/simulator` | 1 | 81 px | 1 | 432 px |
| `/pro-simulator` | 1 | 81 px | 1 | 432 px |
| `/dashboard` | 1 | 81 px | 1 | 432 px |
| `/operator/applications` | **2** | 81, **89** | **2** | **53**, 432 |
| `/operator/jobs` | **2** | 81, **89** | **2** | **53**, 432 |

Four of six routes are pixel-identical. The two console routes are not, and the failure
is structural (a nested second chrome), not cosmetic. Fixing `app/operator/layout.tsx` to
render a section header instead of a full page chrome resolves the parity table, the
duplicate-`<main>` axe violation and the visual drift in one change.

Secondary: `/dashboard` adds its own sticky bar at `top-0 z-40`
(`app/dashboard/page.tsx:56`) directly beneath the global header at `top-0 z-50`
(`Header.tsx:47`). Two stacked stickies, only one of which reflects the header's
`h-16 md:h-20` responsive height. Note also that `Header.tsx:31` hardcodes
`const offset = 80` for section scrolling, which matches the desktop header (80 px) but
overshoots the mobile header (64 px) by 16 px.

---

## 7. Root documentation — proposed consolidation

22 markdown files, ~380 KB, at repo root. Read before proposing any move.

**Keep at root (living):** `README.md`, `AGENTS.md`, `TOOLS.md`, `IDENTITY.md`,
`DESIGN_SYSTEM.md` (with its contrast table replaced per §4),
`PAGE_UX_CONTRACTS.md`, `API_REFERENCE.md`, `BACKEND_SETUP.md`,
`PRODUCT_SERVICE_DEFINITION.md`, `SOFTWARE_HARDWARE_CONTRACT.md`,
`PRODUCT_SERVICE_ROADMAP.md`, `SHARED_INTERFACE_NOTES.md`.

**Move to `docs/archive/` (point-in-time reports, superseded but not worthless):**
`ALIGNMENT_SUMMARY.md`, `AUDIT_2026-07-31.md`, `BACKEND_INDEX.md`,
`BACKEND_SKELETON_REPORT.md`, `IMPLEMENTATION_SUMMARY.md`,
`INTEGRATION_READINESS_REPORT.md`, `MISSION_COMPLETE.md`, `OPERATOR_SURFACE_REPORT.md`,
`PRODUCT_ALIGNMENT.md`, `SITE_ARCHITECTURE_SUMMARY.md`.

**Delete nothing.** These are someone else's work product and several record decisions
that are still load-bearing. `AUDIT_2026-07-31.md` in particular already names most of
the backend gaps found here and reached compatible conclusions; where this audit and that
one disagree, this document says so explicitly (§4 is the only substantive disagreement).

---

## 8. Ordering constraint for the remaining patches

Phase 3 must land before Phases 4–7, because:

- The `--border` fix (§4) changes every card, input and chip — doing it after Phase 5
  would re-touch every file Phase 5 touched.
- `--color-success-on-dark` and `--color-on-dark-muted` (§3.4) must exist before the
  `text-emerald-400` and `text-white/40` call sites can be migrated.
- The radius/duration/easing tokens must exist before the state matrix in §5 can be
  filled without inventing new magic numbers.

Phase 4 (components) must land before Phase 5 (states), because filling the state matrix
against duplicated primitives means filling it twice.
