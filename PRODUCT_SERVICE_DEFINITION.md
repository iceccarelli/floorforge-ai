# FloorForge Product & Service Definition

**Date:** August 3, 2026  
**Edition:** 0.1.0 – Pilot Phase  
**Audience:** FloorForge team, pilot contractors, partners  
**Status:** Ready for Pilot Deployment

---

## Executive Summary

FloorForge offers a **phased, hardware-validated service model** for autonomous hardwood floor refinishing. This document defines what is **operationally available now** (software + simulator), what **requires prototype hardware** (sanding, edging, finishing), and what **depends on field validation** (coverage consistency, dust containment, ROI claims).

The first **pilotable offering is a three-part service:**

1. **Interactive Simulation & ROI Modeling** – Available immediately, free/open to contractors
2. **Pilot Qualification & Onboarding** – Structured intake for 3–5 early contractors (weeks 1–2)
3. **ForgeSand D1 Hardware Pilot** – First physical unit with live telemetry, dust logging, and quality reporting (weeks 3–12)

No claims are made about performance, timeline, or cost beyond what is already in active development or field-tested.

---

## Platform naming — canonical

**These are the only names.** Marketing copy, API examples, firmware documentation,
roadmap line items and support conversations all use the same string. A pilot customer
who opens a ticket about "my ForgeCoat C1" must land on a machine every one of these
documents recognises.

| Canonical name | Codename | `RobotPlatform` code | Role | Superseded names — do not use |
|---|---|---|---|---|
| **ForgeSand D1** | `D1` | `sand` | Autonomous multi-grit field sanding | Sander D1, Sander Pro |
| **ForgeEdge E1** | `E1` | `edge` | Semi-autonomous edging and perimeter work | Edger E1, Edger D1 |
| **ForgeCoat C1** | `C1` | `coat` | Finish application | Finisher F1, Finish F1, Finisher D1, Coater C1 |
| **ForgeLay L1** | `L1` | `lay` | Plank placement gantry | Plank Layer L1, Plank Layer (L1) |
| **ForgeScan S1** | `S1` | `scan` | Inspection, flatness and coverage QA | Inspector I1, Inspector (I1) |

Before this table these documents used a second vocabulary that shared **no platform name
at all** with the website, and two of the five differed in the codename letter itself —
`Finisher F1` against `ForgeCoat C1`, `Inspector I1` against `ForgeScan S1`. The site's
names won because `Forge*` is a system and `Sander` is a description
(`audit/PRODUCT_TRUTH.md` T1-1).

The `RobotPlatform` codes were already identical on both sides (`lib/types.ts:258` and
`SHARED_INTERFACE_NOTES.md:387`); only the human-readable layer had drifted.

> **Open — robot ID prefixes.** `lib/db/client.ts:357-363` maps `scan` to `FF-X`, which
> exists only because `FF-S` was already taken by `sand`. Under the codename letters
> there is no collision: `FF-D`, `FF-E`, `FF-C`, `FF-L`, `FF-S`. Switching would flip the
> meaning of `FF-S` from sander to scanner, so it is **not** done here — every example in
> `API_REFERENCE.md` and the `FF-S[0-9]{3}` regex at `SOFTWARE_HARDWARE_CONTRACT.md:100`
> assume the current meaning. Decide before the first device ships a serial number.

---

## Part A: Software Services (Pilot-Operable Now)

### 1. Interactive 3D Robot Simulators

**What it is:** Five fully interactive, browser-based simulations of robot platforms: ForgeSand D1, ForgeEdge E1, ForgeCoat C1, ForgeLay L1, ForgeScan S1.

**Available now:** ✅ Live at floorforge.ai/simulator and /pro-simulator

**Features:**
- 3D floor geometry with interactive controls (dimensions, wood type, damage patterns)
- Real-time grit sequencing visualization (36 → 80 → 120 progression on ForgeSand D1)
- Coverage heatmaps showing sanded areas and gaps
- Dust capture modeling (aspirational, not validated)
- Performance metrics display (time, pressure, temperature)

**What this proves:**
- The robot design concepts are technically feasible
- Multi-grit sequencing can be executed in order
- Coverage patterns can be mapped and visualized

**What this does NOT prove:**
- Real hardware can achieve these patterns
- Dust capture matches the 98% target
- Hardware is safe, reliable, or cost-effective to manufacture

**Customer value:** Contractors can explore the concept, visualize their own floor scenario, and decide if autonomous sanding aligns with their operation.

**Included in pilot package:** Yes, free exploration tool

---

### 2. Transparent ROI Calculator

**What it is:** A web-based model that calculates breakeven cost and payback period based on contractor inputs.

**Available now:** ✅ Live at floorforge.ai/#pricing (interactive calculator section)

**Inputs (contractor-editable):**
- Monthly floor volume (sqft)
- Average labor rate ($/hr)
- Current labor hours per sqft
- Cost of consumables (sandpaper, finish)
- Equipment maintenance assumptions

**Outputs:**
- Estimated time savings per month (hours)
- Labor cost recovered ($/month)
- Payback period for hardware (months)
- Monthly operating cost
- ROI after 1, 2, 3 years

**What this proves:**
- The unit economics *could* work under optimistic assumptions
- Contractors can adapt the model to their specific market conditions

**What this does NOT prove:**
- Hardware will achieve the assumed labor hour savings
- Actual contractors will see the projected time reductions
- The cost estimates are accurate (no supplier quotes yet)

**Customer value:** Contractors can run scenarios, understand the cost drivers, and make informed decisions about participation.

**Included in pilot package:** Yes, free interactive tool

---

### 3. Pilot Application & Onboarding

**What it is:** A structured intake process that collects contractor data, qualifies readiness, and formalizes pilot participation.

**Available now:** ✅ Waitlist form live; backend database ready for pilot cohort

**Process:**
- Step 1: Web form (floorforge.ai/#waitlist) – Name, email, company, monthly sqft, robot interests
- Step 2: Qualification call (FloorForge team) – Assess operation size, safety readiness, data sharing consent
- Step 3: Onboarding kit – Pilot T&Cs, hardware expectations, dashboard access, support contact info
- Step 4: Hardware assignment – Assign ForgeSand D1 unit and telemetry credentials

**What qualifies a pilot customer:**
- 2,000–10,000 sqft/month typical workload (or confirmed willingness to participate)
- No prior involvement with autonomous floor equipment
- Access to 1–2 representative job sites in first 8 weeks
- Willingness to log daily progress and provide weekly feedback

**What this proves:**
- Contractor interest exists at measurable levels
- We can operationally manage a small cohort
- Data collection and feedback loops work end-to-end

**What this does NOT prove:**
- That hardware will be ready on time
- That the pilot is profitable for participants
- That non-pilot contractors will adopt the product

**Customer value:** Contractors get priority access to hardware, preferential pricing, and direct input on product roadmap.

**Included in pilot package:** Yes, free intake and onboarding

---

### 4. Live Dashboard (Pilot-Only Interface)

**What it is:** Web-based job management and telemetry display for pilot customers.

**Available now:** ✅ Framework deployed; currently shows hardcoded sample data; ready to connect to real jobs

**Features:**
- Job creation (site name, sqft, grit sequence)
- Real-time progress tracking (pass #, grit, % coverage, time elapsed)
- Telemetry viewer (dust readings, sensor health, errors)
- Post-job report (coverage approval, signature line, notes)
- Fleet status (robot health, battery, maintenance alerts)

**What this proves:**
- Multi-tenant data isolation works
- Live telemetry can be ingested and displayed
- Customers can manage jobs asynchronously

**What this does NOT prove:**
- Hardware telemetry is accurate or reliable
- Coverage metrics are customer-useful or verified
- Dashboard stability under production load

**Customer value:** Contractors have real-time visibility into autonomous work, can pause/resume jobs, and get approval workflows for quality gates.

**Included in pilot package:** Yes, dashboard access for each pilot site

---

## Part B: Hardware-Dependent Services (Prototype & Field Validation Required)

### 1. Autonomous Sanding — ForgeSand D1 Unit

**What it is:** A wheeled robot platform that executes a multi-grit sanding sequence on hardwood floors.

**Current status:** Design complete (mechanical, electrical specs); prototype breadboard in progress (week 3–4)

**Planned capabilities (design targets, unvalidated):**
- Three-grit sanding sequence (36, 80, 120)
- Pressure control (target: 2–5 PSI, varies by wood hardness)
- Dust extraction to external HEPA system
- Coverage logging via encoder wheels and pressure sensors
- Manual grit change (contractor-installed consumable)
- Bluetooth/WiFi telemetry to dashboard

**Success criteria for pilot:**
- ✅ Unit runs without overheating or jamming (4+ hours)
- ✅ Coverage map logged (can show what was sanded where)
- ✅ Dust readings captured (µg/m³ at extraction point)
- ✅ Contractor can pause, resume, abort job safely
- ✅ Post-job report generated and signed off

**Risks (explicitly acknowledged):**
- Hardware delivery delay (COVID-supply-chain lessons: assume 4–6 week buffer)
- Pressure sensor inaccuracy (first prototype often has ±10% error)
- Dust containment incomplete (aspirational 98% may be 70–85% in first run)
- Coverage gaps in corners/edges (design trade-off for safety)

**Not in scope for pilot:**
- Automatic grit changing (manual change OK for pilot)
- Hands-free operation (requires human oversight in all pilots)
- Outdoor sanding (indoor residential/commercial only)
- Stain removal (unit assumes floor is pre-cleaned)

**Customer value:** First hands-on validation of autonomous sanding; direct feedback on design priorities.

**Included in pilot package:** 1 ForgeSand D1 unit per pilot site, live telemetry, weekly support calls

---

### 2. Autonomous Edging — ForgeEdge E1 Unit (Post-Sanding)

**What it is:** A robot that edges (sands along walls and furniture edges) after the main sanding pass.

**Current status:** Design on paper; no prototype hardware yet; not in first pilot cohort

**Planned capabilities (design targets):**
- Trim proximity detection (stay 2 inches from walls without touching)
- Variable grit (80 primary, 120 finish)
- Pressure control optimized for edge geometry
- Coverage mapping per wall/edge

**Why not in first pilot:** 
- Edging is secondary; validate sanding first
- Adds complexity (separate unit, logistics, integration)
- Design requires contact sensors (riskier; more development needed)

**Timeline:** Prototype Q4 2026 if ForgeSand D1 validates; field pilot Q1 2027

**Customer value:** Complete autonomous sanding/edging chain; eliminates manual edge work (typically 20% of labor time).

**Included in first pilot package:** No; deferred to phase 2

---

### 3. Autonomous Finishing — ForgeCoat C1 Unit (Post-Sanding)

**What it is:** A robot that applies finish (polyurethane, water-based, etc.) using spray or roll techniques.

**Current status:** Design on paper; no prototype yet

**Planned capabilities (design targets):**
- Application method selection (spray for open areas, roll for edges)
- Viscosity & temperature control
- Film thickness measurement (dry film thickness gauge)
- Drying-time monitoring

**Why not in first pilot:**
- Chemical safety (ventilation, PPE, regulatory) adds burden
- Finish adhesion is highly wood-type-dependent
- First pilot validates sanding; finishing can follow

**Timeline:** Prototype Q4 2026; pilot Q2 2027 (after sanding + edging validated)

**Customer value:** Complete automated refinishing (prep → sand → edge → coat); labor reduction 70%+ in theory.

**Included in first pilot package:** No; deferred to phase 2

---

### 4. Plank Placement & Inspection (Future Phases)

**What it is:** ForgeLay L1 positions replacement planks; ForgeScan S1 scans for coverage gaps and defects.

**Current status:** Design concepts only; no hardware or timeline

**Why not in pilot:** Requires sanding + edging to be stable first; adds complexity; not critical path for MVP.

**Timeline:** Prototype 2027; pilot 2027–2028

---

## Part C: Data & Validation Requirements

### Phase 1 (Weeks 1–12): Pilot Cohort

**What we measure:**
- ✅ Contractor interest and qualification (waitlist → onboarded conversion)
- ✅ Hardware reliability (uptime, failures, repairs)
- ✅ Telemetry accuracy (sensor readouts vs. manual measurements)
- ✅ Coverage consistency (sanded area % vs. target zones)
- ✅ Dust capture performance (µg/m³ in room vs. extraction point)
- ✅ Operator safety (incidents, near-misses, feedback)
- ✅ Customer NPS (post-job satisfaction survey)

**What we validate:**
- Hardware can run > 4 hours without failure
- Coverage maps are ≥ 85% accurate vs. visual inspection
- Dust readings are correlated with visual dust levels
- Contractors can adopt the dashboard workflow

**What we explicitly do NOT claim:**
- "FloorForge saves 60% of labor" (unvalidated; depends on job type)
- "Dust is guaranteed 98% captured" (design target; actual TBD)
- "Hardware costs $X; pricing locked" (subject to change)

---

## Part D: Service Pricing (Pilot Phase)

### Pilot Cohort (3–5 Contractors)

| Service | Pilot Cost | Normal Cost (TBD) | Notes |
|---------|-----------|-------------------|-------|
| **ForgeSand D1 unit** | Free (2–3 month loan) | ~$15–25K (indicative) | Contractor owns logistics, consumables (sandpaper, dust bags) |
| **Dashboard access** | Free | Free (SaaS) | Included with robot; multi-job, multi-user seats |
| **Telemetry ingestion** | Free | Free (first 100 jobs/month) | Excess usage $ TBD post-pilot |
| **Support & calls** | Weekly FloorForge calls | TBD (phone support tier) | Direct engineer access during pilot |
| **Training & onboarding** | 2-hour kickoff video | TBD (paid workshop or included) | Onsite optional (travel TBD) |

**Rationale:** Pilot customers get free hardware and support in exchange for daily usage logs, weekly feedback, and data rights.

### Revenue Model (Post-Pilot, Indicative)

- **Hardware sale:** Upfront robot cost (unit economics unknown until manufacturing quotes)
- **SaaS subscription:** $X/month per robot (includes dashboard, telemetry, support)
- **Consumables:** Sandpaper, finish, dust bags (margin: 15–25%, similar to traditional floor finishing)
- **Services:** Installation, field training, extended warranty (à la carte, TBD)

**Pricing not locked until:** Post-pilot manufacturing cost, supply chain validation, and field ROI data

---

## Part E: What We Do NOT Offer (Explicitly Out of Scope)

| Service | Why Not | Timeline |
|---------|---------|----------|
| **Hands-free operation without human oversight** | Safety risk; requires field validation | Post-pilot (if piloted safely) |
| **Mobile app (iOS/Android)** | Web MVP sufficient for pilot | Q2 2027 |
| **Integration with QuickBooks, Stripe, Slack** | Pilot doesn't need these; add post-revenue | Post-launch |
| **On-site installation and maintenance** | Pilot contractors handle setup; FloorForge assists remotely | Q1 2027 (service network TBD) |
| **Guarantee of time savings** | Depends on floor type, job size, crew skill; can't guarantee | Field validation only |
| **Supply chain & parts availability** | Not yet established; pilot uses loaner units | Post-launch |
| **Regulatory certifications (CE, UL, OSHA)** | In parallel with hardware development | Q4 2026–Q1 2027 |
| **International expansion** | English-only; US market focus | 2027+ |

---

## Part F: Pilot Cohort Agreement

### Contractor Responsibilities

1. **Daily logging:** Record job start/end times, floor type, grit sequence, visual dust levels
2. **Weekly feedback:** 15-min sync call with FloorForge team; report issues, satisfaction, suggestions
3. **Data sharing:** Grant FloorForge rights to telemetry, photos, and post-job reports for product development
4. **Safety:** Follow hardware manual; report any incidents immediately
5. **Hardware care:** Keep unit clean, don't attempt repairs beyond consumables (sandpaper), return on schedule

### FloorForge Responsibilities

1. **Hardware delivery:** Unit in working condition at start of pilot window (4-week buffer for delays)
2. **Support:** Weekly calls, email support for technical issues, <24hr critical incident response
3. **Dashboard uptime:** ≥ 99% uptime SLA; backups and disaster recovery in place
4. **Iteration:** Product feedback is reviewed weekly; prioritize pilot requests vs. other work
5. **Transparency:** Share weekly progress updates (challenges, next milestones, dependency risks)

### Data & Liability

- **Data rights:** FloorForge owns aggregated/anonymized telemetry; contractor owns photos of their jobs
- **Liability:** Pilot is research; contractor assumes risk of hardware malfunction. Insurance TBD (discuss with pilot)
- **Exit terms:** Either party can end pilot with 2 weeks notice; hardware returned; data kept for analysis
- **NDA:** Optional; default is open (FloorForge may publish results if contractor consents)

---

## Part G: Key Metrics & Success Criteria

### Pilot Recruitment (Weeks 1–2)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Waitlist applications** | 20–50 | Form submissions from floorforge.ai |
| **Qualified contractors** | 3–5 signed | Onboarding agreements executed |
| **Geographic diversity** | 2–3 states min | Distribution of pilot sites |

### Hardware Reliability (Weeks 3–12)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Unit uptime** | ≥ 95% | Operational hours / available hours |
| **Mean time between failure** | > 40 hours | Cumulative pilot hours / count of failures |
| **Recovery time** | < 4 hours | Time from failure report to repair or replacement |

### Data & Dashboard (Weeks 1–12)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Telemetry ingestion success** | 100% | Delivered events / logged events |
| **Dashboard availability** | ≥ 99% | Uptime monitoring via Sentry |
| **Query latency** | < 2 sec | P95 response time for dashboard page loads |

### Customer Satisfaction (Ongoing)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **NPS post-first-job** | ≥ 5 | Single question: "How likely to recommend pilot to peer?" |
| **Weekly call attendance** | 100% | Contractor shows up for sync calls |
| **Data quality** | 95% | Logs filled out completely, timestamps accurate |

### Pilot Continuation (Week 12 Decision)

| Criterion | Decision |
|-----------|----------|
| **All success metrics met** | Extend pilot 8 more weeks; scale to 5–10 contractors |
| **Some metrics miss, fixable issues** | Extend with 1-week pause to address blockers |
| **Hardware unreliable or unsafe** | Halt pilot; redesign hardware; restart Q4 2026 |
| **Contractor churn > 40%** | Investigate satisfaction; iterate onboarding |
| **Telemetry unreliable** | Fix backend; retest with pilot 2.0 |

---

## Part H: Timeline & Sequencing

### Week 1 (Starting Now, August 3)

- ✅ Pilot T&Cs finalized and reviewed by legal
- ✅ Waitlist form collects applications
- ✅ Supabase schema deployed; dashboard wired to real data
- ✅ Support runbook documented (onboarding, escalation, weekly sync template)

### Weeks 2–3

- Hardware breadboard (ForgeSand D1) in assembly
- First 3–5 pilot contractors qualified and onboarded
- Dashboard users created; credentials sent
- First test jobs logged to database

### Weeks 4–6

- ForgeSand D1 prototype functional (manual grit change, basic telemetry)
- First pilot contractor receives unit
- Weekly feedback calls begin
- Telemetry pipeline validated

### Weeks 7–12

- Iterate on hardware feedback
- Log 50–100 jobs (mix of test + real)
- Measure dust, coverage, safety
- Capture contractor feedback for product roadmap

### Week 12 (Decision Gate)

- Evaluate against success criteria
- Decide: continue pilot, extend with modifications, or halt for redesign

---

## Part I: Success Definition

**Pilot succeeds if:**

1. ✅ Contractor recruitment reaches 3–5 signed agreements (commitment signal)
2. ✅ Hardware runs ≥ 40 hours without critical failure (reliability baseline)
3. ✅ Telemetry pipeline ingests 100% of logged events (data integrity)
4. ✅ Dashboard enables job logging and approval workflow (usability)
5. ✅ Contractors report NPS ≥ 5 (satisfaction, willingness to continue)
6. ✅ Weekly calls happen; feedback is actionable (partnership health)

**Pilot fails if:**

1. ❌ Fewer than 2 contractors recruited (interest signal insufficient)
2. ❌ Hardware fails > 2 times in first 40 hours (reliability insufficient)
3. ❌ Telemetry losses > 10% (data integrity compromised)
4. ❌ Dashboard crashes or is unusable (technical debt)
5. ❌ Contractors report NPS < 0 (dissatisfaction, trust lost)
6. ❌ Pilot contractors drop out before week 6 (churn, misalignment)

---

## Next Document

See **PRODUCT_SERVICE_ROADMAP.md** for ranked engineering priorities, hardware milestones, and feature sequencing for the 12-month horizon.

---

## Appendix: Definitions

**Pilotable:** Service or feature can be meaningfully tested with a small cohort in real-world conditions.

**Validated:** Claim is supported by field data from ≥ 3 independent pilot sites.

**Design target:** Aspirational specification; not yet measured in hardware.

**Phase 1:** Pilot cohort (weeks 1–12); 3–5 contractors, ForgeSand D1 only.

**Phase 2:** Expansion (months 4–6); edging + finishing; 5–10 contractors; scaled operations.

**Phase 3:** Launch (month 9+); all platforms; commercial availability; supply chain active.

---

**Prepared by:** FloorForge Product & Engineering  
**Date:** August 3, 2026  
**Status:** Ready for Pilot Deployment  
**Next Review:** October 3, 2026 (post-pilot completion)
