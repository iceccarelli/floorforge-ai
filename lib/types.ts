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

export type EventType =
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
  coverage_pct: number;
  avg_pressure_bar?: number;
  dust_readings: DustReading[];
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
