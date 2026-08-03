# Software-Hardware Contract: Sander D1 Pilot Interface

**Date:** August 3, 2026  
**Edition:** 0.1.0  
**Scope:** Sander D1 pilot platform only  
**Audience:** Firmware team, software backend team, hardware lead  
**Status:** Working specification; subject to mutual refinement weeks 3–6

---

## Executive Summary

This document defines the **minimum viable telemetry contract** between Sander D1 firmware and FloorForge software backend for the pilot phase. It specifies:

1. **What telemetry the software expects** (event types, JSON schemas, timing)
2. **What job status signals the firmware must emit** (job lifecycle states)
3. **What is in scope** (achievable in first 12 weeks)
4. **What is explicitly out of scope** (deferred to phase 2+)
5. **How to test end-to-end** (validation checklist)

**Goal:** Firmware and software teams can develop in parallel with clear, testable contracts. No surprises on integration day (week 5–6).

---

## Part 1: Scope & Responsibilities

### What Sander D1 Firmware Must Do

**In scope:**

- ✅ Receive job parameters via API or BLE (JSON, firmware parses locally)
- ✅ Turn motor on/off and log start/stop timestamps
- ✅ Log pressure sensor readings at configurable interval (default: 1 Hz)
- ✅ Log grit transition events (change from 36 → 80, 80 → 120)
- ✅ Calculate and log coverage area (via encoder wheel distance traveled)
- ✅ Emit telemetry events over WiFi/BLE to `/api/telemetry` endpoint
- ✅ Handle HTTP 202 (async acceptance) and retransmit on 5xx
- ✅ Support manual pause/resume via hardware e-stop or BLE command
- ✅ Log errors (motor jam, sensor disconnect, low battery) with severity level

**Out of scope (Phase 1 pilot):**

- ❌ Automatic grit changing (manual only; contractor handles consumable swap)
- ❌ Computer vision for coverage verification (pressure + encoder only)
- ❌ Autonomous obstacle detection (human operator guides unit)
- ❌ Real-time optimization of pressure/speed (fixed preset per grit)
- ❌ Wireless firmware updates (USB cable only for now)
- ❌ GPS/IMU-based positioning (encoder odometry sufficient for pilot)

### What Software Backend Must Do

**In scope:**

- ✅ Accept telemetry POST from firmware with JWT auth
- ✅ Validate and store events in Supabase (100% durability)
- ✅ Emit job status changes (in_progress, paused, completed) to frontend
- ✅ Provide job parameters API (grit sequence, target coverage) for firmware to fetch
- ✅ Generate post-job report (coverage %, dust avg, pass-by-pass telemetry)
- ✅ Support pause/resume commands (firmware polls or receives via BLE)

**Out of scope (Phase 1 pilot):**

- ❌ Real-time hardware control loops (no closed-loop pressure adjustment)
- ❌ Predictive maintenance (maintenance logic deferred to phase 2)
- ❌ Fleet scheduling/dispatch (all job assignment is manual in pilot)
- ❌ Multi-robot coordination (single robot per contractor in pilot)

---

## Part 2: Telemetry Event Schema

### 2.1 Overview

**Transport:** HTTP POST to `https://api.floorforge.ai/api/telemetry` (or `http://localhost:3000` for dev)

**Authentication:** `Authorization: Bearer <JWT_TOKEN>`

**Rate:** 1–5 events/second (batching acceptable; individual events OK)

**Durability:** Software responds 202 Accepted; firmware may retry on 5xx; software guarantees 100% durability (automatic backups)

---

### 2.2 Event Envelope (Wrapper for All Events)

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T19:30:15.123Z",
  "event_type": "pass_started",
  "data": {}
}
```

**Field definitions:**

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-----------|-------|
| `device_id` | string | ✅ Yes | UUID or `FF-S[0-9]{3}` (Sander 001–999) | Unique per robot; set at firmware init |
| `job_id` | string | ✅ Yes | UUID or `job-[0-9]{4,}` | Provided by software in job parameters |
| `timestamp` | ISO 8601 | ✅ Yes | UTC, millisecond precision (`.123Z`) | Firmware local time; software trusts it for ordering |
| `event_type` | enum | ✅ Yes | One of: `pass_started`, `pass_completed`, `dust_reading`, `pressure_reading`, `coverage_checkpoint`, `error`, `job_paused`, `job_resumed` | Lowercase, underscores |
| `data` | object | ✅ Yes (may be `{}`) | Type depends on `event_type` | Schema defined per event type below |

**Validation rules:**
- `timestamp` must be within ±5 minutes of server time (detect drift)
- `job_id` must match current job (prevent cross-job telemetry)
- `event_type` must be recognized (reject unknown types)

---

### 2.3 Event Type Schemas

#### `pass_started`

Emitted when firmware begins a sanding pass (grit sequence step).

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T19:30:15.123Z",
  "event_type": "pass_started",
  "data": {
    "pass_number": 1,
    "grit_tag": "36",
    "target_coverage_area_m2": 50.0,
    "estimated_duration_sec": 3600
  }
}
```

**Field definitions:**

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pass_number` | integer | ≥ 1 | First grit = 1, second = 2, etc. |
| `grit_tag` | string | "36" \| "80" \| "120" | Sandpaper grit size (hardcoded for pilot) |
| `target_coverage_area_m2` | float | > 0 | From job parameters; estimated floor area |
| `estimated_duration_sec` | integer | > 0 | Firmware estimate based on speed model (can be rough) |

**Frequency:** Once per grit change (3 times per job for 36→80→120)

**Software action:** Create pass record; start timer; update UI ("Pass 1 of 3: 36 grit")

---

#### `pressure_reading`

Emitted regularly during sanding to log motor pressure / load.

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T19:30:45.234Z",
  "event_type": "pressure_reading",
  "data": {
    "psi": 3.2,
    "sensor_health": "ok"
  }
}
```

**Field definitions:**

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `psi` | float | 0.0–10.0 | Pressure in PSI; 0 = motor off, 2–5 = typical sanding |
| `sensor_health` | enum | "ok" \| "degraded" \| "error" | "degraded" = reading noisy; "error" = disconnect |

**Frequency:** 1 Hz (once per second) during motor on; optional during pause

**Software action:** Log to time-series; aggregate for post-job report (avg, peak); alert if out of range

---

#### `coverage_checkpoint`

Emitted periodically (every 5–10 minutes) to report distance traveled and estimated coverage.

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T19:35:30.456Z",
  "event_type": "coverage_checkpoint",
  "data": {
    "pass_number": 1,
    "distance_traveled_m": 125.5,
    "estimated_coverage_pct": 45.2,
    "location_x_pct": 50,
    "location_y_pct": 35
  }
}
```

**Field definitions:**

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pass_number` | integer | ≥ 1 | Grit sequence number (for sequencing) |
| `distance_traveled_m` | float | ≥ 0 | Cumulative meters of wheel rotation (from odometer) |
| `estimated_coverage_pct` | float | 0.0–100.0 | Rough estimate: distance * wheel width / target area |
| `location_x_pct` | integer | 0–100 | Firmware's best guess of position in room (x axis, % of width) |
| `location_y_pct` | integer | 0–100 | Firmware's best guess of position in room (y axis, % of depth) |

**Frequency:** Every 5–10 minutes during motor on (adjustable; aim for < 50 events/job)

**Software action:** Update dashboard progress bar; detect coverage gaps (if < 80% after 60 min, alert)

---

#### `dust_reading`

Emitted when external dust sensor (connected to extraction system) sends reading.

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T19:30:55.789Z",
  "event_type": "dust_reading",
  "data": {
    "ugm3": 18.5,
    "location": "extraction_point"
  }
}
```

**Field definitions:**

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `ugm3` | float | 0–1000 | Micrograms per cubic meter (µg/m³); dust density at sensor |
| `location` | enum | "extraction_point" \| "ambient" | "extraction_point" = at exhaust; "ambient" = room |

**Frequency:** 1 Hz (or as fast as external sensor logs; firmware relays verbatim)

**Notes:**
- Dust sensor is **external** (not onboard Sander D1); firmware relays readings over WiFi
- This is **early data only** — actual dust capture ≥ 98% is not validated in pilot (measure actual HEPA filter performance separately)

**Software action:** Log for post-job report; alert if spike > 50 µg/m³ (possible leak)

---

#### `pass_completed`

Emitted when firmware finishes a grit pass (motor off, pass duration logged).

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T20:31:22.567Z",
  "event_type": "pass_completed",
  "data": {
    "pass_number": 1,
    "grit_tag": "36",
    "duration_sec": 3607,
    "coverage_area_m2": 50.1,
    "coverage_pct": 98.2,
    "avg_pressure_psi": 3.1,
    "peak_pressure_psi": 4.2,
    "avg_dust_ugm3": 16.3
  }
}
```

**Field definitions:**

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pass_number` | integer | ≥ 1 | Confirms which pass just finished |
| `grit_tag` | string | "36" \| "80" \| "120" | Matches `pass_started` |
| `duration_sec` | integer | > 0 | Elapsed time from `pass_started` to `pass_completed` |
| `coverage_area_m2` | float | > 0 | Final coverage from odometry |
| `coverage_pct` | float | 0.0–100.0 | coverage_area_m2 / target_area_m2 * 100 |
| `avg_pressure_psi` | float | 0–10 | Average of all pressure readings during pass |
| `peak_pressure_psi` | float | 0–10 | Max pressure reading during pass |
| `avg_dust_ugm3` | float | 0–1000 | Average of all dust readings during pass |

**Frequency:** Once per grit (3 times total for 36→80→120)

**Software action:** Close pass record; calculate pass quality; store for post-job report

---

#### `error`

Emitted when firmware detects a fault condition.

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T19:45:30.123Z",
  "event_type": "error",
  "data": {
    "code": "PRESSURE_OUT_OF_RANGE",
    "severity": "warning",
    "message": "Pressure reading unstable; sensor may need cleaning"
  }
}
```

**Field definitions:**

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `code` | string | See error codes table | Machine-readable error identifier |
| `severity` | enum | "info" \| "warning" \| "error" | info = FYI; warning = check but continue; error = stop job |
| `message` | string | < 200 chars | Human-readable description |

**Error codes (pilot phase):**

| Code | Severity | Meaning | Action |
|------|----------|---------|--------|
| `MOTOR_STALLED` | error | Motor not spinning (jammed?) | Pause job; contractor investigates |
| `PRESSURE_OUT_OF_RANGE` | warning | Sensor reading invalid | Log; continue; may need recalibration |
| `SENSOR_DISCONNECT` | error | Pressure sensor not responding | Pause job; reconnect sensor |
| `BATTERY_LOW` | warning | Battery < 20% | Continue; alert contractor to dock soon |
| `BATTERY_CRITICAL` | error | Battery < 5% | Pause job; docking mandatory |
| `TELEMETRY_UPLOAD_FAILED` | warning | HTTP POST failed (will retry) | Log locally; retry when connectivity restored |
| `JOB_PARAMS_MISSING` | error | No grit sequence provided | Pause job; fetch job params from API |

**Frequency:** As-needed (only when fault detected)

**Software action:** Log error; alert contractor if severity ≥ error; prompt to resume or abort

---

#### `job_paused`

Emitted when firmware stops motor due to pause command (from controller or e-stop).

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T19:50:00.789Z",
  "event_type": "job_paused",
  "data": {
    "pass_number": 1,
    "pause_reason": "manual",
    "elapsed_duration_sec": 2400
  }
}
```

**Field definitions:**

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pass_number` | integer | ≥ 1 | Which pass was paused |
| `pause_reason` | enum | "manual" \| "error" \| "battery_low" | "manual" = e-stop or BLE; "error" = motor stall; "battery" = low power |
| `elapsed_duration_sec` | integer | > 0 | Time running since `pass_started` |

**Frequency:** Once per pause

**Software action:** Stop timer; update dashboard ("Paused: 40 min elapsed"); wait for resume command

---

#### `job_resumed`

Emitted when firmware resumes motor after pause.

```json
{
  "device_id": "FF-S001",
  "job_id": "job-2847",
  "timestamp": "2026-08-03T20:05:00.890Z",
  "event_type": "job_resumed",
  "data": {
    "pass_number": 1,
    "resume_reason": "manual"
  }
}
```

**Field definitions:**

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `pass_number` | integer | ≥ 1 | Which pass resumed |
| `resume_reason` | enum | "manual" \| "auto" | "manual" = contractor; "auto" = if retry-after-error implemented |

**Frequency:** Once per resume

**Software action:** Restart timer; update dashboard ("Running: pass 1 of 3")

---

## Part 3: Job Lifecycle & Status Signals

### 3.1 Job Lifecycle (Software's View)

```
draft ──→ queued ──→ in_progress ──→ completed ──→ approved
                        ↓
                      paused ←──┐
                        ↑       │
                        └───────┘
```

### 3.2 Job Parameter Request

**Firmware initiation (Week 5 integration):**

Before starting a job, firmware fetches parameters from software.

```
GET /api/jobs/job-2847?device_id=FF-S001
Authorization: Bearer <JWT>
```

**Response (from software):**

```json
{
  "id": "job-2847",
  "device_id": "FF-S001",
  "site_name": "Meridian Floor 12",
  "sqft": 12500,
  "target_coverage_area_m2": 835,
  "grit_sequence": ["36", "80", "120"],
  "target_pressure_psi": 3.0,
  "estimated_duration_sec": 10800,
  "status": "queued"
}
```

**Firmware action:** Cache parameters locally; begin first pass.

---

### 3.3 Firmware → Software Status Sync

**After first `pass_started` event:**
- Software marks job as `in_progress` (timestamp from telemetry)

**After `pass_completed` event:**
- Software records pass metrics; remains `in_progress` for next grit (unless it was the 3rd/final pass)

**After final `pass_completed` (3rd grit):**
- Software marks job as `completed` (time-based; no additional event needed)
- Software generates post-job report (aggregate: total coverage, avg dust, duration, cost estimate)

**After manual pause via e-stop or BLE:**
- Firmware emits `job_paused`; software marks job as `paused`
- Job stays `paused` until contractor or remote command resumes

**After resume:**
- Firmware emits `job_resumed`; software marks job as `in_progress`

---

### 3.4 Job Approval Workflow (Week 8+)

**Software auto-generates approval criteria after job finishes:**

| Criterion | Pass | Fail |
|-----------|------|------|
| Coverage ≥ 85% | ✅ | ⚠️ Alert contractor |
| Avg pressure 2–4 PSI | ✅ | ⚠️ May indicate uneven floor |
| No critical errors | ✅ | ❌ Manual review needed |
| Dust avg < 30 µg/m³ | ✅ | ⚠️ Check HEPA filter |

**Software sends notification:** "Job complete. Coverage: 98%. Ready for approval?" Contractor signs off in dashboard.

---

## Part 4: Out-of-Scope (Phase 1 Pilot, Deferred)

| Feature | Reason | Phase |
|---------|--------|-------|
| **Automatic grit changing** | Adds complexity; manual swap OK for pilot | Phase 2 |
| **Real-time pressure optimization** | Would require closed-loop control; fixed preset sufficient | Phase 2 |
| **Computer vision coverage validation** | Requires camera + ML; encoder + manual check sufficient | Phase 2 |
| **Wireless firmware updates** | USB cable is acceptable for pilot; OTA adds compliance risk | Phase 2 |
| **Multi-robot coordination** | Pilot is single-robot per contractor | Phase 2 |
| **GPS/IMU positioning** | Encoder odometry is sufficient for coverage mapping | Phase 2 |
| **Predictive maintenance** | Collect data in pilot; implement logic in phase 2 | Phase 2 |
| **Remote emergency stop** | Manual e-stop is safe for pilot; remote optional later | Phase 2 |

---

## Part 5: Testing & Validation Checklist

### 5.1 Firmware Development Checklist (Weeks 3–6)

- [ ] **Week 3:** Motor on/off + e-stop wired and tested (manual 15-min run)
- [ ] **Week 4:** Pressure sensor reading & logging (verify ±10% accuracy vs. reference gauge)
- [ ] **Week 4:** Encoder wheel odometry (measure 10m path; verify error < 5%)
- [ ] **Week 5:** Firmware parses job parameters from API and logs grit sequence
- [ ] **Week 5:** Telemetry HTTP POST works (firmware → /api/telemetry endpoint)
- [ ] **Week 5:** Firmware handles API 202 response and logs successfully
- [ ] **Week 5:** All 8 event types emitted correctly (JSON schema validation)
- [ ] **Week 6:** 4-hour bench test (motor on, pressure + dust readings logged continuously; zero crashes)
- [ ] **Week 6:** Pause/resume logic works (e-stop halts; resume button restarts cleanly)

### 5.2 Software Backend Checklist (Weeks 1–6)

- [ ] **Week 1:** /api/telemetry endpoint accepts POST requests
- [ ] **Week 2:** Telemetry events stored in Supabase (100% durability confirmed)
- [ ] **Week 2:** Multi-tenant isolation verified (device A's telemetry not visible to tenant B)
- [ ] **Week 3:** Job parameters API (GET /api/jobs/job-id) returns correct grit sequence
- [ ] **Week 4:** Dashboard displays real telemetry (pressure, coverage % update live)
- [ ] **Week 5:** Post-job report generated (aggregated stats: duration, coverage, avg pressure, dust)
- [ ] **Week 6:** Database query performance stable (< 500ms even with 1000 events/job)

### 5.3 Integration Test (Week 5–6)

**Setup:**
1. Firmware running on Sander D1 breadboard
2. Software API deployed to staging server
3. WiFi connectivity between firmware and API

**Test sequence:**

```
Step 1: Firmware fetches job parameters
  → Verify firmware receives grit_sequence correctly

Step 2: Firmware emits pass_started
  → Verify software logs event
  → Check dashboard shows "Pass 1 of 3: 36 grit"

Step 3: Firmware logs 60 pressure readings (60 sec at 1 Hz)
  → Verify all 60 arrive in Supabase
  → No data loss

Step 4: Firmware emits pass_completed
  → Verify software aggregates (avg pressure, duration, coverage %)
  → Check post-job report calculation

Step 5: Repeat steps 2–4 for grit 80 and 120

Step 6: After final pass_completed
  → Verify software marks job as "completed"
  → Check post-job report is generated and visible in dashboard

Step 7: Pause/resume
  → Firmware e-stop → motor off → emit job_paused
  → Verify software marks job as "paused"
  → Resume button sent via BLE/API
  → Firmware resumes → emit job_resumed
  → Verify software marks job as "in_progress" again

Step 8: Error injection
  → Manually disconnect pressure sensor
  → Verify firmware emits error event with severity "error"
  → Check software alerts contractor

Result: All 8 events captured, aggregated, and visible in dashboard.
```

### 5.4 Field Validation (Week 7–8)

- [ ] Contractor receives Sander D1 unit and onboarding video
- [ ] Contractor runs first job (real floor, 100–500 sqft)
- [ ] Dashboard shows real-time progress (coverage, pressure, dust)
- [ ] Post-job report generated and contractor signs off
- [ ] Weekly feedback call: ask about usability, data accuracy, hardware reliability
- [ ] Iterate firmware if needed (week 8) based on feedback

---

## Part 6: Telemetry Bandwidth & Storage

### 6.1 Data Volume Estimate (Per Job)

Assuming typical job: 2 hours = 7200 seconds

| Event Type | Frequency | Count | Bytes/Event | Total |
|------------|-----------|-------|------------|-------|
| pressure_reading | 1 Hz | 7200 | 120 | 864 KB |
| dust_reading | 1 Hz | 7200 | 100 | 720 KB |
| coverage_checkpoint | every 10 min | 12 | 150 | 1.8 KB |
| pass_started/completed | 3 per job | 6 | 200 | 1.2 KB |
| job_paused/resumed | ~2 per job | 2 | 80 | 160 B |
| error | ~1 per job | 1 | 150 | 150 B |

**Total per 2-hour job: ~1.6 MB**

**Monthly (50 jobs): ~80 MB** (well within Supabase free tier)

---

### 6.2 Network Connectivity Recommendations

| Scenario | Recommendation |
|----------|-----------------|
| **5G/WiFi-5 available** | Real-time HTTP POST (5–10 sec latency); no batching needed |
| **WiFi-5, unstable** | Batch telemetry every 30 sec; firmware queues if offline |
| **WiFi-4 / 4G** | Batch every 1 min; compress JSON if needed |
| **Offline (no connectivity)** | Firmware logs to local SD card; contractor uploads manually after job |

**Minimum acceptable:** 1 Mbps bandwidth; 10 sec round-trip latency

---

## Part 7: Error Handling & Resilience

### 7.1 Firmware Recovery

**If telemetry POST fails (no connectivity):**

```
1. Firmware queues event locally
2. Retry every 30 sec (exponential backoff max 5 min)
3. Continue working (don't pause)
4. When connectivity restored, flush queue
5. Validate no gaps (resume from last known timestamp)
```

**If job parameters API unreachable:**

```
1. Use cached parameters from previous job (if available)
2. Log warning event
3. Continue if cache available; otherwise pause and alert contractor
```

### 7.2 Software Recovery

**If telemetry event arrives out of order:**

```
1. Check timestamp
2. Reorder in database if delta < 10 sec
3. Alert backend team if delta > 30 sec (possible clock drift)
```

**If telemetry event is incomplete or malformed:**

```
1. Return 400 Bad Request
2. Log error for developer review
3. DO NOT store partial event
```

---

## Part 8: Approval & Sign-Off

### 8.1 Firmware Team Commitment

| Item | Owner | By When | Status |
|------|-------|---------|--------|
| **All 8 telemetry event types implemented** | Firmware | Week 5 | 🔴 Not started |
| **Bench test (4+ hours, zero crashes)** | Hardware | Week 6 | 🔴 Not started |
| **Error handling (queue & retry)** | Firmware | Week 6 | 🔴 Not started |
| **Integration test (firmware ↔ software)** | Firmware/Software | Week 5–6 | 🔴 Not started |

### 8.2 Software Team Commitment

| Item | Owner | By When | Status |
|------|-------|---------|--------|
| **/api/telemetry endpoint live** | Backend | Week 1–2 | ✅ Done (spec ready) |
| **Job parameters API live** | Backend | Week 2 | ✅ Done (spec ready) |
| **Telemetry storage & query (Supabase)** | Backend | Week 2 | ✅ Done (schema ready) |
| **Post-job report generation** | Backend | Week 4 | 🟡 In progress |
| **Dashboard real-time updates** | Frontend | Week 4 | 🟡 In progress |
| **Integration test (software ↔ firmware)** | Full team | Week 5–6 | 🔴 Not started |

---

## Part 9: Revision & Change Management

**During weeks 3–6 pilot:**
- Weekly sync call (firmware + software) to align on any contract changes
- Changes require written approval from both team leads (brief comment in GitHub issue)
- No major changes without 1-week notice to pilot contractors

**Example:** If firmware team discovers pressure sensor is noisier than expected:
1. Email backend team: "Propose: change pressure_reading frequency from 1 Hz to 0.5 Hz to reduce noise"
2. Get approval (< 1 day)
3. Implement on both sides
4. Retest integration
5. Update this contract (add note)

---

## Appendix: Example Integration Test Output

**Firmware telemetry (raw JSON, firmware logs):**

```
[2026-08-10 10:15:30] Starting job job-2847
[2026-08-10 10:15:31] HTTP POST to /api/telemetry: pass_started (response: 202)
[2026-08-10 10:15:32] Pressure: 3.1 PSI (event queued)
[2026-08-10 10:15:33] Pressure: 3.2 PSI (event queued)
[2026-08-10 10:15:35] Dust: 18.5 µg/m³ (event queued)
...
[2026-08-10 11:15:00] HTTP POST (batch 60 events): 202 Accepted
[2026-08-10 12:15:30] pass_completed (response: 202)
[2026-08-10 12:15:31] Grit change: 36 → 80
[2026-08-10 12:15:32] pass_started (grit 80)
...
```

**Software telemetry (database, Supabase):**

```
SELECT event_type, COUNT(*) FROM telemetry_events 
WHERE job_id = 'job-2847' 
GROUP BY event_type;

pass_started        | 3
pass_completed      | 3
pressure_reading    | 7200
dust_reading        | 7200
coverage_checkpoint | 12
error               | 0
job_paused          | 0
job_resumed         | 0
TOTAL               | 14415 events
```

**Software dashboard (UI):**

```
Job: Meridian Floor 12 (12,500 sqft)
Status: COMPLETED ✅

Pass 1: 36 grit
  Duration: 1h 0m 7s
  Coverage: 98.2%
  Avg Pressure: 3.1 PSI
  Avg Dust: 16.3 µg/m³
  Status: APPROVED ✅

Pass 2: 80 grit
  Duration: 59m 45s
  Coverage: 97.8%
  Avg Pressure: 3.0 PSI
  Avg Dust: 14.1 µg/m³
  Status: APPROVED ✅

Pass 3: 120 grit
  Duration: 58m 30s
  Coverage: 99.1%
  Avg Pressure: 2.9 PSI
  Avg Dust: 12.2 µg/m³
  Status: APPROVED ✅

Post-Job Report
  Total time: 2h 58m 22s
  Overall coverage: 98.4%
  Avg dust: 14.2 µg/m³
  Errors: None
  Approval score: 97/100

Ready for approval? [Customer signs off]
```

---

## Sign-Off

**Firmware Lead:** ☐ Reviewed & Approved  
**Software Lead:** ☐ Reviewed & Approved  
**Hardware Lead:** ☐ Reviewed & Approved  

---

**Document prepared by:** FloorForge Systems Engineering  
**Status:** Ready for Implementation  
**Next review:** August 10, 2026 (end of week 1 breadboard assembly)  
**Questions?** Slack #floorforge-pilot or weekly sync meeting
