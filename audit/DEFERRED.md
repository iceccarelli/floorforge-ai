# FloorForge — Deferred

**Base commit:** `43bf65dfac6f870d65059c309e73aa8da7f5b4e9`

Things I found, could fix, and chose not to — with the reason. Also things that are not
mine to decide. Part VII.6: on any judgement call about brand, product claims or pricing
presentation, stop and ask.

---

## D-1 · Audit dependencies are not added to `package.json`

The scripts in `audit/scripts/` require `playwright`, `sharp` and `axe-core`. I did not
add them as devDependencies.

**Why.** `next build` on Vercel runs `npm ci` against the full dependency tree.
Playwright's install step downloads browser binaries; adding it here would slow every
production build and could break it in a network-restricted builder. The scripts are
diagnostic tooling, not part of the app.

**Recommendation for `FLOORFORGE_02_ci_verification.patch`:** install them in the CI job
only (`npm i --no-save playwright sharp axe-core && npx playwright install --with-deps
chromium`), gated to a separate workflow from the `tsc/lint/build` gate so a Playwright
outage cannot block a deploy. `audit/scripts/parse-check.mjs` and
`audit/scripts/token-contrast.mjs` are the exception — both are dependency-free apart
from the repo's own `typescript`, and both belong in the fast gate.

---

## D-2 · The two lint errors are a logic change — flagging, not fixing

`app/operator/applications/page.tsx:51` and `app/operator/jobs/page.tsx:51` fail
`react-hooks/immutability`: a `useEffect` calls a function declared below it, so the
effect captures a stale binding.

The fix is to convert `async function fetchJobs()` to a `useCallback` and add it to the
dependency array — mechanically small, but it changes when data refetches, which is
runtime behaviour in `app/operator/**`. Part II.4 puts `app/api/**` route *behaviour* out
of scope; these are pages rather than routes, but the spirit is the same, and a
remediation series whose stated purpose is visual and structural should not quietly
change data-fetching semantics.

**Decision needed from the owner:** either (a) `FLOORFORGE_02` fixes both hooks so CI can
land green, or (b) `FLOORFORGE_02` lands the workflow with `continue-on-error: true` on
the lint step plus a tracked issue. **(a) is strongly preferred** — a gate that is allowed
to fail teaches the team to ignore it.

---

## D-3 · 3D material hex values stay hardcoded

`components/simulator/RobotMesh.tsx` (27), `lib/robots.ts` (25), `Room.tsx` (15),
`FloorScene.tsx` (8) hold 75 of the repo's 116 hex literals. These are three.js material
colours consumed by WebGL, not CSS.

**Why deferred.** Routing them through CSS custom properties would require reading
computed styles into the render loop — real complexity for no user-visible benefit, and
`three` cannot consume `var()`. They are already centralised in `lib/robots.ts` for the
platform colours, which is the right pattern.

**Recommendation:** leave them, but exclude these four files from the token-drift budget
in CI so the number CI enforces means something. `MetricsHUD.tsx:65`'s
`"#94a3b8"` fallback is a genuine exception — it is *UI chrome*, not material, and should
move to a token in Phase 3.

---

## D-4 · Whether the identity should be dark-surface is a brand decision

The brief describes FloorForge as *"amber/burnt-orange industrial against dark
surfaces"*. The built site is amber on white (`--bg: #ffffff`; `app/layout.tsx:46`
hardcodes `bg-white text-slate-900`); there is no dark mode and no toggle.

I am not changing the palette direction. Inverting a site's surface register is a brand
decision with real consequences for the concept renders (which are lit for a light page)
and for every contrast pair in the system. **Ask the owner:** is amber-on-white the
intended identity, or is the current light palette a placeholder?

If dark is wanted, it is its own project, not a line in a remediation patch.

---

## D-5 · The `--border` fix is a visible design change

`--border` `#e2e8f0` scores **1.23:1** on white against a WCAG 1.4.11 floor of 3:1 for
UI component boundaries. Reaching 3:1 needs roughly `#949fac`. That is a much darker,
much more present card edge across the entire site — a real change to how the design
looks, not a bug fix.

**Options for the owner:**

1. Darken `--border` to meet 3:1 everywhere. Most correct, most visible.
2. Keep `--border` decorative and add a separate `--border-strong` that meets 3:1, used
   on interactive boundaries only (inputs, chips, buttons) where WCAG actually requires
   it. Card edges are arguably decorative and exempt. **This is my recommendation.**
3. Do nothing and record the exception.

I have not chosen. `FLOORFORGE_03_tokens.patch` should not ship until this is answered.

---

## D-6 · The personal Gmail address — recommended, not changed

`vince.ceccarelli@gmail.com` appears in `WaitlistCTA.tsx:9`, `Header.tsx:86`,
`Footer.tsx:9` and `StructuredData.tsx:25`. On a B2B robotics site quoting $299–$799/mo,
a personal Gmail is a credibility signal in the wrong direction.

**Recommendation:** a domain address (`pilot@floorforge.ai`) forwarding to the same
inbox. One constant, four call sites, zero risk.

**Not changed** — Part II.2.4 is explicit that this is the owner's call.

---

## D-7 · Repo history still carries 19.7 MB after `git rm --cached`

`FLOORFORGE_01_repo_hygiene.patch` will untrack 11 archives and one 4 MB PNG. That
shrinks the working tree and stops the bleeding, but **`.git` stays at 67 MB** — the blobs
remain in history and every future clone still pays for them.

Shrinking the clone requires `git filter-repo` or BFG plus a force-push, which rewrites
every commit SHA. That invalidates open branches
(`feat/autonomous-refinishing-showcase`, `pro-simulator-integration`), any outstanding
PR, and every local clone.

**Recommended, not executed**, per Part III.2. It is a coordinated operation for a moment
when no work is in flight, not a step in a patch series.

Before untracking, confirm the archives exist elsewhere. `showcase-assets.zip` (4.4 MB)
and `floorforge-image-library-ALL-78.png` (4.0 MB) plausibly contain the *sources* for
`public/showcase/gallery/*.webp`. Untracking them without an off-repo backup would lose
the originals.

---

## D-8 · The 33-image default category is a layout decision, not a bug

`/` mounts 43 `<img>` elements on first paint and transfers 898.9 KB of images before any
scroll. The cause is `ShowcaseCarousel.tsx:504` defaulting `activeCat` to `"sand"`, which
has 33 frames.

Fixes range from "paginate to 12 with a Show all control" to "move the library to its own
route". All change what a prospect sees on the homepage. Part III.4 is explicit that the
renders are the product's primary evidence and must not be deleted — but *how many appear
before a click* is a merchandising decision.

**Recommendation for `FLOORFORGE_09`:** featured rail stays; the categorised library
paginates to a first tranche of 12 with an explicit "Show all 33" control. **Ask the owner
before implementing.**

---

## D-9 · Not verified — see FINDINGS §8

Repeated here so it is not lost: **no Lighthouse run, no throttled CLS/LCP/INP
measurement, no compressed-transfer figures, no real iOS Safari or low-end Android GPU,
no VoiceOver or NVDA pass, and only one of three auth states testable** (with no Clerk
keys, `proxy.ts` is a pass-through, so every gated-route result is the signed-out,
auth-disabled state).

Phases 7 and 9 cannot be signed off against their acceptance criteria until those run.
Any claim to the contrary in a later patch would be a verification I did not perform.

---

## D-10 · Not touched, by scope

Per Part II.4, untouched and unexamined beyond what was needed to understand the UI:
Clerk auth logic, Supabase schema, `app/api/**` route behaviour, simulator physics and
robot kinematics, dependency versions, `migrations/`.

One observation that is *adjacent* and worth the owner's attention rather than a patch:
`app/api/applications/route.ts` (101 lines) already exists and is Supabase-backed via
`lib/db/client.ts`. The waitlist could post there instead of to Formspree, which would
keep lead data first-party. **Reporting only, per Part II.2.2 — no backend rewrite.**
Note that `next build` logs *"Supabase credentials missing. Database operations will
fail"*, so that route is not currently functional in this environment; whether it is
configured in production was not verified.
