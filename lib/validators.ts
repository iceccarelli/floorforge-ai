/**
 * Input Validation for FloorForge API
 * Validates and sanitizes user inputs before database operations.
 */

import * as types from "./types";

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// PILOT APPLICATION VALIDATION
// ============================================================================

export function validatePilotApplicationInput(
  data: unknown
): {
  valid: boolean;
  data?: Omit<types.PilotApplication, "id" | "created_at" | "updated_at">;
  errors?: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "data", message: "Invalid input" }] };
  }

  const input = data as Record<string, unknown>;

  // Required fields
  if (!input.email || typeof input.email !== "string") {
    errors.push({ field: "email", message: "Email is required and must be a string" });
  } else if (!isValidEmail(input.email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  if (!input.name || typeof input.name !== "string") {
    errors.push({ field: "name", message: "Name is required and must be a string" });
  }

  if (!input.company || typeof input.company !== "string") {
    errors.push({ field: "company", message: "Company is required and must be a string" });
  }

  if (
    !input.monthly_sqft_target ||
    typeof input.monthly_sqft_target !== "number" ||
    input.monthly_sqft_target <= 0
  ) {
    errors.push({
      field: "monthly_sqft_target",
      message: "Monthly sqft target must be a positive number",
    });
  }

  if (input.segment && !isValidSegment(input.segment)) {
    errors.push({
      field: "segment",
      message: "Invalid customer segment",
    });
  }

  if (!input.source || !isValidSource(input.source)) {
    errors.push({
      field: "source",
      message: 'Source must be one of: "floorforge-site", "ecowoods-referral", "partner", "direct"',
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      email: String(input.email).toLowerCase().trim(),
      name: String(input.name).trim(),
      company: String(input.company).trim(),
      monthly_sqft_target: Number(input.monthly_sqft_target),
      segment: (input.segment as types.CustomerSegment) || undefined,
      state: input.state ? String(input.state).trim() : undefined,
      phone: input.phone ? String(input.phone).trim() : undefined,
      robot_interest: input.robot_interest as types.PilotApplication["robot_interest"],
      challenge: input.challenge ? String(input.challenge).trim() : undefined,
      source: input.source as "floorforge-site" | "ecowoods-referral" | "partner" | "direct",
      source_details: input.source_details ? String(input.source_details).trim() : undefined,
      status: "new" as const,
      internal_notes: input.internal_notes ? String(input.internal_notes).trim() : undefined,
    },
  };
}

export function validatePilotApplicationUpdate(
  data: unknown
): {
  valid: boolean;
  data?: Partial<types.PilotApplication>;
  errors?: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "data", message: "Invalid input" }] };
  }

  const input = data as Record<string, unknown>;
  const updates: Partial<types.PilotApplication> = {};

  // Status update
  if (input.status) {
    if (!isValidPilotApplicationStatus(input.status)) {
      errors.push({ field: "status", message: "Invalid pilot application status" });
    } else {
      updates.status = input.status as types.PilotApplicationStatus;
    }
  }

  // Status reason
  if (input.status_reason) {
    updates.status_reason = String(input.status_reason).trim();
  }

  // Internal notes
  if (input.internal_notes) {
    updates.internal_notes = String(input.internal_notes).trim();
  }

  // Contact timestamp
  if (input.contacted_at) {
    if (!isValidISODate(input.contacted_at)) {
      errors.push({ field: "contacted_at", message: "Invalid ISO 8601 date" });
    } else {
      updates.contacted_at = input.contacted_at as string;
    }
  }

  // Onboard timestamp
  if (input.onboarded_at) {
    if (!isValidISODate(input.onboarded_at)) {
      errors.push({ field: "onboarded_at", message: "Invalid ISO 8601 date" });
    } else {
      updates.onboarded_at = input.onboarded_at as string;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: updates };
}

// ============================================================================
// JOB VALIDATION
// ============================================================================

export function validateJobInput(
  data: unknown
): {
  valid: boolean;
  data?: Omit<types.Job, "created_at" | "updated_at" | "post_job_report">;
  errors?: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "data", message: "Invalid input" }] };
  }

  const input = data as Record<string, unknown>;

  // Required fields
  if (!input.tenant_id || typeof input.tenant_id !== "string") {
    errors.push({ field: "tenant_id", message: "Tenant ID is required" });
  }

  if (!input.site_name || typeof input.site_name !== "string") {
    errors.push({ field: "site_name", message: "Site name is required" });
  }

  if (!input.robot_id || typeof input.robot_id !== "string") {
    errors.push({ field: "robot_id", message: "Robot ID is required" });
  }

  if (!input.sqft || typeof input.sqft !== "number" || input.sqft <= 100) {
    errors.push({ field: "sqft", message: "Square footage must be greater than 100" });
  }

  if (!input.sqm || typeof input.sqm !== "number" || input.sqm <= 0) {
    errors.push({ field: "sqm", message: "Square meters must be a positive number" });
  }

  // Coverage percentage
  if (
    input.coverage_pct !== undefined &&
    (typeof input.coverage_pct !== "number" || input.coverage_pct < 0 || input.coverage_pct > 100)
  ) {
    errors.push({
      field: "coverage_pct",
      message: "Coverage percentage must be between 0 and 100",
    });
  }

  // Optional status
  if (input.status && !isValidJobStatus(input.status)) {
    errors.push({ field: "status", message: "Invalid job status" });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      id: `job-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`,
      tenant_id: String(input.tenant_id),
      site_name: String(input.site_name).trim(),
      site_address: input.site_address ? String(input.site_address).trim() : undefined,
      site_notes: input.site_notes ? String(input.site_notes).trim() : undefined,
      floor_type: input.floor_type ? String(input.floor_type).trim() : undefined,
      floor_condition: input.floor_condition ? String(input.floor_condition).trim() : undefined,
      sqft: Number(input.sqft),
      sqm: Number(input.sqm),
      grit_sequence: Array.isArray(input.grit_sequence)
        ? (input.grit_sequence as string[])
        : undefined,
      robot_id: String(input.robot_id),
      robot_type: input.robot_type ? String(input.robot_type).trim() : undefined,
      operator_ids: Array.isArray(input.operator_ids)
        ? (input.operator_ids as string[])
        : undefined,
      estimated_duration_hours: input.estimated_duration_hours
        ? Number(input.estimated_duration_hours)
        : undefined,
      status: (input.status as types.JobStatus) || ("draft" as const),
      coverage_pct: Number(input.coverage_pct || 0),
      coverage_area_m2: Number(input.coverage_area_m2 || 0),
      time_elapsed_sec: Number(input.time_elapsed_sec || 0),
      time_remaining_sec: input.time_remaining_sec ? Number(input.time_remaining_sec) : undefined,
    },
  };
}

export function validateJobUpdate(
  data: unknown
): {
  valid: boolean;
  data?: Partial<types.Job>;
  errors?: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "data", message: "Invalid input" }] };
  }

  const input = data as Record<string, unknown>;
  const updates: Partial<types.Job> = {};

  // Status
  if (input.status) {
    if (!isValidJobStatus(input.status)) {
      errors.push({ field: "status", message: "Invalid job status" });
    } else {
      updates.status = input.status as types.JobStatus;
    }
  }

  // Coverage
  if (
    input.coverage_pct !== undefined &&
    (typeof input.coverage_pct !== "number" || input.coverage_pct < 0 || input.coverage_pct > 100)
  ) {
    errors.push({
      field: "coverage_pct",
      message: "Coverage percentage must be between 0 and 100",
    });
  } else if (input.coverage_pct !== undefined) {
    updates.coverage_pct = Number(input.coverage_pct);
  }

  if (input.coverage_area_m2 !== undefined) {
    updates.coverage_area_m2 = Number(input.coverage_area_m2);
  }

  // Time tracking
  if (input.time_elapsed_sec !== undefined) {
    updates.time_elapsed_sec = Number(input.time_elapsed_sec);
  }

  if (input.time_remaining_sec !== undefined) {
    updates.time_remaining_sec = Number(input.time_remaining_sec);
  }

  // Current pass
  if (input.current_pass !== undefined) {
    updates.current_pass = Number(input.current_pass);
  }

  // Approval score
  if (input.approval_score !== undefined) {
    if (typeof input.approval_score !== "number" || input.approval_score < 0 || input.approval_score > 100) {
      errors.push({ field: "approval_score", message: "Approval score must be between 0 and 100" });
    } else {
      updates.approval_score = Number(input.approval_score);
    }
  }

  // Site notes
  if (input.site_notes !== undefined) {
    updates.site_notes = input.site_notes ? String(input.site_notes).trim() : undefined;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: updates };
}

// ============================================================================
// TELEMETRY VALIDATION
// ============================================================================

export function validateTelemetryEvent(
  data: unknown
): {
  valid: boolean;
  data?: Omit<types.TelemetryEvent, "id" | "received_at" | "created_at">;
  errors?: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "data", message: "Invalid input" }] };
  }

  const input = data as Record<string, unknown>;

  // Required fields
  if (!input.job_id || typeof input.job_id !== "string") {
    errors.push({ field: "job_id", message: "Job ID is required" });
  }

  if (!input.robot_id || typeof input.robot_id !== "string") {
    errors.push({ field: "robot_id", message: "Robot ID is required" });
  }

  if (!input.timestamp || !isValidISODate(input.timestamp)) {
    errors.push({ field: "timestamp", message: "Valid ISO 8601 timestamp required" });
  }

  if (!input.event_type || !isValidEventType(input.event_type)) {
    errors.push({ field: "event_type", message: "Invalid event type" });
  }

  if (!input.data || typeof input.data !== "object") {
    errors.push({ field: "data", message: "Event data must be a JSON object" });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      job_id: String(input.job_id),
      robot_id: String(input.robot_id),
      timestamp: String(input.timestamp),
      event_type: input.event_type as types.EventType,
      data: (input.data as Record<string, unknown>) || {},
    },
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function isValidSegment(segment: unknown): boolean {
  const validSegments: types.CustomerSegment[] = [
    "residential_high_end",
    "commercial_office",
    "commercial_retail",
    "specialty_wood",
    "facilities_management",
    "other",
  ];
  return typeof segment === "string" && validSegments.includes(segment as types.CustomerSegment);
}

function isValidSource(source: unknown): boolean {
  const validSources = ["floorforge-site", "ecowoods-referral", "partner", "direct"];
  return typeof source === "string" && validSources.includes(source);
}

function isValidPilotApplicationStatus(status: unknown): boolean {
  const validStatuses: types.PilotApplicationStatus[] = [
    "new",
    "contacted",
    "engaged",
    "qualified",
    "accepted",
    "onboarded",
    "piloting",
    "completed",
    "declined",
    "churned",
  ];
  return typeof status === "string" && validStatuses.includes(status as types.PilotApplicationStatus);
}

function isValidJobStatus(status: unknown): boolean {
  const validStatuses: types.JobStatus[] = [
    "draft",
    "queued",
    "in_progress",
    "paused",
    "completed",
    "approved",
    "rework",
    "failed",
    "archived",
  ];
  return typeof status === "string" && validStatuses.includes(status as types.JobStatus);
}

function isValidEventType(eventType: unknown): boolean {
  const validTypes: types.EventType[] = [
    "pass_started",
    "pass_completed",
    "dust_reading",
    "coverage_check",
    "robot_paused",
    "robot_resumed",
    "finish_applied",
    "quality_approved",
    "quality_failed",
    "error",
    "heartbeat",
  ];
  return typeof eventType === "string" && validTypes.includes(eventType as types.EventType);
}

function isValidISODate(date: unknown): boolean {
  if (typeof date !== "string") return false;
  try {
    const d = new Date(date);
    return !isNaN(d.getTime()) && d.toISOString() === date;
  } catch {
    return false;
  }
}
