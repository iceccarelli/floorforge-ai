/**
 * FloorForge Shared Types
 * Derived from SHARED_INTERFACE_NOTES.md v1.0
 * Single source of truth for all data contracts.
 */

// ============================================================================
// USER & TENANT
// ============================================================================

export type UserRole =
  | "pilot_admin"
  | "pilot_technician"
  | "pilot_customer"
  | "support"
  | "system_admin";

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export type CustomerSegment =
  | "residential_high_end"
  | "commercial_office"
  | "commercial_retail"
  | "specialty_wood"
  | "facilities_management"
  | "other";

export type TenantStatus =
  | "prospect"
  | "pilot_candidate"
  | "piloting"
  | "trial"
  | "active_paid"
  | "churned";

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  segment: CustomerSegment;
  robot_count: number;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;
}

// ============================================================================
// PILOT APPLICATION (INTEREST CAPTURE)
// ============================================================================

export type PilotApplicationStatus =
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

export interface PilotApplication {
  id: string;
  email: string;
  name: string;
  company: string;
  monthly_sqft_target: number;
  segment?: CustomerSegment;
  state?: string;
  phone?: string;
  robot_interest?: "sand" | "edge" | "coat" | "lay" | "scan" | null;
  challenge?: string;
  source: "floorforge-site" | "ecowoods-referral" | "partner" | "direct";
  source_details?: string;
  status: PilotApplicationStatus;
  status_reason?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  onboarded_at?: string;
  user_id?: string;
  tenant_id?: string;
}

// ============================================================================
// JOB (FLOOR REFINISHING PROJECT)
// ============================================================================

export type JobStatus =
  | "draft"
  | "queued"
  | "in_progress"
  | "paused"
  | "completed"
  | "approved"
  | "rework"
  | "failed"
  | "archived";

export interface Job {
  id: string;
  tenant_id: string;
  site_name: string;
  site_address?: string;
  site_notes?: string;
  floor_type?: string;
  floor_condition?: string;
  sqft: number;
  sqm: number;
  grit_sequence?: string[];
  robot_id: string;
  robot_type?: string;
  operator_ids?: string[];
  estimated_duration_hours?: number;
  status: JobStatus;
  current_pass?: number;
  coverage_pct: number;
  coverage_area_m2: number;
  time_elapsed_sec: number;
  time_remaining_sec?: number;
  approval_score?: number;
  created_at: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
  post_job_report?: PostJobReport;
}

export type ReportStatus = "draft" | "signed" | "archived";

export interface PostJobReport {
  id: string;
  job_id: string;
  status: ReportStatus;
  grit_sequence_executed: string[];
  total_coverage_area_m2: number;
  total_time_hours: number;
  coverage_approval: boolean;
  coverage_approval_score: number;
  avg_dust_ugm3: number;
  dust_peak_ugm3: number;
  dust_samples_count: number;
  finish_type?: string;
  finish_coverage_m2?: number;
  film_build_um?: number;
  photos: string[];
  signed_by?: string;
  signed_at?: string;
  signature_notes?: string;
  gc_email?: string;
  property_manager?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TELEMETRY EVENTS
// ============================================================================

/**
 * Telemetry event vocabulary.
 *
 * Two vocabularies used to exist. This layer defined eleven types; the firmware
 * contract (SOFTWARE_HARDWARE_CONTRACT.md:103) defined eight, four of which had
 * no definition here at all — so the hardware team was told to emit
 * `pressure_reading`, `coverage_checkpoint`, `job_paused` and `job_resumed`
 * into an endpoint whose validator rejects them as "Invalid event type"
 * (audit/PRODUCT_TRUTH.md T3-1).
 *
 * The union is now the union: fifteen types, every one of which appears in one
 * of the two documents. Nothing was removed — `coverage_check` and
 * `robot_paused`/`robot_resumed` are the platform's richer, post-processed
 * forms and stay. The firmware's are the raw high-frequency forms it actually
 * has the sensors to produce.
 */
export type EventType =
  // Shared by both documents
  | "pass_started"
  | "pass_completed"
  | "dust_reading"
  | "error"
  // Firmware contract only — raw sensor stream, 1 Hz
  | "pressure_reading"
  | "coverage_checkpoint"
  | "job_paused"
  | "job_resumed"
  // Platform only — derived and workflow events
  | "coverage_check"
  | "robot_paused"
  | "robot_resumed"
  | "finish_applied"
  | "quality_approved"
  | "quality_failed"
  | "heartbeat";

export interface TelemetryEvent {
  id: string;
  job_id: string;
  robot_id: string;
  timestamp: string;
  event_type: EventType;
  data: Record<string, unknown>;
  received_at?: string;
  created_at: string;
}

export interface PassStartedEvent {
  pass_number: number;
  grit_tag: string;
  estimated_duration_sec: number;
  coverage_target_area_m2: number;
}

export interface PassCompletedEvent {
  pass_number: number;
  grit_tag: string;
  actual_duration_sec: number;
  coverage_area_m2: number;
  /**
   * PSI, not bar.
   *
   * This field was `avg_pressure_bar` while every threshold, worked example and
   * approval criterion in SOFTWARE_HARDWARE_CONTRACT.md was written in PSI
   * (":170" sensor range 0.0-10.0 psi; ":430" `target_pressure_psi: 3.0`;
   * ":469" approval "Avg pressure 2-4 PSI"). Same quantity, two units, 14.5038x
   * apart, with no conversion documented anywhere (audit/PRODUCT_TRUTH.md
   * T3-1).
   *
   * Firmware sending a correct 3.0 PSI into a field named `_bar` would have
   * been stored as 3.0 bar = 43.5 PSI, and every approval check would have
   * failed for a machine that was operating perfectly. PSI wins because the
   * hardware team is the one reading a gauge.
   */
  avg_pressure_psi?: number;
  peak_pressure_psi?: number;
  dust_readings: DustReading[];
}

/**
 * Raw 1 Hz pressure sample. SOFTWARE_HARDWARE_CONTRACT.md:160-171.
 * `psi` range 0.0-10.0 — 0 means motor off, 2-5 is typical sanding.
 */
export interface PressureReadingEvent {
  psi: number;
  sensor_health: "ok" | "degraded" | "error";
}

/**
 * Odometry-derived coverage estimate, emitted every 5-10 minutes.
 * SOFTWARE_HARDWARE_CONTRACT.md:190-207. Distinct from `coverage_check`, which
 * is the platform's post-processed verdict with gap locations.
 */
export interface CoverageCheckpointEvent {
  pass_number: number;
  distance_traveled_m: number;
  estimated_coverage_pct: number;
  location_x_pct?: number;
  location_y_pct?: number;
}

/** SOFTWARE_HARDWARE_CONTRACT.md:345-359. */
export interface JobPausedEvent {
  pass_number: number;
  pause_reason: "manual" | "error" | "battery_low";
  elapsed_duration_sec: number;
}

/** SOFTWARE_HARDWARE_CONTRACT.md:377-389. */
export interface JobResumedEvent {
  pass_number: number;
  resume_reason: "manual" | "auto";
}

export interface DustReadingEvent {
  ugm3: number;
  location_x_pct?: number;
  location_z_pct?: number;
  sample_duration_sec?: number;
}

export interface DustReading {
  timestamp: string;
  ugm3: number;
  location_x_pct?: number;
  location_z_pct?: number;
}

export interface CoverageCheckEvent {
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

export interface RobotPausedEvent {
  reason: string;
  human_action_required: boolean;
}

export interface ErrorEvent {
  error_code: string;
  error_message: string;
  severity: "warning" | "error" | "fatal";
  recovery_action?: string;
}

// ============================================================================
// ROBOT & FLEET
// ============================================================================

export type RobotPlatform = "sand" | "edge" | "coat" | "lay" | "scan";

export type RobotStatus =
  | "available"
  | "in_use"
  | "in_transit"
  | "maintenance"
  | "error"
  | "retired";

export interface Robot {
  id: string;
  uuid: string;
  platform: RobotPlatform;
  serial_number: string;
  tenant_id: string;
  status: RobotStatus;
  location?: string;
  hardware_version: string;
  firmware_version?: string;
  last_firmware_check?: string;
  battery_soc?: number;
  motor_hours?: number;
  last_heartbeat?: string;
  health_score?: number;
  next_service_due?: string;
  service_log?: Array<{
    date: string;
    service_type: string;
    notes: string;
  }>;
  current_job_id?: string;
  assigned_to_technician?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API RESPONSE ENVELOPE
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total_count: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// DATA PROVENANCE
// ============================================================================

/**
 * What kind of thing a stored value is.
 *
 * FLOORFORGE_SYSTEM_BASELINE.md §3.6. `lib/simulation.ts` emits events in the
 * exact shape of SOFTWARE_HARDWARE_CONTRACT.md, into the same endpoint, with
 * the same event types. Nothing in the schema distinguished them, so the first
 * day both a simulator and a machine wrote to `telemetry_events` the dataset
 * would have become permanently inadmissible — no query could separate what was
 * measured from what was modelled, and every quality claim built on it would
 * have been unprovable.
 *
 * Mirrors the `data_provenance` enum in migrations/002_telemetry_integrity.sql.
 * There is deliberately no value meaning "unspecified": a row that cannot say
 * what it is does not get written.
 */
export type Provenance =
  | "measured"
  | "simulated"
  | "model_estimated"
  | "operator_entered"
  | "manufacturer_specified"
  | "design_target"
  | "historical";

/** Mirrors the `device_kind` enum in migrations/002_telemetry_integrity.sql. */
export type DeviceKind = "hardware" | "simulator" | "test_harness";

export type CredentialStatus = "active" | "revoked";

/**
 * An issued device credential. One row per credential, not per machine: a
 * machine may hold several (rotation, a staging key) and revoking one must not
 * brick the other.
 *
 * The key itself is never stored or returned. `key_prefix` exists so an
 * operator can tell two credentials apart, and so a leaked key can be traced
 * from a log line without the log holding the secret.
 */
export interface DeviceCredential {
  id: string;
  robot_id: string;
  tenant_id: string;
  kind: DeviceKind;
  label?: string;
  key_prefix: string;
  status: CredentialStatus;
  last_seen_at?: string;
  created_at: string;
  revoked_at?: string;
}

/**
 * Provenance is decided by the credential that presented the event, never by
 * the event itself. A simulator cannot claim measurement even if it asks to,
 * and a test harness is simulated on purpose — CI traffic must never be able to
 * enter the corpus as evidence.
 */
export function provenanceForDeviceKind(kind: DeviceKind): Provenance {
  switch (kind) {
    case "hardware":
      return "measured";
    case "simulator":
    case "test_harness":
      return "simulated";
  }
}
