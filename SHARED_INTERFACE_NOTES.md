# Shared Interface Notes: FloorForge & EcoWoods Data Shapes

**Date:** August 2, 2026  
**Version:** 1.0  
**Purpose:** Define minimal, interoperable data structures for FloorForge ↔ EcoWoods integration  
**Audience:** Backend engineers, data architects, API designers

---

## Overview

This document defines the **smallest viable set of shared data shapes** needed for FloorForge and EcoWoods to interoperate cleanly. These are not the full schemas (those are in Supabase migrations); these are the **public API contracts** that both systems rely on.

All types are expressed in TypeScript for clarity. Implementations may use JSON, gRPC, or other formats; the contracts remain the same.

---

## 1. User & Tenant Context

```typescript
/**
 * User record, from auth provider (Clerk, EcoWoods SSO, etc.)
 * This is the identity that all other records reference.
 */
interface User {
  id: string;                      // UUID or provider-specific ID
  email: string;                   // Canonical email; used for login
  name?: string;
  phone?: string;
  role: UserRole;
  tenant_id?: string;              // Multi-tenant; may be omitted if single-tenant
  created_at: string;              // ISO 8601
  updated_at: string;
}

type UserRole =
  | "pilot_admin"                  // Full access to pilot data, reporting
  | "pilot_technician"             // Can view jobs, submit telemetry
  | "pilot_customer"               // Can view own jobs, download reports
  | "support"                      // Can view all jobs, assign, escalate
  | "system_admin";                // Database, billing, ops

/**
 * Tenant record (accounts, sub-accounts, etc.)
 * A single FloorForge customer, typically an operator or contractor.
 */
interface Tenant {
  id: string;                      // UUID
  name: string;                    // Legal business name
  email: string;                   // Billing / primary contact
  phone?: string;
  location?: string;               // State / region for targeting
  segment: CustomerSegment;        // Classification for cohort analysis
  robot_count: number;             // How many units does this operator own or lease?
  status: TenantStatus;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;     // For future billing
}

type CustomerSegment =
  | "residential_high_end"
  | "commercial_office"
  | "commercial_retail"
  | "specialty_wood"
  | "facilities_management"
  | "other";

type TenantStatus =
  | "prospect"                     // Waitlist, not yet committed
  | "pilot_candidate"              // Qualified for pilot; offer extended
  | "piloting"                     // Active in pilot program
  | "trial"                        // Post-pilot trial period
  | "active_paid"                  // Paying customer
  | "churned";                     // Trial or pilot declined
```

---

## 2. Pilot Application (Interest Capture)

```typescript
/**
 * Pilot application record. Created when someone submits the waitlist form.
 * This is the core "interest" / "lead" object for funnel tracking.
 */
interface PilotApplication {
  id: string;                      // UUID
  email: string;
  name: string;
  company: string;
  monthly_sqft_target: number;
  segment?: CustomerSegment;       // Inferred from form inputs
  state?: string;                  // US state; used for regional targeting
  phone?: string;

  // Product interest (from simulator ?interest= param or form)
  robot_interest?: "sand" | "edge" | "coat" | "lay" | "scan" | null;
  challenge?: string;              // Optional free-text: "What's your biggest sanding pain point?"

  // Engagement & lifecycle
  source: "floorforge-site" | "ecowoods-referral" | "partner" | "direct";
  source_details?: string;         // E.g., "ecowoods.com/products/floorforge"
  status: PilotApplicationStatus;
  status_reason?: string;          // Why declined, if applicable
  internal_notes?: string;         // Sales team notes (not visible to customer)

  // Timestamps
  created_at: string;              // ISO 8601
  updated_at: string;
  contacted_at?: string;           // When did FloorForge first reach out?
  onboarded_at?: string;           // When did pilot actually start?

  // Links to other records
  user_id?: string;                // After conversion, link to User record
  tenant_id?: string;              // After conversion, link to Tenant record
}

type PilotApplicationStatus =
  | "new"                          // Just filled form; not reviewed yet
  | "contacted"                    // Sales team reached out
  | "engaged"                      // Responded; conversation ongoing
  | "qualified"                    // Met criteria; offer extended
  | "accepted"                     // Agreed to participate; hardware TBD
  | "onboarded"                    // Terms signed; access granted
  | "piloting"                     // Active; jobs running
  | "completed"                    // Pilot cohort finished; awaiting decision
  | "declined"                     // Not interested or failed to qualify
  | "churned";                     // Pilot started, then stopped prematurely
```

**API endpoints:**
- `POST /api/applications` – Create (from waitlist form)
- `GET /api/applications?status=new&limit=20` – List (admin only)
- `GET /api/applications/[id]` – Read (admin + self)
- `PATCH /api/applications/[id]` – Update status, notes (admin only)

---

## 3. Job (Floor Refinishing Project)

```typescript
/**
 * A single floor refinishing job. Represents one site visit from start
 * (robot deployment) to finish (report signed).
 */
interface Job {
  id: string;                      // UUID, e.g. "job-2847"
  tenant_id: string;               // Which pilot operator owns this job?
  site_name: string;               // "Meridian Tower Floor 12"
  site_address?: string;
  site_notes?: string;             // Vents, furniture, obstacles, etc.

  // Scope
  floor_type?: string;             // "hardwood", "engineered", "specialty"
  floor_condition?: string;        // "raw", "refinished", "worn"
  sqft: number;                    // Actual measured floor area
  sqm: number;                     // Calculated from sqft
  grit_sequence?: string[];        // ["36", "80", "120"] for sanding jobs

  // Machines & resources
  robot_id: string;                // "FF-03A" (Sander D1, Edger, etc.)
  robot_type?: string;             // Redundant; helps with queries
  operator_ids?: string[];         // Humans present during job
  estimated_duration_hours?: number;

  // Status & tracking
  status: JobStatus;
  current_pass?: number;           // If in_progress, which grit (0-indexed)?
  coverage_pct: number;            // 0–100; updated as job progresses
  coverage_area_m2: number;        // Cumulative coverage
  time_elapsed_sec: number;
  time_remaining_sec?: number;     // Estimate based on coverage rate
  approval_score?: number;         // 0–100; null until job completes

  // Timeline
  created_at: string;              // ISO 8601; job record created
  scheduled_at?: string;           // When is robot supposed to show up?
  started_at?: string;             // When did robot actually start?
  completed_at?: string;           // When did final pass finish?
  updated_at: string;              // Last telemetry update

  // Report
  post_job_report?: PostJobReport; // Generated after job completes
}

type JobStatus =
  | "draft"          // Site scan done; plan created but not approved
  | "queued"         // Approved; waiting for robot
  | "in_progress"    // Robot actively working
  | "paused"         // Human intervention (coverage gap, dust spike, etc.)
  | "completed"      // Robot finished all passes
  | "approved"       // First-pass QA passed; ready for finish or next phase
  | "rework"         // Coverage failed; re-scanning or re-passing
  | "failed"         // Job aborted
  | "archived";      // Historical; no further updates

/**
 * Post-job report. Generated automatically after job completes;
 * updated when customer signs off.
 */
interface PostJobReport {
  id: string;
  job_id: string;
  status: ReportStatus;

  // Execution summary
  grit_sequence_executed: string[];           // What was actually done?
  total_coverage_area_m2: number;
  total_time_hours: number;
  coverage_approval: boolean;                 // Did it pass 99%+ coverage check?
  coverage_approval_score: number;            // 0–100

  // Quality metrics
  avg_dust_ugm3: number;                      // Average dust across all samples
  dust_peak_ugm3: number;                     // Worst-case reading
  dust_samples_count: number;
  finish_type?: string;                       // "polyurethane", "water-based", etc.
  finish_coverage_m2?: number;
  film_build_um?: number;                     // Microns; target ±5%

  // Verification
  photos: string[];                           // S3 or CDN URLs
  signed_by?: string;                         // Customer user ID who approved
  signed_at?: string;                         // ISO 8601
  signature_notes?: string;

  // For future integration
  gc_email?: string;                          // General contractor, if applicable
  property_manager?: string;
}

type ReportStatus =
  | "draft"          // Auto-generated; awaiting customer sign-off
  | "signed"         // Customer approved; report locked
  | "archived";      // Old report, no longer referenced

/**
 * API endpoints:
 * - POST /api/jobs – Create job from site scan
 * - GET /api/jobs?status=in_progress – List (filtered)
 * - GET /api/jobs/[id] – Single job + full telemetry
 * - PATCH /api/jobs/[id] – Update status, notes
 * - POST /api/jobs/[id]/sign-off – Customer approval
 */
```

---

## 4. Telemetry Events & Streams

```typescript
/**
 * Core telemetry event. Emitted by hardware, ingested by `/api/telemetry`,
 * stored in Supabase `telemetry_events` table.
 */
interface TelemetryEvent {
  id: string;                      // UUID
  job_id: string;
  robot_id: string;
  timestamp: string;               // ISO 8601; millisecond precision
  event_type: EventType;
  data: Record<string, unknown>;   // Flexible payload per event type
  received_at?: string;            // Server receive time (may differ from timestamp)
}

/**
 * Standard event types. Add new types as hardware capabilities expand.
 */
type EventType =
  | "pass_started"
  | "pass_completed"
  | "dust_reading"
  | "coverage_check"
  | "robot_paused"
  | "robot_resumed"
  | "finish_applied"
  | "quality_approved"
  | "quality_failed"
  | "error"
  | "heartbeat";

/**
 * Event-specific payloads (illustrative; not exhaustive).
 */

interface PassStartedEvent {
  pass_number: number;             // 1-indexed (1st grit, 2nd grit, etc.)
  grit_tag: string;                // "36", "80", "120" for sanding
  estimated_duration_sec: number;
  coverage_target_area_m2: number;
}

interface PassCompletedEvent {
  pass_number: number;
  grit_tag: string;
  actual_duration_sec: number;
  coverage_area_m2: number;
  coverage_pct: number;            // % of floor covered
  avg_pressure_bar?: number;       // For sander telemetry
  dust_readings: DustReading[];    // Samples during pass
}

interface DustReadingEvent {
  ugm3: number;                    // Micrograms per cubic meter (OSHA metric)
  location_x_pct?: number;         // x position on floor (0–100%)
  location_z_pct?: number;         // z position on floor (0–100%)
  sample_duration_sec?: number;    // Averaging window
}

interface CoverageCheckEvent {
  area_checked_m2: number;
  coverage_pct: number;
  gaps_detected: number;
  gap_locations?: Array<{
    x_pct: number;
    z_pct: number;
    area_m2: number;
  }>;
  recommendation: "approve" | "rework";
}

interface RobotPausedEvent {
  reason: string;                  // "coverage_gap", "dust_spike", "manual", "low_battery"
  human_action_required: boolean;
}

interface ErrorEvent {
  error_code: string;              // E.g., "E_MOTOR_STALL", "E_SENSOR_FAULT"
  error_message: string;
  severity: "warning" | "error" | "fatal";
  recovery_action?: string;        // What did robot try to do?
}

/**
 * API contract:
 * - POST /api/telemetry – Ingest events from robot (batch or streaming)
 * - GET /api/jobs/[id]/telemetry?event_type=dust_reading – Query events
 * - WebSocket /api/jobs/[id]/stream – Real-time telemetry feed
 */
```

---

## 5. Robot & Fleet Management

```typescript
/**
 * A physical robot unit in the fleet.
 */
interface Robot {
  id: string;                      // "FF-03A" (human-readable)
  uuid: string;                    // UUID for database
  platform: RobotPlatform;         // "sand" | "edge" | "coat" | "lay" | "scan"
  serial_number: string;           // Manufacturer serial
  tenant_id: string;               // Which operator owns this robot?
  status: RobotStatus;
  location?: string;               // "Oakland warehouse", "In transit", or customer address

  // Hardware version
  hardware_version: string;        // "1.0", "1.1", etc.
  firmware_version?: string;       // Latest deployed
  last_firmware_check?: string;    // ISO 8601

  // Health & telemetry
  battery_soc?: number;            // 0–100 %
  motor_hours?: number;            // Cumulative run time
  last_heartbeat?: string;         // ISO 8601; when did we last hear from it?
  health_score?: number;           // 0–100; computed from errors, uptime

  // Maintenance
  next_service_due?: string;       // ISO 8601
  service_log?: Array<{
    date: string;
    service_type: string;
    notes: string;
  }>;

  // Current assignment
  current_job_id?: string;
  assigned_to_technician?: string;

  created_at: string;
  updated_at: string;
}

type RobotPlatform = "sand" | "edge" | "coat" | "lay" | "scan";

type RobotStatus =
  | "available"      // Ready for deployment
  | "in_use"         // Currently on a job
  | "in_transit"     // Being transported
  | "maintenance"    // In service; unavailable
  | "error"          // Fault detected; under investigation
  | "retired";       // End of life; no longer deployable

/**
 * API endpoints:
 * - GET /api/robots – List fleet (filtered by tenant)
 * - GET /api/robots/[id] – Single robot status + health
 * - PATCH /api/robots/[id] – Update status, location, notes
 * - GET /api/robots/[id]/jobs – Job history
 * - GET /api/robots/[id]/health – Diagnostics (battery, motor hours, etc.)
 */
```

---

## 6. Status & Enums (Canonical Definitions)

```typescript
/**
 * All status enums used across FloorForge.
 * Keep these in a single source-of-truth file for easy reference.
 */

// Job lifecycle
type JobStatus =
  | "draft"
  | "queued"
  | "in_progress"
  | "paused"
  | "completed"
  | "approved"
  | "rework"
  | "failed"
  | "archived";

// Pilot application funnel
type PilotApplicationStatus =
  | "new"
  | "contacted"
  | "engaged"
  | "qualified"
  | "accepted"
  | "onboarded"
  | "piloting"
  | "completed"
  | "declined"
  | "churned";

// User roles
type UserRole =
  | "pilot_admin"
  | "pilot_technician"
  | "pilot_customer"
  | "support"
  | "system_admin";

// Customer segments
type CustomerSegment =
  | "residential_high_end"
  | "commercial_office"
  | "commercial_retail"
  | "specialty_wood"
  | "facilities_management"
  | "other";

// Robot & fleet
type RobotPlatform = "sand" | "edge" | "coat" | "lay" | "scan";
type RobotStatus = "available" | "in_use" | "in_transit" | "maintenance" | "error" | "retired";

// Quality / approval
type ApprovalResult = true | false;  // Simple: pass or fail
type ReportStatus = "draft" | "signed" | "archived";
type RecoveryAction = "retry" | "skip" | "manual" | "abort";

/**
 * Export as a single constants file:
 * export const STATUS_ENUMS = { JobStatus, PilotApplicationStatus, ... }
 */
```

---

## 7. API Contract Summary

**Base URL:** `https://floorforge.api.ecowoods.com` (or `https://api.floorforge.io`)

**Auth:** Bearer token (JWT from Clerk or EcoWoods SSO)

**Response format:** JSON; always include `{ data: ..., error?: null | { code, message } }`

### Core Endpoints

#### Pilot Applications
```
POST   /api/applications               Create application (form submission)
GET    /api/applications               List (filters: status, created_after)
GET    /api/applications/[id]          Read single application
PATCH  /api/applications/[id]          Update status, notes
```

#### Jobs
```
POST   /api/jobs                       Create job (from site scan)
GET    /api/jobs                       List (filters: status, tenant_id, robot_id)
GET    /api/jobs/[id]                  Read job + full telemetry + report
PATCH  /api/jobs/[id]                  Update (status, notes, coverage_pct)
POST   /api/jobs/[id]/sign-off         Customer approval + signature
```

#### Telemetry
```
POST   /api/telemetry                  Ingest event batch (from robot)
GET    /api/jobs/[id]/telemetry        Query events (filters: event_type, date_range)
WebSocket /api/jobs/[id]/stream        Real-time event stream
```

#### Fleet
```
GET    /api/robots                     List fleet (tenant-filtered)
GET    /api/robots/[id]                Robot status, health, current job
PATCH  /api/robots/[id]                Update status, location, notes
GET    /api/robots/[id]/jobs           Job history
GET    /api/robots/[id]/health         Diagnostics (battery, motor hours, errors)
```

#### Reports & Analytics
```
GET    /api/jobs/[id]/report           Download PDF report
GET    /api/analytics/jobs             Aggregate stats (first-pass approval %, dust avg, etc.)
GET    /api/analytics/robots           Fleet health dashboard
```

---

## 8. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  EcoWoods Website & CRM                                         │
│  └─→ Pilot interest captured in PilotApplication                │
│      └─→ Linked to User (auth) & Tenant (account)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  FloorForge Pilot Dashboard (customer-facing)                   │
│  └─→ User logs in (EcoWoods SSO or Clerk)                       │
│      └─→ Sees their Jobs (queued, in_progress, completed)       │
│          └─→ Real-time telemetry via WebSocket /stream          │
│              └─→ Dust readings, coverage, progress              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Hardware (Robots in Field)                                     │
│  └─→ Sander D1, Edger E1, Coater C1, etc.                       │
│      └─→ Emit TelemetryEvents (dust_reading, pass_completed)    │
│          └─→ POST /api/telemetry (batch, every 5–10s)           │
│              └─→ Stored in Supabase telemetry_events            │
│                  └─→ Job status updated (coverage_pct, etc.)    │
│                      └─→ Dashboard refreshes via subscription   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Post-Job Reports                                               │
│  └─→ Auto-generated PostJobReport after job completes           │
│      └─→ Customer downloads PDF or signs off in dashboard       │
│          └─→ Report locked; archived                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Validation & Constraints

```typescript
/**
 * Validation rules for core types. Enforce these in API handlers & database.
 */

// PilotApplication
√ email: must be valid RFC 5322; unique per application (allow duplicates for lead scoring)
√ monthly_sqft_target: must be > 0
√ status: must transition only in defined direction (new→contacted→engaged→...→declined|churned)
√ source: must be enum value

// Job
√ sqft: must be > 100 (minimum viable floor)
√ coverage_pct: must be 0–100
√ status: can only transition in defined direction (e.g., draft→queued, not completed→draft)
√ robot_id: must exist in Robots table (FK constraint)
√ tenant_id: must match robot's tenant_id (prevent cross-tenant job assignment)

// TelemetryEvent
√ timestamp: must be within 1 hour of server time (reject clock-skew outliers)
√ job_id: must exist and be in_progress or completed (can't log to draft jobs)
√ data: must validate per event_type schema
√ ugm3 values: must be 0–1000 (flag outliers as sensor errors)

// Robot
√ platform: must be enum value
√ tenant_id: immutable after creation (prevent cross-tenant assignment)
√ status: can transition (available→in_use→available, etc.; see state machine)
```

---

## 10. Versioning & Backward Compatibility

**Version strategy:** Semantic versioning for API contracts.

```
GET /api/version
→ { version: "1.0.0", schemas: { Job, TelemetryEvent, ... } }
```

**Breaking changes:** Increment major version. Old endpoints remain available with `/v1/`, `/v2/` prefixes for 6 months (transition period).

**Non-breaking changes:** Additive only. New optional fields don't break old clients.

**Example:**
```typescript
// v1.0: Original
interface Job { id, tenant_id, status, ... }

// v1.1: Add optional field (non-breaking)
interface Job { id, tenant_id, status, approved_by?: string, ... }

// v2.0: Remove deprecated field (breaking)
interface Job { id, tenant_id, status, approved_by, ... }
// Old clients using /v1/jobs still work; /v2/jobs requires updated code
```

---

## Sign-Off

**Document version:** 1.0  
**Date:** August 2, 2026  
**Maintainer:** FloorForge Backend Team  
**Status:** Ready for implementation

This document is the schema contract for all FloorForge ↔ EcoWoods integration. Update it only with major API changes; use `/docs` or inline API docs for implementation details.
