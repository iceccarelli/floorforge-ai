# Product Alignment: FloorForge & EcoWoods Integration

**Date:** August 2, 2026  
**Status:** Early Access / Pilot Program  
**Codebase Version:** 0.1.0  
**Audience:** FloorForge team, EcoWoods partnership, potential pilot customers

---

## Executive Summary

FloorForge is an **early-stage autonomous hardwood floor refinishing operating system**, currently positioned as a **concept validation and pilot recruitment site**. The codebase is production-quality software (Next.js, TypeScript strict, modular architecture), but **represents design targets, not shipped hardware**.

This document establishes:
1. What exists in code today (credible, real software)
2. What is conceptual (designed, but unvalidated on hardware)
3. Realistic scope for a 90-day pilot program
4. Claims that are safe to make publicly
5. Claims that must be explicitly avoided
6. Technical interfaces for eventual integration with EcoWoods' Next.js ecosystem

---

## 1. Current Product Maturity

### What Is Production-Ready ✅

| Component | Status | Notes |
|-----------|--------|-------|
| **Landing page & messaging** | ✅ Live | Clear, honest, no fabricated claims |
| **Pilot waitlist funnel** | ✅ Live | Formspree form (or mailto fallback) captures inquiries |
| **Interactive simulators** | ✅ Live | 3D WebGL scenes for all five robot concepts; fully playable |
| **ROI calculator** | ✅ Live | Transparent model with stated assumptions; clearly labeled "estimates" |
| **Dashboard mockup** | ✅ Live | Sample UI with hardcoded telemetry; clearly labeled "sample data" |
| **Scripted demo chatbot** | ✅ Live | Scripted assistant for common questions; clearly labeled "demo" |
| **TypeScript codebase** | ✅ High quality | Strict mode, modular, well-documented, no test suite yet |
| **Vercel deployment** | ✅ Zero config | Builds with no environment variables; optional features auto-disable |

### What Is Designed But Not Implemented ⚠️

| Component | Status | Evidence |
|-----------|--------|----------|
| **Supabase schema** | Designed, not implemented | Schema documented in code comments; no migrations written |
| **Multi-tenant authentication** | Designed, not implemented | Clerk integration optional; no row-level security policies |
| **API layer** | Not started | No `/api/jobs`, `/api/telemetry`, or similar endpoints |
| **Real job persistence** | Not started | Dashboard fetches hardcoded mock data; no real database connection |
| **Real-time telemetry ingestion** | Not started | Simulator is standalone; no hardware uplink designed |
| **Payment/subscription logic** | Not started | No Stripe integration; pricing is indicative only |
| **Test suite** | Not started | No Jest/Vitest; codebase untested |

### What Does NOT Exist ❌

| Component | Status | Why |
|-----------|--------|-----|
| **Hardware** | No prototypes | Five platforms fully specced; no manufactured units |
| **Firmware** | Not started | No robot control software, edge-compute, or radio uplink |
| **Dust containment system** | No prototypes | Target: 98% HEPA capture; unvalidated |
| **Real-world coverage data** | No deployments | All coverage rates are design targets; zero field jobs completed |
| **Measured performance metrics** | No data | ROI, dust performance, grit sequencing—all unvalidated assumptions |
| **Supply chain** | No partners | No manufacturing, vendors, or logistics partners identified |
| **Regulatory certifications** | No certifications | No CE, UL, or OSHA validation |
| **Service network** | Not planned | No parts availability, warranty, or repair infrastructure |

---

## 2. Realistic 90-Day Pilot Scope

### Pilot Goals

**Primary:**
- Recruit 3–5 early-adopter refinishing contractors (250–2,000 sqft/month operators)
- Validate pilot recruitment funnel and customer qualification process
- Establish feedback loop for hardware requirements

**Secondary:**
- Build foundational backend infrastructure (Supabase schema + API routes)
- Prototype first hardware unit (Sander D1) with basic telemetry logging
- Deploy closed-beta dashboard for pilot customers (with real, live data)

### 90-Day Timeline

#### Weeks 1–2: Infrastructure (High Priority)
- [ ] **Supabase schema** – Write migrations for `jobs`, `sanding_reports`, `robots` tables; define RLS policies
- [ ] **API routes** – Implement `POST /api/jobs`, `GET /api/jobs`, `GET /api/jobs/[id]` with auth
- [ ] **Dashboard to live data** – Replace mock jobs with API calls; test multi-tenant isolation
- [ ] **Pilot T&Cs** – Draft legal agreement covering data rights, liability, exit terms

**Deliverable:** Pilot customers can log in, view real job data in dashboard.

#### Weeks 3–4: Telemetry & Onboarding (Medium Priority)
- [ ] **Telemetry ingestion** – Design JSON schema; implement `/api/telemetry` endpoint
- [ ] **Real-time subscriptions** – Supabase subscriptions on dashboard for live updates
- [ ] **Onboarding playbook** – Document roles, daily checklist, support escalation
- [ ] **Observability** – Add Sentry for error tracking; structured logging

**Deliverable:** First pilot customer deployed; telemetry flowing; dashboard showing live progress.

#### Weeks 5–6: Hardware & Iteration (Parallel)
- [ ] **Sander D1 prototype** – Basic motorized unit, manual grit-change, test pressure sensor
- [ ] **Dust system alpha** – Prototype HEPA enclosure; test airflow (not full performance testing yet)
- [ ] **Firmware skeleton** – Motor control, sensor readout, Bluetooth/WiFi uplink to server
- [ ] **Customer feedback** – Weekly calls with 2–3 pilot contractors; triage blockers

**Deliverable:** First D1 unit sends telemetry; dashboard logs first real job.

#### Weeks 7–8: Validation & Polish (Iteration)
- [ ] **100-job target** – Log at least 100 simulated + real jobs in Supabase
- [ ] **First-pass approval score** – Dashboard calculates coverage %, dust readings, approval status
- [ ] **Bug fixes & UX iteration** – Address customer feedback; fix crashes
- [ ] **Security audit** – Verify multi-tenant isolation; test data access controls

**Deliverable:** Pilot dashboard fully functional; pilot customers willing to continue (sign-up for next phase).

### Success Criteria (90 Days)

| Metric | Target | Evidence |
|--------|--------|----------|
| **Pilot customers recruited** | 3–5 signed | Completed onboarding forms + hardware assigned |
| **Dashboard up-time** | ≥ 99% | Sentry shows < 1% error rate; zero P0 incidents |
| **Jobs logged** | ≥ 50–100 | Mix of simulated jobs + 1–2 real Sander D1 runs |
| **Telemetry latency** | < 2 seconds | Real-time updates on dashboard within 2s of hardware log |
| **Customer satisfaction** | NPS ≥ 5 | Post-first-job survey; willingness to continue pilot |
| **Zero data loss** | 100% | All telemetry persists in Supabase; zero corruption |
| **Compliance ready** | T&Cs signed | Legal agreement in place; data sharing consents collected |

---

## 3. Safe Public Claims (Beta/Early Access)

### What CAN Be Said Publicly ✅

**Product vision & positioning:**
- "FloorForge is an autonomous hardwood floor refinishing operating system in early access."
- "We're building five purpose-designed robot platforms: sanding, edging, finishing, plank placement, and inspection."
- "The pilot program recruits early-adopter contractors to shape the product alongside us."
- "Hardware and software are in active development; all specifications are design targets subject to change."

**Feature claims (with caveats):**
- "The Sander D1 is designed to execute 36→80→120 grit sequences with consistent pressure, eliminating the inconsistency of manual sanding." (OK: clear "designed to" language)
- "The simulator shows how autonomous multi-grit sanding would work—a 3D exploration of design targets, not measured results." (OK: labeled as exploration)
- "Dust containment is built around HEPA filtration targeting 98% capture." (OK: "targeting" = aspirational)
- "The ROI calculator uses transparent assumptions: labor rate, time savings, throughput. Adjust them to your market—all outputs are estimates." (OK: explicitly labeled estimates)

**Market positioning:**
- "We're recruiting pilot customers from three segments: high-end residential, commercial office, and specialty wood types."
- "Pilot participants get preferential launch pricing and help shape the product."
- "The pilot runs 8–12 weeks; we measure dust performance, coverage consistency, and customer feedback in real jobs."

**Operational readiness:**
- "You can explore the simulator on floorforge.ai and join the pilot waitlist."
- "The interactive ROI calculator lets you model the economics on your typical job."
- "We're currently recruiting pilot contractors with 2,000–10,000 sqft/month volume; high-volume commercial operations are invited too."

### What MUST NOT Be Said ❌

| Claim | Why It's Forbidden | Consequence |
|-------|-------------------|-------------|
| "FloorForge robots are ready for deployment." | Hardware doesn't exist yet | Fraud; liability risk; pilot expectations shattered |
| "We've tested the Sander D1 on 50 real jobs." | Zero field deployments completed | Fabrication; data integrity risk |
| "Dust capture is 98% HEPA-certified." | Not tested; no third-party validation | False claim; regulatory violation |
| "Customers report 60% time savings." | No customer data collected; unvalidated | Fabrication; misleads contractor ROI expectations |
| "We have 10 pre-orders at $X per robot." | Pre-orders don't exist; pricing not final | Fraud; violates truthful advertising |
| "The edger works hands-free without oversight." | Design calls for human oversight mode; untested | Feature overstatement; safety liability |
| "Pricing is locked at $299/month base." | Pricing subject to change during pilot | Misleads customers about cost; erodes trust |
| "The dashboard integrates with QuickBooks / Stripe / Slack." | Integrations don't exist | False feature claim; customer frustration |
| "FloorForge is built by the EcoWoods team." | Separate product; distinct teams | Confusion about ownership; partnership misrepresentation |
| "Join the waitlist to pre-order hardware." | No pre-orders; waitlist is interest capture only | Sets false expectation; legal liability |

---

## 4. Recommended Copy & Structure Updates

### Landing Page (app/page.tsx)

**Current state:** Landing page is honest and well-written. No changes required.

**Existing good language to preserve:**
- "Early stage — pilot program forming" (hero badge)
- "Hardware and software are **in development**, all specifications are design targets" (README)
- "Design targets, not shipped specifications. Pilot feedback drives what gets built first." (tech highlights section)
- "Indicative pricing for the launch phase — subject to change as the pilot program defines the product." (pricing section)

**No changes needed.** The site is already calibrated correctly for an honest early-access positioning.

### Dashboard (`/dashboard`)

**Current state:** Displays hardcoded sample jobs labeled "Sample data."

**Recommended update:** Add a banner at top:
```
⚠️  This is a pilot-only interface. Features, data retention, and APIs are subject to change.
    Read the pilot T&Cs before sharing sensitive job information.
```

**Implementation:** One-line React component in the dashboard layout.

### WaitlistCTA Component

**Current state:** Collects name, email, company, monthly_sqft, interest. Good baseline.

**Recommended addition:** Add optional field "What is your primary challenge in floor refinishing today?" This feeds product discovery without requiring customers to add complexity. Purely optional; no validation.

**Implementation:** One additional textarea field in `WaitlistCTA.tsx`.

### Chatbot Component

**Current state:** Scripted assistant with good disclaimer ("This is a demo, not a real agent").

**Recommended update:** Add to opening message:
> "This is a scripted demo assistant based on our pilot program FAQ. For real questions, email hello@floorforge.ai or join the pilot waitlist."

**No code change required** if current messaging is already clear.

---

## 5. Technical Interfaces for Integration with EcoWoods

### Authentication & User Context

**Current:** Clerk optional integration (builds without it).

**For EcoWoods integration:**

```typescript
// lib/auth.ts — add after authEnabled check
interface User {
  id: string;           // UUID, unique per tenant
  email: string;
  name?: string;
  company?: string;
  role: "pilot_customer" | "admin" | "support";
  createdAt: string;    // ISO 8601
}

interface AuthContext {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}
```

EcoWoods can provide its own `AuthProvider` wrapping the FloorForge app, injecting `user` context via React Context. FloorForge app components consume `useAuth()` to get current user ID (used for Supabase RLS).

---

### Pilot / Interest Record Schema

**Minimal data shape for pilot interest tracking:**

```typescript
// types/pilot.ts
interface PilotApplication {
  id: string;               // UUID
  email: string;
  name: string;
  company: string;
  monthly_sqft_target: number;
  robot_interest: string;   // e.g. "sand" | "edge" | "coat" | null
  segment: string;          // "residential" | "commercial" | "specialty" | null
  location_state?: string;  // For regional targeting
  phone?: string;

  // Engagement & lifecycle
  source: string;           // "floorforge-site" | "ecowoods-referral" | "direct" | null
  status: "new" | "engaged" | "qualified" | "piloting" | "converted" | "declined";
  notes?: string;           // Internal sales notes
  
  // Timeline
  created_at: string;       // ISO 8601
  updated_at: string;
  pilot_start_date?: string;
  pilot_end_date?: string;
}
```

**Rationale:**
- `status` allows funnel tracking: how many "new" → "engaged" → "piloting"?
- `source` differentiates organic (floorforge-site) vs. EcoWoods referrals
- `robot_interest` captures if pilot wants to test Sander D1 specifically
- `segment` enables cohort analysis (do commercial operators churn less than residential?)

**Storage:** Supabase `pilot_applications` table; accessible via `/api/applications` (admin only) and `/api/applications/[id]` (self + admin).

---

### Status Values & State Machine

**Job status lifecycle:**

```typescript
type JobStatus =
  | "draft"          // Site scan captured, plan not finalized
  | "queued"         // Job approved; waiting for robot availability
  | "in_progress"    // Robot actively working on floor
  | "paused"         // Human intervention required (e.g., coverage gap detected)
  | "completed"      // Job finished; post-pass QA running
  | "approved"       // First-pass approval score ≥ threshold; ready for finish
  | "rework"         // Coverage failure or dust spike; needs re-do of pass
  | "failed"         // Job abandoned; data retained for analysis
  | "archived";      // Historical job; no further updates

type PassStatus =
  | "pending"        // Queued in grit sequence
  | "running"        // Robot actively sanding this grit
  | "checking"       // Post-pass QA scan (coverage map, dust readings)
  | "approved"       // Pass approved; move to next grit
  | "rework"         // Coverage gap or dust spike detected; re-run this pass
  | "failed";        // Pass failed permanently; move to rework protocol
```

**Rationale:**
- `paused` vs. `in_progress` distinguishes normal operation from problems
- `approved` vs. `completed` separates finish readiness from just-done state
- `rework` is explicit (not just a status flag) so customers understand what happened

---

### Basic Event Names for Telemetry Tracking

**Events sent from robot → `/api/telemetry`:**

```typescript
interface TelemetryEvent {
  job_id: string;
  robot_id: string;
  timestamp: string;     // ISO 8601
  event_type: string;
  data: Record<string, any>;
}

// Standard event_type values
type EventType =
  | "pass_started"       // { pass_number: 1, grit_tag: "36", ... }
  | "pass_completed"     // { pass_number: 1, coverage_pct: 99.2, duration_sec: 3600 }
  | "dust_reading"       // { ugm3: 12.5, location: "x:50%, z:30%" }
  | "coverage_gap"       // { location: "corner near window", area_m2: 0.3 }
  | "robot_paused"       // { reason: "low_battery" | "coverage_gap" | "manual" }
  | "robot_resumed"      // { from_event_id: "..." }
  | "finish_applied"     // { type: "seal" | "topcoat", film_build_um: 120 }
  | "quality_check"      // { approval_result: true | false, score: 92.1 }
  | "error"              // { code: string, message: string }
```

**Rationale:**
- Event-driven architecture; easy to extend with new event types
- `timestamp` at millisecond precision (nanoseconds overkill for floor sanding)
- `data` is flexible; schema validated per event_type in API handler

---

### Dashboard Data Access Patterns

**Queries that will power the EcoWoods-linked dashboard:**

```typescript
// Get all jobs for authenticated user's pilot account
GET /api/jobs?status=in_progress&limit=10&offset=0

// Response:
{
  jobs: [
    {
      id: "job-2847",
      site_name: "Meridian Tower Floor 12",
      sqft: 12500,
      robot_id: "FF-03A",
      status: "in_progress",
      current_pass: { pass_number: 1, grit_tag: "36", progress_pct: 67.2 },
      coverage_pct: 67.2,
      coverage_area_m2: 835,
      time_elapsed_sec: 1840,
      time_remaining_sec: 900,
      est_completion: "2026-08-02T16:45:00Z",
      dust_readings: [ { timestamp: "...", ugm3: 14.2 }, ... ],
      approval_score: null,  // Null until job completes
      created_at: "2026-08-02T14:00:00Z",
      updated_at: "2026-08-02T15:31:00Z"
    }
  ],
  total_count: 42,
  next_offset: 10
}

// Get single job with full telemetry
GET /api/jobs/job-2847

// Response includes:
{
  ... all fields from list,
  telemetry_events: [
    { timestamp: "...", event_type: "pass_started", data: { ... } },
    { timestamp: "...", event_type: "dust_reading", data: { ugm3: 14.2 } },
    ...
  ],
  post_job_report: {
    grit_sequence_executed: ["36", "80", "120"],
    total_coverage_area: 835,
    coverage_approval: true,
    first_pass_approval_score: 94.7,
    avg_dust_ugm3: 15.1,
    dust_peak_ugm3: 28.3,
    finish_type: null,  // Not applied yet
    photos: [ "s3://...", ... ],
    signed_by: null,  // Customer hasn't approved yet
    signed_at: null
  }
}
```

---

### Minimal Config for EcoWoods Integration

**When deploying FloorForge as a sub-product of EcoWoods:**

```env
# .env.local (EcoWoods Vercel account)

# Base URLs & origins
NEXT_PUBLIC_SITE_URL=https://floorforge.ecowoods.com
NEXT_PUBLIC_API_BASE=https://api.ecowoods.com

# EcoWoods parent auth context
NEXT_PUBLIC_ECOWOODS_TENANT_ID=eco-001
ECOWOODS_SHARED_SECRET=<shared signing key>

# Database (can be shared or separate; recommend separate for isolation)
NEXT_PUBLIC_SUPABASE_URL=https://...floorforge...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

# Observability
SENTRY_DSN=https://...
AXIOM_DATASET=floorforge-prod

# Optional: AI assistant (e.g., Claude API for chatbot)
NEXT_PUBLIC_ASSISTANT_ENABLED=true
```

---

## 6. Realistic Next Engineering Steps

### Immediate (Weeks 1–2)

1. **Implement Supabase schema** → Migrations + RLS policies
2. **Build API routes** → `/api/jobs`, `/api/telemetry`, basic auth
3. **Wire dashboard to real data** → Replace hardcoded jobs
4. **Write pilot T&Cs** → Legal review + e-signature flow

**Owner:** Backend engineer (1), frontend engineer (1)  
**Estimate:** 2 weeks  
**Blocker if missed:** Pilot customers can't log jobs; dashboard remains a mock.

### Short-term (Weeks 3–6)

5. **Real-time subscriptions** → Supabase subscriptions on dashboard
6. **Hardware telemetry contract** → JSON schema for robot uplink
7. **Observability** → Sentry + structured logging
8. **First hardware prototype** → Sander D1 breadboard (parallel workstream)

**Owner:** Backend engineer (1), hardware engineer (1), QA (0.5)  
**Estimate:** 4 weeks  
**Blocker if missed:** Can't log real telemetry; dashboard doesn't update live; hardware stuck on vague requirements.

### Medium-term (Weeks 7–12)

9. **Payment/subscription logic** → Stripe integration, billing lifecycle
10. **Customer admin panel** → Onboarding, site management, role assignment
11. **First field deployment** → Sander D1 at 1–2 pilot sites; measure real dust, coverage, time
12. **Iterate based on feedback** → Weekly customer calls; triage + prioritize

**Owner:** Fullstack team (2–3)  
**Estimate:** 6 weeks  
**Blocker if missed:** Can't monetize; can't manage pilot sites; hardware validation blocked.

---

## 7. Out of Scope (Explicitly, For Now)

| Item | Why | When? |
|------|-----|-------|
| **Mobile apps (iOS/Android)** | Web-first MVP; field app in phase 2 | Q2 2027 |
| **Third-party integrations** | Stripe, QuickBooks, Slack post-launch | Post-revenue |
| **Enterprise SSO/SAML** | Too early; Clerk basic auth sufficient | Q1 2027 |
| **Full audit logging** | Pilot doesn't need HIPAA/SOC2 yet | Pre-revenue |
| **Regulatory certifications** | CE, UL, OSHA validation in parallel with field pilots | Post-pilot |
| **Service network** | No parts, warranty, or repair yet | Post-launch |
| **International expansion** | English-only; US market focus initially | 2027+ |

---

## 8. Partnership Readiness with EcoWoods

### What FloorForge Offers to EcoWoods Customers

1. **A credible, honest beta** – Not vaporware; real software you can explore and test
2. **Clear ROI model** – Transparent assumptions; contractors can adapt to their market
3. **Pilot pathway** – Structured interest-capture → onboarding → feedback loop
4. **Differentiated offering** – None of EcoWoods' current competitors have autonomous sanding yet

### What EcoWoods Needs from FloorForge

1. **Product stability** – Dashboard doesn't crash; telemetry pipeline is reliable
2. **Clear messaging** – EcoWoods can confidently say "FloorForge is in pilot; join the waitlist" without fear of overpromise
3. **Data integration** – Pilot applications and telemetry flow cleanly into EcoWoods' CRM
4. **Support clarity** – Who handles pilot customer support: FloorForge or EcoWoods?

### Recommended Integration Model

**Option A: Soft Partnership (Recommended for First 90 Days)**
- FloorForge runs independently at `floorforge.ai`
- EcoWoods links to `/products/floorforge` with honest copy: "Coming Soon — Autonomous sanding, in pilot. Interested? Join the waitlist."
- Pilot applications flow to both FloorForge and EcoWoods CRM for nurture
- Support: FloorForge handles technical; EcoWoods handles relationship

**Option B: Tight Integration (Post-Pilot)**
- FloorForge dashboard accessible as `/app/floorforge` from EcoWoods login
- Single auth context (EcoWoods user → FloorForge tenant)
- Shared database (or federated query); EcoWoods sees all pilot telemetry
- Support: Unified under EcoWoods support team

**Recommendation:** Start with Option A; migrate to Option B once pilot validates the product.

---

## 9. Success Metrics for Product Alignment

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Copy consistency** | 100% | Audit: no claims in site + EcoWoods that contradict "design targets, not shipped" |
| **Pilot recruitment** | 3–5 customers signed | Signed onboarding forms + T&Cs |
| **Dashboard reliability** | 99%+ uptime | Sentry SLA; < 1 error per 1000 requests |
| **Data accuracy** | 100% integrity | Zero lost telemetry; Supabase audit logs show no drops |
| **Customer trust** | NPS ≥ 5 | Post-first-job survey after pilot; willingness to continue |
| **Integration readiness** | EcoWoods can link confidently | Copy approved; pilot interest data flows to EcoWoods CRM |

---

## Appendix: Honest Messaging Template

When EcoWoods promotes FloorForge, use this template:

### Headline
> "Autonomous Hardwood Floor Refinishing — Coming to EcoWoods"

### Subheading
> "FloorForge is an operating system for multi-grit sanding, edging, and finishing, currently in pilot. Interested contractors help shape the product and get preferential launch pricing."

### Body
> FloorForge combines autonomous robotics with real-time dust containment and quality reporting — designed to cut labor time and eliminate callback-causing inconsistency. Right now, it exists as a concept: five purpose-built platforms in active development, interactive simulators you can explore, and a transparent ROI model.
>
> **We're recruiting 5–10 pilot customers** to test the first units, validate dust performance and coverage consistency on real floors, and help us iterate the product.
>
> All specifications are design targets. Hardware doesn't ship yet. Pricing is indicative and will change. But if you're a hardwood refinishing crew who wants a seat at the table—and you're willing to log your results so we build the right thing—the pilot is open.

### CTA
> [Join the FloorForge Pilot →](https://floorforge.ai/#waitlist)

### Tone
- **Honest.** No hype. Use "design targets," "in development," "pilot," "estimates."
- **Credible.** Reference real specs (grit sequences, coverage rates) with caveat language.
- **Action-oriented.** Emphasize partnership, not purchase; data, not promises.

---

## Sign-Off

**Prepared by:** FloorForge Technical & Product Team  
**Date:** August 2, 2026  
**Status:** Ready for pilot launch  
**Next review:** October 2, 2026 (post-pilot completion)

This document is the source of truth for public claims, internal alignment, and integration planning. Update it as the pilot progresses.
