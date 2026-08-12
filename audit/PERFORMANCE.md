# FloorForge — Lighthouse & Field Metrics

**Measured:** 2026-08-12, at `a43881c` + patches 13–14
**Method:** Lighthouse 13.4.1, simulated throttling, Chromium headless, against
`npm run build && npx next start` — the production bundle, not a dev server.
Four routes, both form factors. Raw `.lhr` JSON for every run is reproducible with
`audit/scripts/`-style invocation; the summary below is unedited.

This closes the single largest gap in the original audit. `audit/FINDINGS.md` said
plainly that Lighthouse scores and throttled CLS/LCP/INP had never been measured. They
have now.

---

## 1. Results

### Desktop

| Route | Perf | A11y | Best practices | SEO | LCP | FCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|---|
| `/` | **100** | **100** | **100** | **100** | 795 ms | 299 ms | 0 ms | **0** | 425 ms |
| `/systems` | **100** | **100** | **100** | **100** | 609 ms | 213 ms | 21 ms | **0** | 349 ms |
| `/simulator` | **100** | **100** | **100** | **100** | 593 ms | 227 ms | 44 ms | 0.004 | 606 ms |
| `/dashboard` | **100** | **100** | **100** | 66 ✱ | 727 ms | 235 ms | 0 ms | **0** | 330 ms |

### Mobile

| Route | Perf | A11y | Best practices | SEO | LCP | FCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 69 | **100** | **100** | **100** | 3,433 ms | 961 ms | 1,093 ms | **0** | 961 ms |
| `/systems` | 80 | **100** | **100** | **100** | 4,469 ms | 801 ms | 239 ms | **0** | 2,152 ms |
| `/simulator` | 76 | **100** | **100** | **100** | 2,713 ms | 763 ms | 850 ms | **0** | 1,210 ms |
| `/dashboard` | 83 | **100** | **100** | 66 ✱ | 3,306 ms | 789 ms | 380 ms | **0** | 789 ms |

✱ `/dashboard` fails one SEO audit — `is-crawlable` — because `app/robots.ts:12`
deliberately disallows it. That is the intended behaviour for a product-preview page
behind a sample-data banner, not a defect. The other 66-point deduction is the absent
`metadata` export; `/dashboard` is the one route without one.

---

## 2. What passes, and what it took

**Accessibility is 100 on every route, on both form factors.** That is a second,
independent instrument agreeing with the axe-core result. axe is a rule engine over the
DOM; Lighthouse's accessibility category overlaps but is not identical, and it also
scores contrast against rendered pixels. Both at maximum is about as much automated
assurance as exists. It is still not a screen-reader pass — see §4.

**Cumulative Layout Shift is 0.** Not "good", not "under 0.1" — zero, on seven of eight
runs, with one run at 0.004. Nothing on this site moves after it paints. That is the
direct dividend of patch 05 (`Reveal` no longer serialising `opacity:0` into prerendered
HTML), patch 06 (explicit geometry on every target), and patch 09 (moving 33 images off
the homepage). It was not measured when those patches landed; it is measured now.

**Best practices is 100 everywhere**, which includes no console errors, correct image
aspect ratios, and no deprecated APIs.

---

## 3. What fails — mobile performance, against the site's own target

`PAGE_UX_CONTRACTS.md:631` sets the bar: **"Lighthouse > 90 (performance +
accessibility)"**.

- Accessibility: **100 on 8 of 8 runs — passes.**
- Performance: **100 on 4 of 4 desktop runs — passes. 69–83 on 4 of 4 mobile runs — fails.**

The site fails its own documented performance target on mobile, on every route.

**The cause is JavaScript execution, not payload.** Transfer weight is unremarkable
(507–766 KB mobile, 27 requests on the homepage, largest single chunk 69 KB). What costs
the score is main-thread time:

| Route | Main-thread work | JS bootup | TBT | Unused JS |
|---|---|---|---|---|
| `/` | 4,059 ms | 1,909 ms | 1,093 ms | 530 ms |
| `/systems` | 6,369 ms | 4,710 ms | 239 ms | 650 ms |
| `/simulator` | 2,858 ms | 1,809 ms | 850 ms | 150 ms |
| `/dashboard` | 1,903 ms | 896 ms | 380 ms | 420 ms |

Lighthouse's only opportunity of consequence on all four routes is **"Reduce unused
JavaScript"**. Server response time is flagged as *short* everywhere (7–18 ms), so
nothing here is a backend problem.

`/systems` is the interesting one: it has the **lowest** TBT of the three content routes
(239 ms) and the **highest** bootup time (4,710 ms) and worst LCP (4,469 ms). Work is
spread thin rather than blocking — consistent with 78 images decoding — so it scores 80
despite doing the most total work.

### Why this is not fixed in this delivery

The three obvious levers each risk a constraint the owner has already set:

| Lever | Saving | Risk |
|---|---|---|
| `next/dynamic` the `Chatbot` | ~framer-motion off first load | The "Ask the demo assistant" CTA (`app/page.tsx:474`) fires `openChatbot()`. If the component is not mounted, that is a **dead CTA** — forbidden by mission Part II.2. Needs a mounted trigger stub. |
| `next/dynamic` the `ShowcaseCarousel` with `ssr: false` | ~Radix Dialog + framer-motion | Removes it from the prerendered HTML. That is the exact failure mode patch 05 fixed as **P0-2** — content that exists only if JavaScript runs. |
| Split `framer-motion` out of the shared chunk | largest single win | Touches every animated component at once; the opposite of one concern per patch. |

Each is worth doing. None should be done blind at the end of a session, and each needs
its own before/after measurement against the numbers above — which now exist, which is
the point of this document.

---

## 4. Still not measured

Shorter than it was, and stated exactly.

- **INP (Interaction to Next Paint).** Lighthouse's lab run does not produce it; INP
  needs real interaction traces or field data (CrUX). Neither exists for a site with no
  traffic. TBT above is the lab proxy.
- **Real devices.** Simulated throttling models a mid-tier phone on a slow 4G link. It is
  a standard, not a Pixel.
- **Screen readers.** 100 on the accessibility category is a floor. VoiceOver and NVDA
  remain unrun.
- **Field CrUX data.** Requires production traffic that does not yet exist.
- **Two of three Clerk auth states**, unchanged from `audit/FINDINGS.md` — with no Clerk
  keys, every gated-route measurement here is effectively signed-out.

---

*Every figure above is a lab measurement of the production bundle, reproducible from a
clean clone. Nothing in this document is an estimate.*
