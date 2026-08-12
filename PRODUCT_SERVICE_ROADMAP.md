# FloorForge Product & Service Roadmap

**Date:** August 3, 2026  
**Edition:** 0.1.0 – 12-Month Horizon  
**Audience:** FloorForge team, partners, pilot stakeholders  
**Status:** Working roadmap; subject to pilot feedback

---

## Executive Summary

This roadmap ranks engineering work into **three phases** (Pilot, Expansion, Launch) across **software and hardware tracks running in parallel**. The primary commitment is **pilot success by week 12** (October 25, 2026). All timelines include risk buffers; dates are targets, not guarantees.

**Core principle:** Ship what is minimally viable for pilots to generate feedback, not what is perfect for future customers.

---

## Phase Overview

| Phase | Period | Focus | Success Metric |
|-------|--------|-------|-----------------|
| **Phase 1: Pilot** | Aug 3 – Oct 25 (12 weeks) | Recruit 3–5 contractors; validate ForgeSand D1 hardware + dashboard | NPS ≥ 5; zero critical data loss; 100+ jobs logged |
| **Phase 2: Expand** | Oct 26 – Jan 31 (14 weeks) | Add edger, finisher; scale to 5–10 contractors; measure ROI claims | Contractors report ≥ 50% time savings; extend 4+ months |
| **Phase 3: Launch** | Feb 1 – Aug 31 (7 months) | Production hardware; public pricing; supply chain go-live | Ship 10+ units; first revenue; partnerships active |

---

## Phase 1: Pilot (Weeks 1–12)

### 1A. Software Track (Critical Path)

All items are **blocking** for pilot to start. Parallel work by frontend + backend team.

#### Week 1–2: Foundation (Do First)

| Feature | Owner | Priority | Status | Blocker? |
|---------|-------|----------|--------|----------|
| **Supabase schema deployment** | Backend | P0 | ✅ Done (migrations ready) | Yes |
| **API routes (applications, jobs, telemetry)** | Backend | P0 | ✅ Done (5 endpoints ready) | Yes |
| **Dashboard wired to real data** | Frontend | P0 | 🟡 In progress (mock → live) | Yes |
| **Pilot T&Cs drafted + legal review** | Product | P0 | 🟡 In progress | Yes |
| **Support runbook (escalation, weekly sync)** | Product | P0 | 🟡 In progress | Medium |
| **Error monitoring setup (Sentry)** | DevOps | P1 | 🟡 In progress | Medium |
| **Database backups + recovery test** | DevOps | P1 | 🟡 In progress | Medium |

**Deliverable:** Pilot customers can log in, create jobs, see real-time data flowing.

**Risk:** Scope creep on dashboard (only ship what pilots need; leave analytics for later).

---

#### Week 3–4: Pilot Support (Enable Onboarding)

| Feature | Owner | Priority | Status | Blocker? |
|---------|-------|----------|--------|----------|
| **Multi-tenant isolation verification** | Backend | P0 | 🟡 In progress | High |
| **JWT auth middleware** | Backend | P1 | 🔴 Not started | Medium |
| **Dashboard user provisioning** | Frontend | P1 | 🟡 Partial | Medium |
| **Telemetry schema + validation** | Backend | P1 | ✅ Done (JSONB flexible) | Medium |
| **Real-time subscription API** | Backend | P2 | 🔴 Not started | Low |
| **Pilot onboarding video** | Product/Video | P1 | 🟡 Scripted | Medium |
| **FAQ + troubleshooting guide** | Product | P1 | 🟡 In progress | Medium |

**Deliverable:** First pilot contractor can log a full job; telemetry flows; dashboard updates live.

**Risk:** Underestimating video production time (plan 1 week); real-time subscriptions are nice-to-have (HTTP polling OK if WebSocket takes time).

---

#### Week 5–12: Iteration & Stability (Run Pilots)

| Feature | Owner | Priority | Status | Blocker? |
|---------|-------|----------|--------|----------|
| **Bug fixes from pilot feedback** | Full team | P0 | 🔴 TBD | High |
| **Dashboard performance optimization** | Frontend | P1 | 🔴 Not started | Medium |
| **Observability dashboard (Sentry, logs)** | DevOps | P1 | 🟡 In progress | Medium |
| **Telemetry data export (CSV)** | Backend | P2 | 🔴 Not started | Low |
| **Contractor self-service reset password** | Frontend | P2 | 🔴 Not started | Low |
| **Mobile dashboard (responsive CSS)** | Frontend | P2 | 🟡 Responsive; unpolished | Low |

**Deliverable:** 50–100 jobs logged; zero data loss; < 1 error per 1000 requests; pilot can operate independently for 4+ hours.

**Risk:** Bugs discovered during week 6–8 field tests; plan 3-day turnaround for critical fixes.

---

#### Success Criteria (Week 12 Gate)

- ✅ Dashboard uptime ≥ 99%
- ✅ Telemetry ingestion 100% success rate
- ✅ 0 incidents of data loss or corruption
- ✅ Pilot contractors can fully self-serve (no FloorForge engineer needed to create job)
- ✅ Post-first-job NPS survey yields ≥ 5 responses per contractor

**If missed:** Extend phase 1 by 2–4 weeks; do not advance to phase 2.

---

### 1B. Hardware Track (Parallel)

Runs concurrently with software; hardware is **not blocking** the dashboard and API to launch, but delays pilot onboarding.

#### Week 1–2: Sourcing & Design Finalization

| Component | Owner | Priority | Status | Note |
|-----------|-------|----------|--------|------|
| **Supplier quotes (motor, wheels, pressure sensor)** | Hardware | P0 | 🟡 In progress | 3–4 quotes each |
| **Component procurement** | Hardware | P0 | 🟡 Waiting on approval | Budget check |
| **Assembly manual draft** | Hardware | P1 | 🟡 In progress | For pilot onboarding |
| **Breadboard testbed (non-final form)** | Hardware | P1 | 🟡 In progress | Validate motor control |

**Deliverable:** All components ordered; assembly area set up; motor control firmware skeleton started.

**Risk:** Lead times on pressure sensor (4–6 weeks from order). Order by end of week 2 or slip to week 4.

---

#### Week 3–4: Breadboard Assembly & Motor Control

| Component | Owner | Priority | Status | Note |
|-----------|-------|----------|--------|------|
| **Motor + controller assembly** | Hardware | P0 | 🟡 In progress | Manual grit change OK for MVP |
| **Pressure sensor calibration** | Hardware | P0 | 🟡 In progress | ±10% accuracy acceptable |
| **Bluetooth telemetry module** | Hardware | P1 | 🟡 In progress | ESP32 or similar |
| **Firmware skeleton (motor on/off, sensor readout)** | Firmware | P0 | 🟡 In progress | JSON telemetry to /api/telemetry |
| **Safety e-stop circuit** | Hardware | P0 | 🟡 In progress | Mechanical kill switch |

**Deliverable:** Breadboard runs for 15 min without overheating; sensor logs 5 telemetry events/sec; e-stop works.

**Risk:** Pressure sensor noise (typical: ±5% reading jitter); filter in firmware if needed.

---

#### Week 5–6: Integration & First Test

| Component | Owner | Priority | Status | Note |
|-----------|-------|----------|--------|------|
| **Dust enclosure prototype (non-final)** | Hardware | P1 | 🔴 Not started | HEPA filter mock-up |
| **Telemetry uplink to dashboard** | Firmware/Backend | P0 | 🟡 In progress | End-to-end: robot → /api/telemetry → dashboard |
| **Firmware logging (job ID, pass #, coverage %)** | Firmware | P0 | 🟡 In progress | Dashboard consumes these fields |
| **First bench test (4+ hour run)** | Hardware | P0 | 🟡 In progress | Logs data; no robot failures |
| **Safety review (mechanical, electrical)** | Hardware | P1 | 🟡 In progress | Identify pinch points, hot surfaces |

**Deliverable:** ForgeSand D1 breadboard runs 4+ hours; logs telemetry; dashboard displays live progress.

**Risk:** First multi-hour run often reveals thermal issues (plan for iteration week 6 if needed).

---

#### Week 7–10: Enclosure & Field Prep

| Component | Owner | Priority | Status | Note |
|-----------|-------|----------|--------|------|
| **Dust enclosure finalized** | Hardware | P0 | 🔴 Not started | HEPA filter installed; seal tested |
| **Wheel wear testing** | Hardware | P1 | 🔴 Not started | Simulate 8-hour floor run |
| **Firmware tuning (pressure, coverage algorithm)** | Firmware | P1 | 🟡 Placeholder | Based on bench test feedback |
| **Consumable supply logistics** | Hardware | P1 | 🔴 Not started | Sandpaper, dust bags, spare parts |
| **Operator manual draft** | Hardware | P1 | 🔴 Not started | For contractor onboarding |
| **Unit 1 (ForgeSand D1) field-ready** | Hardware | P0 | 🔴 In progress | Cleaned, tested, ready to ship |

**Deliverable:** First ForgeSand D1 unit field-ready (or nearly); shipped to first pilot contractor by end of week 7.

**Risk:** Enclosure seal leaks (common); budget 1 week for re-design if needed.

---

#### Week 11–12: Field Deployment & Feedback

| Component | Owner | Priority | Status | Note |
|-----------|-------|----------|--------|------|
| **Unit shipped to pilot contractor** | Hardware | P0 | 🔴 Not started | Week 7–8 target |
| **Remote onboarding call** | Product | P0 | 🔴 Not started | 2-hour kickoff |
| **First job logged (recorded for case study)** | Product | P0 | 🔴 Not started | Capture metrics, photos, feedback |
| **Contractor feedback loop** | Product | P0 | 🔴 Not started | Weekly sync; bug reports → firmware updates |
| **Iterate firmware** | Firmware | P1 | 🔴 Not started | Pressure tuning, coverage improvements |

**Deliverable:** ≥ 1 contractor has run ≥ 3 jobs; reported feedback; unit operational.

**Risk:** Contractor unable to use hardware due to safety concerns or operator error; plan for onsite visit if needed.

---

#### Success Criteria (Week 12 Gate)

- ✅ ForgeSand D1 breadboard runs 40+ hours without critical failure
- ✅ Telemetry captured for every job; 100% data integrity
- ✅ Contractor safely operates unit (no incidents)
- ✅ Coverage maps are ≥ 70% accurate (rough measurement vs. visual inspection)
- ✅ Dust readings correlate with visible dust levels (qualitative confirmation)

**If missed:** 
- Hardware still not ready → Extend pilot with simulator-only (dashboard, no physical robot)
- Hardware unsafe → Halt; pivot to phase 1.5 (design review + safety iteration)

---

## Phase 2: Expand (Weeks 13–26, Oct 26 – Jan 31)

### 2A. Software Track

#### Week 13–14: Edger Support (Backend)

| Feature | Owner | Priority | Note |
|---------|-------|----------|------|
| **Edger telemetry schema** | Backend | P0 | Similar to Sander; edge-specific events |
| **API support for multi-robot jobs** | Backend | P0 | Dashboard shows sander + edger in sequence |
| **Job sequencing logic** | Backend | P1 | Auto-transition from sand pass → edge pass |

#### Week 15–18: Analytics & Reporting (Pull from Phase 3 if Time-Constrained)

| Feature | Owner | Priority | Note |
|---------|-------|----------|------|
| **Aggregate query layer** | Backend | P1 | Summary: hours saved, sqft sanded, dust avg |
| **Contractor ROI calculator** | Backend | P1 | Pulls real data; updates from live telemetry |
| **Export reports (PDF, CSV)** | Frontend | P1 | For contractor use in their own accounting |

#### Week 19–26: Iteration & Scale

| Feature | Owner | Priority | Note |
|---------|-------|----------|------|
| **Multi-robot fleet management** | Backend | P1 | Track 3+ units per contractor |
| **Scheduler skeleton (non-optimized)** | Backend | P2 | Route jobs to available robots |
| **Payment processing (Stripe)** | Backend | P2 | Billing for pilot → paid pilot transition |

**Success Criteria (Week 26 Gate):**
- ✅ Edger telemetry integrated into dashboard
- ✅ 5–10 contractors running Sander + Edger in sequence
- ✅ Real-time ROI data (labor hours saved) visible to contractors
- ✅ Zero telemetry loss across 3+ robots

---

### 2B. Hardware Track

#### Week 13–14: ForgeEdge E1 Prototype Assembly

| Component | Owner | Priority | Note |
|-----------|-------|----------|------|
| **Design finalization** | Hardware | P0 | Based on ForgeSand D1 feedback |
| **Pressure sensor for edge work** | Hardware | P0 | ±15% tolerance acceptable (edges more forgiving) |
| **Proximity sensor for wall detection** | Hardware | P1 | Infrared or ultrasonic |
| **Component sourcing & procurement** | Hardware | P0 | ~80% overlap with Sander BOM |

#### Week 15–18: Breadboard Testing & Iteration

| Component | Owner | Priority | Note |
|-----------|-------|----------|------|
| **Motor control on edge geometry** | Hardware | P0 | Validate pressure under edge constraints |
| **Proximity detection accuracy** | Hardware | P0 | Must not jam into walls |
| **Firmware (edge-specific telemetry)** | Firmware | P0 | Edge-pass-specific events |
| **4+ hour bench test** | Hardware | P0 | Log telemetry; measure failures |

#### Week 19–22: Enclosure & Field Prep

| Component | Owner | Priority | Note |
|-----------|-------|----------|------|
| **Dust enclosure for edger** | Hardware | P1 | Capture edge dust (trickier than main) |
| **ForgeCoat C1 Prototype** | Hardware | P2 | Parallel; spray/roll mechanism |
| **Unit 2 & 3 (if demand)** | Hardware | P1 | ForgeSand D1 copies; scale manufacturing |

#### Week 23–26: Field Deployment

| Component | Owner | Priority | Note |
|-----------|-------|----------|------|
| **Edger unit shipped to pilot contractor** | Hardware | P0 | After sanding success |
| **Sander + Edger in sequence (first time)** | Product | P0 | Capture metrics, feedback |
| **ForgeCoat C1 prototype test (if ready)** | Hardware | P1 | Parallel track; validate spray mechanism |

**Success Criteria (Week 26 Gate):**
- ✅ Edger runs 4+ jobs; contractor reports positive feedback
- ✅ Sander + Edger workflow is seamless (< 10 min transition time)
- ✅ Combined labor savings (sand + edge) visible in ROI data
- ✅ 5–10 contractors active; none churned

---

## Phase 3: Launch (Months 7–13, Feb – Aug 2027)

### 3A. Software Track

#### Feb – Mar: Payment & Subscription

| Feature | Owner | Priority | Note |
|---------|-------|----------|------|
| **Stripe integration** | Backend | P0 | Monthly billing per robot |
| **Subscription lifecycle** | Backend | P0 | Pause, cancel, upgrade |
| **Invoice generation & email** | Backend | P1 | Automatic; contractor-downloadable |
| **Usage-based charges** (if applicable) | Backend | P2 | Telemetry overage pricing |

#### Apr – May: Mobile & Integrations

| Feature | Owner | Priority | Note |
|-----------|-------|----------|------|
| **Mobile app (iOS/Android)** | Frontend | P1 | React Native or Flutter |
| **QuickBooks Online integration** | Backend | P2 | Sync jobs → QB projects |
| **Slack notifications** | Backend | P2 | Job start/end alerts |

#### Jun – Aug: Scale & Optimization

| Feature | Owner | Priority | Note |
|-----------|-------|----------|------|
| **Database performance tuning** | Backend | P1 | Support 100+ robots, 10K+ jobs/month |
| **CDN for telemetry (edge compute)** | DevOps | P2 | Reduce latency for distributed contractors |
| **Analytics dashboard (internal)** | Backend | P1 | Aggregate churn, satisfaction, costs |
| **SOC2 Type I audit** | Compliance | P1 | Start early; complete by launch |

**Success Criteria:**
- ✅ First paying customers on monthly subscriptions
- ✅ < 500ms dashboard load time (P95)
- ✅ Zero unplanned downtime (4 9s)
- ✅ SOC2 Type II audit underway

---

### 3B. Hardware Track

#### Feb – Apr: Production Design & Supplier Qualification

| Component | Owner | Priority | Note |
|-----------|-------|----------|------|
| **Design for manufacturing (DFM)** | Hardware | P0 | Simplify for mass production |
| **Supplier selection (motor, wheels, frame)** | Procurement | P0 | 3–5 year partnership; volume pricing |
| **Tooling & mold quotes** | Hardware | P0 | Custom wheel, frame injection molds |
| **Supply chain risk mitigation** | Procurement | P1 | Dual-source critical components |

#### May – Jun: Production Units & Certification

| Component | Owner | Priority | Note |
|-----------|-------|----------|------|
| **First production run (10 units)** | Manufacturing | P0 | ForgeSand D1 + ForgeEdge E1 |
| **CE / UL certification** | Compliance | P0 | Safety & EMC testing |
| **Field service manual** | Hardware | P1 | Technician repair guide |
| **Warranty policy** | Product | P1 | 1-year parts + labor? |

#### Jul – Aug: Scale & Launch

| Component | Owner | Priority | Note |
|-----------|-------|----------|------|
| **ForgeCoat C1 first units** | Manufacturing | P1 | If demand; else defer 2027 |
| **Parts inventory & logistics** | Supply Chain | P1 | Replacement motors, wheels, dust bags |
| **Service network** (regional partnerships) | Business Dev | P2 | Authorized repair centers |
| **Go-live: public pricing + pre-orders** | Product | P0 | Marketing site live |

**Success Criteria:**
- ✅ 10 units in field (mix of pilot + early customers)
- ✅ CE mark obtained; UL underway
- ✅ $0 customer acquisition cost (pre-orders)
- ✅ Manufacturing cost < 40% of MSRP (healthy margin)

---

## Cross-Cutting Concerns (All Phases)

### Observability & Data

| Track | Week 1–12 | Week 13–26 | Month 7–13 |
|-------|-----------|-----------|-----------|
| **Error tracking** | Sentry basic | Sentry + custom dashboards | Sentry + incident response SLA |
| **Database backups** | Daily automated | Geo-redundant backups | 15-min RPO, 1-hour RTO |
| **Telemetry logging** | JSON to Supabase | Aggregate queries | Data warehouse (BigQuery?) |
| **Customer support** | Email + weekly calls | Ticketing (Zendesk?) | Dedicated support agent |

### Security & Compliance

| Track | Week 1–12 | Week 13–26 | Month 7–13 |
|-------|-----------|-----------|-----------|
| **Authentication** | Clerk basic | Multi-factor (TOTP) | SSO for enterprise customers |
| **Data privacy** | Privacy policy live | GDPR audit | SOC2 Type II; HIPAA if needed |
| **Penetration testing** | Internal only | Third-party security audit | Annual + incident-driven |

### Documentation & Support

| Track | Week 1–12 | Week 13–26 | Month 7–13 |
|-------|-----------|-----------|-----------|
| **Operator manuals** | Wikis + videos | PDF + printed (for field) | Multi-language |
| **API documentation** | OpenAPI spec | Interactive (Swagger UI) | SDK (Node.js, Python) |
| **Knowledge base** | FAQ | Community forum | Chatbot (AI-powered?) |
| **Support hours** | Business hours + emergency | 24/5 (email, phone) | 24/7 (for high-tier customers) |

---

## Resource Plan

### Phase 1 (Pilot, 12 Weeks)

**Full-time equivalents (FTE):**
- Backend engineer: 1 FTE (API + database)
- Frontend engineer: 0.5 FTE (dashboard wiring, minimal new features)
- Hardware engineer: 1.5 FTE (breadboard, firmware, integration)
- Firmware engineer: 0.5 FTE (motor control, telemetry)
- Product manager: 0.5 FTE (prioritization, contractor comms)
- DevOps: 0.25 FTE (infrastructure, backups)
- QA/Testing: 0.25 FTE (API testing, integration)

**Total: ~4.5 FTE**

**Budget estimate:** ~$80K (salaries + equipment + cloud)

---

### Phase 2 (Expand, 14 Weeks)

**Addition/changes:**
- Add: 0.5 FTE hardware engineer (Edger development)
- Add: 0.5 FTE customer support (escalation, pilot feedback)
- Reduce: Frontend to 0.25 FTE (maintenance only)

**Total: ~5 FTE**

**Budget estimate:** ~$90K

---

### Phase 3 (Launch, 7 Months)

**Addition/changes:**
- Add: 1 FTE product/marketing (go-to-market, sales)
- Add: 0.5 FTE compliance (SOC2, certifications)
- Add: 1 FTE operations/supply chain
- Reduce: Hardware engineer focus (on-demand consulting)

**Total: ~7 FTE**

**Budget estimate:** ~$140K + manufacturing tooling ($20–50K)

---

## Risk Register

### High-Risk Items (Phase 1)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **Hardware not ready by week 7** | Medium | High | Start hardware day 1; order components week 1; accept breadboard for field test |
| **Contractor drop-out (churn)** | Low | High | Recruit 5 to lose 1–2; weekly check-ins; rapid issue response |
| **Database data loss** | Low | Critical | Automated daily backups; test recovery weekly |
| **Dashboard crashes under load** | Medium | Medium | Load testing week 3; caching strategy; queue for async jobs |
| **Telemetry sensor inaccuracy** | Medium | Medium | Calibrate week 5; accept ±10% error; validate manually |

### Medium-Risk Items (Phase 2)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **Edger design complexity** | Medium | Medium | Reuse Sander BOM; simplify vs. perfect; iterate on feedback |
| **Manufacturing scaling** | Medium | Medium | Supplier quotes by end of phase 1; dual-source components |
| **Contractor NPS stalls** | Low | Medium | Monthly satisfaction surveys; product roadmap transparency |

### Low-Risk Items (Phase 3)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **Market adoption slower than predicted** | Medium | Medium | Lower MSRP; increase pilot to 10 contractors; extend launch |
| **Regulatory delays (CE mark)** | Low | High | Start audit month 5; use notified body with fast-track option |

---

## Dependency Map

```
Phase 1:
  Dashboard API (Week 1-2) ─┬─→ Pilot recruiting (Week 2-3)
  Database schema (Week 1-2) ┘
  
  Hardware breadboard (Week 3-4) ──→ Telemetry integration (Week 5-6)
  Firmware skeleton (Week 3-4) ───┘
  
  ForgeSand D1 field unit (Week 7) ──→ Contractor onboarding (Week 7-8)
  Dashboard live (Week 1-2) ───────┘

Phase 2:
  ForgeSand D1 feedback (Week 12) ──→ Edger design refinement
  Sander success metrics (Week 12) ┘
  
  Edger breadboard (Week 13-14) ──→ Edger field test (Week 23-26)
  Edger firmware (Week 15-18) ────┘

Phase 3:
  Phase 2 success (Week 26) ──→ Production design (Feb-Apr)
  ↓
  Supplier quotes (Feb-Apr) ──→ Manufacturing (May-Jun)
  ↓
  Certifications (May-Jun) ──→ Public launch (Aug)
```

---

## Success & Failure Modes

### Success Path

1. ✅ Week 12: Pilot has 3–5 active contractors, NPS ≥ 5, zero data loss
2. ✅ Week 26: Edger adds 40% more labor savings; contractors extend 4+ months
3. ✅ Month 7: Production units manufactured; CE mark obtained; revenue-positive

**Next: Scale to 20–50 contractors by end of 2027; expand to 3+ platforms**

### Failure Path 1: Hardware Delays

- Week 12: Hardware not field-ready
- **Pivot:** Continue pilot with simulator-only (dashboard, no robot); measure interest
- Week 26: Hardware still delayed
- **Decision:** Either (a) pivot to SaaS-only product (planning software only), or (b) push hardware to 2027 Q2

### Failure Path 2: Low Adoption

- Week 26: Only 1–2 active contractors (churn or low interest)
- **Decision:** (a) Refocus on different customer segment (commercial vs. residential), (b) lower price/value proposition, or (c) pivot to B2B2C (partner with floor distributors)

### Failure Path 3: Data Loss / Outage

- Week X: Customer data lost or dashboard down > 24 hours
- **Recovery:** Restore from backup (< 1 hour); communicate transparency; compensate if pilot
- **Outcome:** Delay launch if data integrity doubted; rebuild customer trust

---

## Success Metrics by Phase

### Phase 1 (Pilot) – Success Checkpoints

| Checkpoint | Target | Metric |
|-----------|--------|--------|
| **Week 4** | Backend live, telemetry flowing | Zero API 500 errors in 100 requests |
| **Week 8** | ForgeSand D1 running 20+ hours | Unit uptime ≥ 90% |
| **Week 12** | Pilot customers active | NPS ≥ 5; 3–5 signed; 100+ jobs logged |

### Phase 2 (Expand) – Success Checkpoints

| Checkpoint | Target | Metric |
|-----------|--------|--------|
| **Week 18** | Edger breadboard tested | Motor control + sensor working; 4+ hours uptime |
| **Week 22** | Dashboard supports 3+ robots | No latency increase; data integrity 100% |
| **Week 26** | 5–10 active contractors | None churned; average 8 jobs/contractor |

### Phase 3 (Launch) – Success Checkpoints

| Checkpoint | Target | Metric |
|-----------|--------|--------|
| **Month 8 (Mar)** | Payment pipeline live | First $X revenue from 1–3 paying customers |
| **Month 10 (May)** | Manufacturing ready | 10 units produced; cost per unit < budget |
| **Month 13 (Aug)** | Public launch | CE mark obtained; public pricing live; 5+ pre-orders |

---

## Approval & Ownership

| Role | Name | Approval | Date |
|------|------|----------|------|
| **CTO / Engineering Lead** | [Name TBD] | ☐ Approved | ___ |
| **Product Manager** | [Name TBD] | ☐ Approved | ___ |
| **Hardware Lead** | [Name TBD] | ☐ Approved | ___ |
| **Finance / Ops** | [Name TBD] | ☐ Approved | ___ |

---

## Appendix: Terminology

**Phase:** Major timeline block (Pilot, Expand, Launch)

**Sprint:** 2-week engineering cycle (6 per phase)

**P0 (Critical):** Blocking pilot success; ship or delay pilot

**P1 (High):** Important; nice-to-have in pilot; OK to defer 2 weeks

**P2 (Medium):** Can defer to phase 2; improves but not required

**Breadboard:** Non-final prototype; validates core concept; not for customer use

**Field-ready:** Tested enough for contractor use; acceptable uptime ≥ 90%

**Pilot-operable:** Customer can fully use service with <1% FloorForge support overhead

---

## Revision History

| Date | Edition | Changes |
|------|---------|---------|
| Aug 3, 2026 | 0.1.0 | Initial draft; pilot-focused roadmap |

---

**Next Review:** October 3, 2026 (end of Phase 1 with pilot feedback integration)

**Questions?** See **PRODUCT_SERVICE_DEFINITION.md** for service scope, or **BACKEND_SKELETON_REPORT.md** for API details.

---

**Prepared by:** FloorForge Product & Engineering  
**Status:** Working roadmap; approved for pilot execution  
**Confidentiality:** Internal use only (shared with pilot partners under NDA)
