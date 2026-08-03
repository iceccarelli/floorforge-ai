# FloorForge Site Architecture Summary

**Date:** August 3, 2026  
**Edition:** 1.0  
**Status:** Ready for execution  
**Audience:** Executive stakeholder update

---

## Current State Audit

### Public Pages (Live)

| Route | Purpose | Quality | Status |
|-------|---------|---------|--------|
| `/` | Home / landing | ✅ Excellent | Live |
| `/simulator` | 3D interactive sander demo | ✅ Excellent | Live |
| `/pro-simulator` | Alt 5-robot simulator | ✅ Good | Live |
| `/dashboard` | Dashboard preview (read-only) | ✅ Good | Live |

**Total public pages:** 4  
**Total public routes that convert:** 1 (home, via waitlist form)

### Internal Pages (Live)

| Route | Purpose | Status |
|-------|---------|--------|
| `/operator/applications` | Pilot application management | ✅ New |
| `/operator/jobs` | Job management | ✅ New |

---

## What's Missing (Gaps)

| Gap | Impact | Why | Priority |
|-----|--------|-----|----------|
| **No dedicated "How it works" page** | Visitors asking "how does this actually work?" leave home | Depth lives on home (crowded) | 2nd |
| **No dedicated "Robots" page** | Contractors curious about individual platforms get lost | Overview lives on home (unclear) | 3rd |
| **No dedicated "Pilot application" page** | Interested contractors apply on home page instead of dedicated funnel | Sharing space with marketing; not serious | **1st** |
| **No clear "Come back later" pathway** | If pilot is full, what do casual visitors do? | No defer flow | Low |

---

## Recommended Information Architecture

### Tight, Focused Public Navigation (5-7 pages max)

```
HOME (/) 
  ├─ Product vision + credibility
  ├─ Feature overview (6 capabilities)
  ├─ ROI model (interactive calculator)
  ├─ Pricing tiers (indicative)
  ├─ Pilot overview (why join)
  └─ CTA: "Join waitlist" or "Apply for pilot"

HOW IT WORKS (/platform) [NEW - Priority 2]
  ├─ 4-step workflow (capture → sanding → edging → finishing)
  ├─ What contractor does (not replaced, managing remotely)
  ├─ Honest caveats (measurement plan, validation timeline)
  └─ CTA: "Apply for pilot"

ROBOTS (/platforms) [NEW - Priority 3]
  ├─ 5 robot cards (Sander D1, Edger E1, Finisher F1, Plank Layer, Inspector)
  ├─ Status labels (pilot-ready vs prototype vs concept)
  ├─ Design targets (not guarantees)
  ├─ Links to 3D simulator per robot
  └─ Roadmap (which robots in phase 1, 2, 3)

SIMULATOR (/simulator) [EXISTING]
  ├─ Interactive 3D (Sander D1 by default)
  ├─ Adjustable floor params (size, wood type, damage)
  ├─ Play button starts sanding simulation
  └─ CTA: "Ready to test on your floor? Apply for pilot"

EARLY ACCESS / PILOT (/early-access) [NEW - Priority 1]
  ├─ Pilot overview (3–5 contractors, 8–12 weeks, free hardware)
  ├─ Qualification checklist (are you a fit?)
  ├─ Timeline (weeks 1–12, what happens when)
  ├─ Commitment level (time, data, logistics)
  ├─ Application form (5–7 fields)
  └─ CTA: "Apply now"

DASHBOARD PREVIEW (/dashboard) [EXISTING]
  ├─ Sample job in-progress
  ├─ Read-only demo of what you'll use in pilot
  └─ CTA: "Access live dashboard in pilot"

FOOTER
  ├─ Quick links (contact, privacy, blog if exists)
  ├─ Social (LinkedIn, etc. if relevant)
  └─ Email signup fallback
```

### NOT recommended (scope creep):

- Blog (adds maintenance burden, low impact pre-launch)
- About/Company (unless team pages are authentic and updated)
- Case studies (impossible with no deployed customers yet)
- Job board (not part of product)
- Integrations marketplace (future only)

---

## Recommended Build Sequence

### Phase 0 (Now): Design System + UX Contracts (DONE)

**Deliverables:**
- ✅ DESIGN_SYSTEM.md (colors, typography, spacing, components, patterns)
- ✅ PAGE_UX_CONTRACTS.md (what each page must do)
- ✅ This summary (site map + priorities)

**Time:** ~2 weeks (research + documentation)

---

### Phase 1 (Weeks 1–2): Build /early-access [PRIORITY 1]

**Why first:**
- Highest conversion intent (people arriving here are already sold)
- Strongest signal (application data tells you what contractors want)
- Enables pilot recruitment immediately
- Cleanest feedback loop (1–2 week learning cycle)

**Scope:**
- Pilot overview section (benefits, timeline, commitment)
- Qualification checklist (visual, interactive?)
- Application form (5–7 fields, validation, error handling)
- FAQ accordion (common questions)
- Final CTA (submit application)

**Tech:** Reuse existing components (Button, Card, WaitlistCTA as template)

**Time:** 2–3 days frontend + 1 day copy + 1 day QA = 1 week

**Success metric:** 50 applications in first week with > 40% meeting qualification criteria

---

### Phase 2 (Weeks 3–4): Build /platform [PRIORITY 2]

**Why second:**
- Adds depth for cautious visitors ("show me the engineering")
- Differentiates vision (home) from execution (/platform)
- Gives substance to "pilot" promise

**Scope:**
- Hero: "This is how autonomous floor refinishing works"
- 4-step workflow (visual + description per step)
- Contractor role (manual for what, automatic for what?)
- Honest caveats (what we're measuring in pilot)
- Technology layer (software + hardware overview)
- FAQ (common technical questions)
- CTA: "Apply for pilot"

**Tech:** New sections, reuse design patterns

**Time:** 1–2 days frontend + 1 day copy + 0.5 day QA = 1 week

**Success metric:** 30% of home visitors click "How it works" link

---

### Phase 3 (Weeks 5–6): Build /platforms [PRIORITY 3]

**Why third:**
- Nice-to-have clarity (content exists on home)
- Good for discovery and comparison
- Supports deeper engagement

**Scope:**
- Hero: "The platforms we're building"
- 5 robot cards (grid, responsive)
- Each card: image, name, job, status, specs, "Explore in 3D" link
- Roadmap: timeline of when each enters pilot/production
- Tech shared layer (one OS for all robots)
- CTA: "Join pilot"

**Tech:** Card component (reusable), responsive grid

**Time:** 1 day frontend + 0.5 day copy + 0.5 day QA = 1 week

**Success metric:** 20% of robot-curious visitors navigate to /platforms

---

### After Pilot Starts (Months 2–3)

- Optimize conversion based on real data
- Add blog (pilot learnings, updates)
- Possibly add case studies (if pilot contractors consent)
- Iterate copy based on applicant feedback

---

## Design System Compliance

**All pages (existing + new) must follow:**

### Colors
- Primary: `#0f172a` (dark slate, text + primary buttons)
- Accent: `#b45309` (amber, highlights + secondary CTA)
- Muted: `#f8fafc` (pale slate, section backgrounds)
- Success: `#15803d` (green, status)

### Typography
- Headings: Geist Sans, 600 weight, -0.025em letter-spacing
- Body: Geist Sans, 400 weight, 1.6 line-height
- No custom fonts

### Spacing
- Sections: `py-20` (80px)
- Cards: `p-8` (32px), `gap-6` (24px between)
- Container: `max-w-7xl mx-auto px-6`

### Components
- Button hierarchy: Primary (dark), Secondary (outline), Accent (amber)
- Cards: Lift on hover, soft border, rounded corners
- Forms: Clear labels, validation, error messages

**See DESIGN_SYSTEM.md for complete details.**

---

## Site Map (Final)

```
floorforge.ai/
├─ / (home)
├─ /platform (how it works)
├─ /platforms (robot overview)
├─ /simulator (3D interactive)
├─ /early-access (pilot application) ← PRIMARY FUNNEL
├─ /dashboard (dashboard preview)
├─ /api/* (backend, not public)
└─ /operator/* (internal)
```

---

## Highest ROI: /early-access

### Why this page wins:

1. **Conversion clarity**
   - Removes "apply on home page" friction
   - Creates serious, dedicated funnel
   - Clear distinction: "I'm curious" (home) vs. "I want to pilot" (early-access)

2. **Data richness**
   - Application form reveals what contractors care about
   - Qualification checklist shows if we're targeting right segment
   - 1–2 week feedback loop (faster than polls)

3. **Operations enablement**
   - Pilot team has streamlined intake
   - Reduces email back-and-forth
   - Proves ability to manage contractors (good signal)

4. **Fast to ship**
   - No new components (reuse existing)
   - Straightforward content (qualification criteria + form)
   - Design system handles UI (no custom styling)
   - 1 week to ship, not 3

5. **Measurable impact**
   - Track applicant quality (% who qualify)
   - Track conversion rate (/home → /early-access → apply)
   - Immediate signal if targeting is right or wrong

### Expected outcomes (after launch):

- **Week 1:** 20–50 applications, 60% qualify
- **Week 2:** Word-of-mouth, 50–100 more applications
- **Week 3:** Pilot cohort selected (best 3–5), onboarding begins

---

## Secondary impacts (from design system + architecture)

- **Consistency:** All pages feel like one brand (not patchwork)
- **Speed:** New pages ship faster (patterns + components ready)
- **Maintenance:** Single source of truth (DESIGN_SYSTEM.md) reduces decisions
- **Scale:** If FloorForge grows, architecture scales to 20+ pages cleanly

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| /early-access form gets spam | Add verification email, honeypot field, rate limiting |
| Pilot cohort is unqualified | Tighter qualification checklist on form (pre-screen before interview) |
| Site is too honest (scares prospects) | Test it; honesty usually builds more trust than hype |
| Building all 5 pages at once delays pilot | Prioritize /early-access; launch others incrementally |
| Home page becomes outdated | Product updates twice/month, site updates after |

---

## Success Metrics (3-month horizon)

| Metric | Target | How to measure |
|--------|--------|----------------|
| **Home → /early-access click-through** | 20% | Google Analytics (custom link tracking) |
| **/early-access form conversion** | 50%+ (50% of visitors complete form) | Form analytics |
| **Application qualification rate** | > 40% (at least 4 in 10 applications qualify) | Manual review (ops team) |
| **Pilot cohort recruited** | 3–5 contractors signed | Signed onboarding agreements |
| **Pilot timeline met** | Phase 1 completes in 12 weeks | Project tracking |
| **Pilot NPS** | ≥ 5 (likely to recommend) | Post-first-job survey |

---

## Summary: What to Do Now

1. **Review & approve** DESIGN_SYSTEM.md and PAGE_UX_CONTRACTS.md
2. **Assign ownership:**
   - Design lead → UI specs + component review
   - Product lead → Copy + qualification criteria
   - Frontend lead → Build /early-access (weeks 1–2)
3. **Kick off design** (this week)
4. **Build /early-access** (weeks 1–2)
5. **Launch & measure** (week 3)
6. **Iterate & plan** /platform and /platforms based on early data

---

## Appendix: Current Home Page Strengths to Preserve

✅ **Hero is clear** ("Autonomous hardwood floor refinishing, early-access")  
✅ **Features are well-explained** (6 capabilities with descriptions)  
✅ **How it works section** (4-step flow, digestible)  
✅ **ROI calculator** (interactive, transparent)  
✅ **Pilot positioning** (clear it's a program, not a pre-order)  
✅ **Design consistency** (already follows system)  
✅ **Mobile responsive** (tested, works well)  

**Keep all of this.** The gaps aren't quality issues; they're structural (missing dedicated pages for depth).

---

**Prepared by:** Lead Design Systems + Frontend Engineering  
**Date:** August 3, 2026  
**Status:** Ready for stakeholder approval and team kickoff  
**Next step:** Assign design + frontend leads to /early-access build

