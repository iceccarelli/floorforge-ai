# Page UX Contracts: FloorForge Public Site

**Date:** August 3, 2026  
**Edition:** 1.0  
**Status:** Ready for implementation  
**Audience:** Product, design, and frontend teams

---

## Overview

Each page in the FloorForge public site has a **contract**: a clear definition of what job it does, what visitors should feel/understand, and what actions they should take. This document defines those contracts to prevent scope creep and ensure each page earns its place.

**Principle:** Every page must move the visitor closer to one of two outcomes:
1. **Join the pilot waitlist** (conversion)
2. **Understand what FloorForge is** (engagement)

---

## Part 1: Current Public Routes Audit

| Route | Component | Purpose | Status | Owned By |
|-------|-----------|---------|--------|----------|
| `/` | `app/page.tsx` | Home / landing | ✅ Live | Product |
| `/simulator` | `app/simulator/page.tsx` | 3D interactive sander demo | ✅ Live | Frontend |
| `/pro-simulator` | `app/pro-simulator/page.tsx` | Alt simulator (5-platform view) | ✅ Live | Frontend |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard preview (sample data) | ✅ Live | Product |
| `/operator/*` | `app/operator/` | Internal pilot management | ✅ Live (internal only) | Engineering |

**Internal routes (not public):**
- `/api/*` – Backend endpoints
- `Clerk auth pages` – Sign in / sign up (optional, behind feature flag)

---

## Part 2: Recommended Information Architecture

### Tight Public Navigation (5 main pages)

```
/ (HOME)
  ├─ Product vision
  ├─ Early-access positioning
  ├─ Path to pilot
  └─ CTA: Join waitlist

/platform (NEW - HOW IT WORKS)
  ├─ End-to-end workflow
  ├─ Technology stack overview
  ├─ What happens in a pilot
  └─ CTA: Qualify for pilot

/platforms (NEW - ROBOT OVERVIEW)
  ├─ 5 robot cards (design targets)
  ├─ Honest specs (no guarantees)
  ├─ Links to simulator for each
  └─ CTA: Explore in 3D

/simulator (EXISTING)
  └─ Interactive 3D (ForgeSand D1 + pro-sim option)

/early-access (NEW - PILOT LANDING PAGE)
  ├─ Pilot requirements
  ├─ Application form
  ├─ Timeline & onboarding
  └─ CTA: Apply now

---

**Optional (only if useful):**
- `/company` – Team, mission, why (low priority; remove if not updated)
- `/faq` – Common questions (can live on home page instead)

---

**Current gaps:**
- No dedicated "How it works" page (explained on home; could use its own page for depth)
- No dedicated "Pilot" page (waitlist form is on home; could use dedicated page for qualification + application)
- Robots are described on home; no dedicated overview page (could help contractors compare platforms)

---

## Part 3: Page UX Contracts (Detailed)

### Page 1: Home (/) – Vision & Credibility & Entry Point

**Job:** Be the front door. Establish credibility, show what FloorForge is, and move qualified visitors to the pilot application.

**Visitor mental model on arrival:**
- "What is this?"
- "Is it real or vaporware?"
- "Is it for me?"

**What they should feel:**
- ✅ This is honest and early-stage (not overhyped)
- ✅ This is serious and well-engineered (not a toy)
- ✅ This is FOR me (if they're a floor contractor)
- ✅ There's a clear path to try it (pilot)

**Must communicate:**
1. **Hero:** Problem + solution in 10 seconds
   - "Autonomous hardwood floor refinishing — early-access pilot program"
   - "Consistent quality, faster jobs, data-driven operations."
2. **Why now:** Credibility anchors
   - "Hardware is in active development"
   - "Software is live and pilot-ready"
   - "Five purpose-built platforms in design"
3. **How it works:** 4-step visual flow
   - Site capture → Sanding → Edging → Finishing
4. **Honest specs:** Design targets, not guarantees
   - "Designed to achieve 98% dust capture"
   - "Targeting 50% labor time savings"
5. **For whom:** Target segments
   - High-end residential, commercial office, specialty woods
6. **ROI model:** Transparent calculator
   - Contractor inputs assumptions, sees breakeven
7. **Pricing tiers:** Indicative (not final)
   - Essentials, Professional, Enterprise
8. **Pilot pathway:** How to join
   - "3–5 contractors, 8–12 weeks, real hardware"

**Key sections (in order):**
- Hero (problem + CTA)
- Features (6 key capabilities)
- How it works (4 steps)
- Showcase carousel (example jobs/renders)
- ROI calculator (interactive)
- Segments (who we're building for)
- Technology highlights (hw + sw)
- Pricing tiers
- Pilot signup (final CTA)
- Footer (contact, links)

**Success metrics:**
- ✅ Hero is understood in < 5 sec (test with new reader)
- ✅ "Early access" label visible in header (combats vaporware fear)
- ✅ No visitor sees "guaranteed," "proven," "certified" (honest language only)
- ✅ Waitlist button visible above fold (no scroll to join)
- ✅ Mobile view is readable (responsive, no cramped text)

**Current state:** ✅ Compliant (already good; see DESIGN_SYSTEM.md for consistency audit)

---

### Page 2: Platform (How It Works) – End-to-End Workflow

**Job:** Answer "How does this actually work?" in detail. For contractors and engineers who want depth before applying.

**Visitor mental model on arrival:**
- "I believe it exists, but how does it actually work?"
- "What's my role as the contractor?"
- "What does success look like?"

**What they should feel:**
- ✅ This is a real, integrated system (not bolted-together parts)
- ✅ I understand my role (I don't disappear)
- ✅ The workflow is logical
- ✅ I'm ready to talk to the team

**Must communicate:**
1. **Workflow diagram / visual flow**
   - Step 1: Site capture (LiDAR, photogrammetry) → Digital twin
   - Step 2: Plan generation (multi-grit sequence, coverage optimization)
   - Step 3: Autonomous execution (robots + human oversight)
   - Step 4: Quality reporting (approval, post-job report)

2. **What happens in each step**
   - Capture: 15-20 min on-site scan
   - Planning: Software generates optimal passes
   - Execution: Robots run while contractor monitors
   - Reporting: Dashboard shows coverage, dust, approval status

3. **What the contractor does**
   - Prepare site (furniture removal, etc.)
   - Monitor dashboard during work (not hands-on)
   - Approve results when done
   - Integrate with customer handoff

4. **What's in software vs hardware**
   - Software: Dashboard, planning, quality, reporting
   - Hardware: 5 robots (sand, edge, coat, lay, scan)

5. **Honest uncertainty**
   - "First pilot will measure actual dust capture"
   - "Coverage consistency will be validated in field"
   - "Time savings depend on floor type and size"

6. **Next step**
   - "Join the pilot to be part of defining this"

**Sections:**
- Hero: "This is how autonomous floor refinishing actually works"
- Workflow visualization (4 steps with descriptions)
- Detailed breakdowns (per step: what, how long, what you do)
- Technology layer (software + hardware balance)
- Honest caveats (what we're measuring in pilot)
- FAQ: Common questions
- Final CTA: "Ready to shape this? Apply for the pilot"

**Success metrics:**
- ✅ First-time visitor understands full workflow (no confusion)
- ✅ Contractor sees where they fit (not replaced by robots)
- ✅ No visitor thinks this is hands-free magic (clear oversight model)
- ✅ Link back to home for those wanting quick summary

**Current state:** 🔴 Not built (content currently on home page; could use dedicated page for depth)

---

### Page 3: Platforms (Robot Overview) – The Hardware

**Job:** Show each robot platform at a glance. Let contractors understand the full picture and explore 3D models.

**Visitor mental model on arrival:**
- "What robots are we building?"
- "What does each one do?"
- "What's the roadmap?"

**What they should feel:**
- ✅ These are purpose-built (not repurposed drones)
- ✅ Each has a clear job
- ✅ The team has thought through integration
- ✅ They're in active development (not shipping tomorrow)

**Must communicate:**
1. **Five robot cards:**
   - **ForgeSand D1** (pilot-ready)
     - Job: Multi-grit sanding main floor
     - Status: Breadboard (weeks 3–4), field pilot (weeks 7–8)
     - Design targets: Pressure control, coverage mapping, dust logging
   
   - **ForgeEdge E1** (prototype phase)
     - Job: Edge and transition sanding
     - Status: Design on paper, prototype Q4 2026
     - Design targets: Wall proximity detection, edge pressure control
   
   - **ForgeCoat C1** (future)
     - Job: Polyurethane application
     - Status: Design concept, prototype 2027
     - Design targets: Spray/roll modes, viscosity control, film thickness
   
   - **ForgeLay L1** (future)
     - Job: Specialty plank placement
     - Status: Concept only
     - Design targets: Precision alignment, strain detection
   
   - **ForgeScan S1** (future)
     - Job: Post-finish quality scan
     - Status: Concept only
     - Design targets: Gap detection, defect mapping

2. **Honest status labels**
   - "Prototype in test" vs "Field pilot" vs "Design target"
   - No "coming soon" without date
   - Link to PRODUCT_SERVICE_DEFINITION.md for detail

3. **Interactive 3D view (per robot)**
   - Each card links to `/simulator` with pre-selected robot
   - "Explore in 3D" button shows what it looks like in action

4. **Specifications**
   - Design targets (not guaranteed performance)
   - Example: "Designed for 36→80→120 grit sequence"
   - Never use "proven," "tested," "validated"

5. **Development roadmap**
   - Which robots in pilot? (ForgeSand D1 in phase 1)
   - Which next? (ForgeEdge E1 in phase 2)
   - When are others expected? (ForgeCoat C1 in 2027)

**Sections:**
- Hero: "The platforms we're building"
- 5 robot cards (2x on mobile, 3x on tablet, full grid on desktop)
- Each card: Image, name, job, status, specs, "Explore 3D" link
- Roadmap: Timeline of when each enters pilot/production
- Tech shared layer (software orchestration, all use same OS)
- Final CTA: "Which robot would you use first? Join the pilot."

**Success metrics:**
- ✅ Contractor can see all platforms at once (no scrolling to find one)
- ✅ Status is clear (pilot vs future vs concept)
- ✅ No visitor thinks they can buy one today (realistic expectations)
- ✅ Links to 3D simulator work smoothly

**Current state:** 🔴 Not built (content on home page; deserves own page for discovery and clarity)

---

### Page 4: Simulator (/simulator) – Interactive 3D

**Job:** Let visitors explore robots in 3D without explaining specs. For visual learners and curious contractors.

**Visitor mental model on arrival:**
- "Let me play with this and see how it works"
- "What does this look like in action?"
- "Can I adjust parameters?"

**What they should feel:**
- ✅ This is fun and intuitive (no manual needed)
- ✅ I can understand the concept visually
- ✅ The software layer makes sense (dashboard shows what's happening)

**Must communicate:**
1. **Interactive 3D floor visualization**
   - Default: 1000 sqft space, light oak
   - Adjustable: Floor size, wood type, damage patterns
   - Visual: Robot path, coverage heatmap, grit progression

2. **Sanding simulation**
   - Play button starts grit sequence (36 → 80 → 120)
   - Progress bar shows coverage % and time
   - Heatmap shows what's been sanded (visual feedback)

3. **Alternative: Pro simulator** (`/pro-simulator`)
   - Shows all 5 robots (on same floor or separate)
   - Compare time + coverage across platforms
   - Educational (not for detailed planning)

4. **Mobile-friendly**
   - Works on tablet (finger pan/zoom)
   - Touch-friendly play controls

5. **Exit path**
   - "This helped me understand. I want to talk." → Contact/waitlist
   - "I want to see my floor." → Pilot application

**Sections:**
- Brief intro: "Explore how autonomous sanding works in 3D"
- 3D canvas (WebGL, interactive)
- Controls: Play/pause, speed, floor params
- Info panel: Current step, progress, metrics
- CTA: "Ready to test this on your floor? Apply for the pilot"

**Success metrics:**
- ✅ Loads in < 3 seconds (even on slower connections)
- ✅ Works on mobile (not just desktop)
- ✅ No confusing terminology (labels are plain English)
- ✅ Play button is obvious
- ✅ Visitor can explore without instructions

**Current state:** ✅ Compliant (live at /simulator and /pro-simulator; well-designed)

---

### Page 5: Early Access / Pilot (NEW) – Application & Qualification

**Job:** Qualify interested contractors and move them to formal application. The conversion funnel.

**Visitor mental model on arrival:**
- "I'm interested. How do I actually join the pilot?"
- "What are the requirements?"
- "What happens next?"

**What they should feel:**
- ✅ This is a real, structured program (not just a mailing list)
- ✅ I can see if I qualify (transparency)
- ✅ I know what to expect (timeline + commitment)
- ✅ I'm ready to apply

**Must communicate:**
1. **Pilot overview**
   - 3–5 contractors, 8–12 weeks
   - ForgeSand D1 unit (hardware loaner)
   - Live telemetry and dashboard access
   - Weekly check-ins with FloorForge team
   - Preferential launch pricing

2. **Qualification criteria**
   - 2,000–10,000 sqft/month workload (typical)
   - Access to 1–2 test job sites
   - Willingness to log daily progress
   - Ability to provide weekly feedback
   - Interest in one or more robot platforms

3. **Timeline**
   - Week 1–2: Onboarding (T&Cs, hardware delivery)
   - Week 3–6: Active testing (daily runs, telemetry)
   - Week 7–12: Feedback loop (weekly calls, iteration)
   - Week 12: Decision (continue with phase 2 or pause)

4. **Commitment**
   - Time: 2–3 hours/week (feedback calls, logging)
   - Data: FloorForge gets telemetry + photos (for product development)
   - Logistics: You handle consumables (sandpaper, dust bags)
   - Risk: Hardware is prototype; may have issues

5. **What you get**
   - Hardware access (free for pilot period)
   - Live dashboard (real job tracking)
   - Direct engineering contact
   - Input on product roadmap
   - Preferential pricing post-pilot

6. **How to apply**
   - Form: Name, email, company, monthly volume, robot interest, location
   - Submission: FloorForge reviews (48 hrs)
   - Interview: 15-min call to assess fit
   - Onboarding: Legal, hardware logistics, kickoff

**Sections:**
- Hero: "You shape the future of floor refinishing"
- Pilot benefits (6 points)
- Qualification checklist (are you a good fit?)
- Timeline (visual: weeks 1–12)
- Commitment level (time, data, logistics)
- Application form (5–7 fields)
- FAQ (common questions)
- CTA: "Ready? Apply now" (submit form)

**Success metrics:**
- ✅ Visitor clearly understands what pilot means (not pre-order)
- ✅ Form conversion rate > 3% (if site traffic is 1000/mo)
- ✅ Application quality is high (right contractors, not tire-kickers)
- ✅ No visitor confused about pricing (pilot is free hardware)
- ✅ Mobile form is easy to fill (single column, clear labels)

**Current state:** 🔴 Not built (waitlist form is on home page; could use dedicated page for qualification)

---

## Part 4: Secondary Pages (Optional)

### About / Company (Low priority, only if updated)

**Job:** Tell the FloorForge story (team, why, mission). Only if it's authentic and updated.

**Decision:** Skip for now. If added later:
- Keep it short (team photos, mission, why we're building this)
- No founder hagiography (just facts)
- Link to blog or press if you have recent articles

**Current state:** 🔴 Not built (and not needed for pilot success)

---

### FAQ (Optional, can live on home)

**Job:** Answer common questions quickly.

**Decision:** Live on home page as accordion. Dedicated page only if > 20 questions.

**Topics:**
- How is this different from renting equipment?
- What if the hardware breaks?
- Can we buy hardware without the software?
- What's the startup cost?
- Does this replace my team?

**Current state:** 🟡 Partial (some answers on home page; could be organized better)

---

## Part 5: Navigation Architecture (Site Map)

```
HOME (/)
├─ Product vision
├─ Calls to action (pilot, simulator, dashboard)
└─ Links to:
   ├─ /platform (How it works)
   ├─ /platforms (Robot overview)
   ├─ /simulator (3D interactive)
   ├─ /early-access (Pilot application)
   └─ Footer: Contact, privacy, etc.

HOW IT WORKS (/platform) [NEW]
├─ End-to-end workflow
├─ Step-by-step breakdown
├─ Honest caveats
└─ CTA: Apply for pilot

ROBOTS (/platforms) [NEW]
├─ 5 robot cards
├─ Roadmap timeline
├─ Links to 3D simulator (per robot)
└─ CTA: Join pilot

SIMULATOR (/simulator) [EXISTING]
├─ Interactive 3D ForgeSand D1
├─ Or: All 5 robots (pro-sim)
└─ CTA: Apply for pilot

EARLY ACCESS (/early-access) [NEW]
├─ Pilot overview
├─ Qualification criteria
├─ Application form
└─ CTA: Apply

DASHBOARD PREVIEW (/dashboard) [EXISTING]
├─ Sample job view
├─ Read-only demo
└─ CTA: Join pilot to use live
```

---

## Part 6: Conversion Funnel (Recommended Flows)

### Flow 1: Quick Interest
```
Home →[Simulator link]→ /simulator →[Play]→ /early-access →[Apply]→ Waitlist
```
**Time:** ~5 min  
**Motivation:** Curious, wants to see it in action

### Flow 2: Deep Dive
```
Home →[Platform link]→ /platform →[Understand workflow]→ /platforms →[Explore robots]→ /simulator →[See 3D]→ /early-access →[Apply]→ Waitlist
```
**Time:** ~15 min  
**Motivation:** Cautious, needs full picture

### Flow 3: Decision Maker
```
Home →[Scroll]→ ROI calculator →[Model economics]→ Pilot section →[Requirements]→ /early-access →[Apply]→ Waitlist
```
**Time:** ~10 min  
**Motivation:** Cost-conscious, focused on payback

---

## Part 7: Highest ROI Page to Build First

### Recommendation: **Build /early-access first** (Pilot application page)

**Why:**

1. **Highest conversion intent**
   - Visitors arriving here are already sold
   - Just need to qualify + capture contact

2. **Strongest feedback loop**
   - Form data tells you what contractors care about
   - Application quality improves product roadmap input
   - Quick time to learning (1–2 weeks)

3. **Enables pilot operation**
   - Existing home page can link here (no changes needed)
   - Dedicates a serious space for pilot recruiting
   - Separates "I'm curious" from "I want to apply"

4. **Fast to build**
   - No new components (reuse form, cards, CTA from home)
   - No animation heavy (design system handles it)
   - ~2–3 days frontend work + 1 day copywriting

### Second priority: **/platform** (How it works)

- Adds depth for cautious visitors
- Differentiates "vision" (home) from "engineering" (platform)
- Shares more of the pilot experience

### Third priority: **/platforms** (Robot overview)

- Nice-to-have clarity (content exists on home)
- Good for discovery (what robots am I piloting?)
- Integrates with simulator for 3D exploration

---

## Part 8: Content Ownership & Maintenance

| Page | Content Owner | Tech Owner | Update Frequency |
|------|---------------|-----------|------------------|
| `/` (home) | Product | Frontend | Monthly (pilot news) |
| `/platform` | Product | Frontend | Quarterly (specs) |
| `/platforms` | Product | Frontend | Quarterly (robots) |
| `/simulator` | Frontend | Frontend | As-needed (bugs) |
| `/early-access` | Product | Frontend | Weekly (pipeline) |
| `/dashboard` | Product | Frontend | As-needed (sample data) |

---

## Part 9: Copy Tone & Voice

**For all pages:**

✅ **DO:**
- Use plain language ("autonomous" OK, "distributed" NO)
- Be specific ("designed to achieve 98% dust capture" YES)
- Acknowledge risk ("this is early-stage" YES)
- Use action-oriented CTAs ("Join the pilot" YES)
- Tell the truth (always)

❌ **DON'T:**
- Use hyperbole ("game-changer," "revolutionary")
- Make unvalidated claims ("proven 60% faster")
- Fake social proof ("1000+ contractors love FloorForge")
- Hype dates ("shipping Q3" without buffer)
- Use jargon without explanation

**Example (good tone):**
> "Designed to achieve 98% dust capture — we'll measure actual performance during the pilot and share results."

**Example (bad tone):**
> "Revolutionary HEPA+ technology guarantees industry-leading dust control."

---

## Part 10: Testing & Validation

### Per page, measure:

1. **Understanding test** (5 new users)
   - Can they explain the job of this page in 1 sentence?
   - Can they find the primary CTA?

2. **Flow test** (5 users on full paths)
   - Do they get to application as expected?
   - Any confusion points?

3. **Conversion test**
   - Baseline: Home page conversion to waitlist
   - Target: Early-access page should be 2–3x higher

4. **Mobile test**
   - Forms work on phone
   - No text overlap
   - Buttons are thumb-friendly

---

## Part 11: Launch Checklist

- [ ] All pages follow DESIGN_SYSTEM.md (colors, spacing, typography)
- [ ] No "guaranteed" or unvalidated claims (all copy reviewed)
- [ ] Mobile responsive (tested on 375px, 768px, 1024px)
- [ ] Forms have validation and error messages
- [ ] All CTAs are accessible (keyboard navigable)
- [ ] Analytics tracking added (page views, CTA clicks)
- [ ] Lighthouse score > 90 (performance + accessibility)
- [ ] Page metadata (title, description) unique per page
- [ ] No broken links (internal or external)
- [ ] Legal reviewed (T&Cs, privacy policy linked)

---

## Appendix: Metrics to Track

### Per page:

- **Traffic:** Unique visitors, bounce rate, time on page
- **Engagement:** Scroll depth, CTA clicks, form starts
- **Conversion:** Form submissions, email captures
- **Cohort:** Source (search, referral, direct), device, location

### Pilot funnel (full path):

- Home → /early-access: % who click
- /early-access → Form submit: % conversion rate
- Form submit → Qualified: % of applicants who qualify
- Qualified → Onboarded: % who sign up for pilot

**Target:** 1% home visitors → piloting (very realistic for early-stage)

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| Aug 3, 2026 | 1.0 | Initial contracts |

---

**Maintained by:** FloorForge Product Team  
**Last updated:** August 3, 2026  
**Next review:** September 3, 2026 (after /early-access launch)

---

## Quick Summary

| Page | Job | Status | Priority |
|------|-----|--------|----------|
| **/** | Vision + entry point | ✅ Live | Maintain |
| **/platform** | How it works (detail) | 🔴 Not built | 2nd |
| **/platforms** | Robot overview | 🔴 Not built | 3rd |
| **/simulator** | 3D interactive | ✅ Live | Maintain |
| **/early-access** | Pilot application | 🔴 Not built | **1st** |
| **/dashboard** | Dashboard preview | ✅ Live | Maintain |

**Build /early-access first.** It's the conversion lever and requires minimal new design/engineering.

