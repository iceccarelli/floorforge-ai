/**
 * Supabase Database Client
 * Provides typed query helpers for common operations.
 */

import { createClient } from "@supabase/supabase-js";
import * as types from "../types";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Database operations will fail. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// PILOT APPLICATIONS
// ============================================================================

export async function createPilotApplication(
  data: Omit<types.PilotApplication, "id" | "created_at" | "updated_at">
): Promise<types.PilotApplication> {
  const { data: result, error } = await supabase
    .from("pilot_applications")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create pilot application: ${error.message}`);
  return result;
}

export async function getPilotApplications(
  filters?: {
    status?: types.PilotApplicationStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ applications: types.PilotApplication[]; total_count: number }> {
  let query = supabase.from("pilot_applications").select("*", { count: "exact" });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const from = filters?.offset || 0;
  const to = from + (filters?.limit || 20) - 1;
  query = query.range(from, to).order("created_at", { ascending: false });

  const { data, count, error } = await query;

  if (error) throw new Error(`Failed to fetch pilot applications: ${error.message}`);

  return {
    applications: (data || []) as types.PilotApplication[],
    total_count: count || 0,
  };
}

export async function getPilotApplicationById(
  id: string
): Promise<types.PilotApplication> {
  const { data, error } = await supabase
    .from("pilot_applications")
    .select()
    .eq("id", id)
    .single();

  if (error) throw new Error(`Failed to fetch pilot application: ${error.message}`);
  return data;
}

export async function updatePilotApplication(
  id: string,
  updates: Partial<types.PilotApplication>
): Promise<types.PilotApplication> {
  const { data, error } = await supabase
    .from("pilot_applications")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update pilot application: ${error.message}`);
  return data;
}

// ============================================================================
// JOBS
// ============================================================================

export async function createJob(
  data: Omit<types.Job, "created_at" | "updated_at" | "post_job_report">
): Promise<types.Job> {
  const { data: result, error } = await supabase
    .from("jobs")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create job: ${error.message}`);
  return result;
}

export async function getJobs(
  tenant_id: string,
  filters?: {
    status?: types.JobStatus;
    robot_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ jobs: types.Job[]; total_count: number }> {
  let query = supabase
    .from("jobs")
    .select("*, post_job_reports(*)", { count: "exact" })
    .eq("tenant_id", tenant_id);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.robot_id) {
    query = query.eq("robot_id", filters.robot_id);
  }

  const from = filters?.offset || 0;
  const to = from + (filters?.limit || 20) - 1;
  query = query.range(from, to).order("created_at", { ascending: false });

  const { data, count, error } = await query;

  if (error) throw new Error(`Failed to fetch jobs: ${error.message}`);

  return {
    jobs: (data || []) as types.Job[],
    total_count: count || 0,
  };
}

export async function getJobById(
  id: string,
  tenant_id?: string
): Promise<types.Job> {
  let query = supabase
    .from("jobs")
    .select("*, post_job_reports(*)")
    .eq("id", id);

  if (tenant_id) {
    query = query.eq("tenant_id", tenant_id);
  }

  const { data, error } = await query.single();

  if (error) throw new Error(`Failed to fetch job: ${error.message}`);
  return data;
}

export async function updateJob(
  id: string,
  updates: Partial<types.Job>
): Promise<types.Job> {
  const { post_job_report, ...jobUpdates } = updates;

  const { data, error } = await supabase
    .from("jobs")
    .update(jobUpdates)
    .eq("id", id)
    .select("*, post_job_reports(*)")
    .single();

  if (error) throw new Error(`Failed to update job: ${error.message}`);
  return data;
}

// ============================================================================
// POST-JOB REPORTS
// ============================================================================

export async function createPostJobReport(
  data: Omit<types.PostJobReport, "id" | "created_at" | "updated_at">
): Promise<types.PostJobReport> {
  const { data: result, error } = await supabase
    .from("post_job_reports")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create post-job report: ${error.message}`);
  return result;
}

export async function getPostJobReportByJobId(
  job_id: string
): Promise<types.PostJobReport | null> {
  const { data, error } = await supabase
    .from("post_job_reports")
    .select()
    .eq("job_id", job_id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    throw new Error(`Failed to fetch post-job report: ${error.message}`);
  }

  return data || null;
}

export async function updatePostJobReport(
  id: string,
  updates: Partial<types.PostJobReport>
): Promise<types.PostJobReport> {
  const { data, error } = await supabase
    .from("post_job_reports")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update post-job report: ${error.message}`);
  return data;
}

// ============================================================================
// ROBOTS
// ============================================================================

export async function getRobots(
  tenant_id: string
): Promise<types.Robot[]> {
  const { data, error } = await supabase
    .from("robots")
    .select()
    .eq("tenant_id", tenant_id)
    .order("id");

  if (error) throw new Error(`Failed to fetch robots: ${error.message}`);
  return data || [];
}

export async function getRobotById(
  id: string,
  tenant_id?: string
): Promise<types.Robot> {
  let query = supabase.from("robots").select().eq("id", id);

  if (tenant_id) {
    query = query.eq("tenant_id", tenant_id);
  }

  const { data, error } = await query.single();

  if (error) throw new Error(`Failed to fetch robot: ${error.message}`);
  return data;
}

export async function updateRobot(
  id: string,
  updates: Partial<types.Robot>
): Promise<types.Robot> {
  const { data, error } = await supabase
    .from("robots")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update robot: ${error.message}`);
  return data;
}

// ============================================================================
// TELEMETRY EVENTS
// ============================================================================

export async function createTelemetryEvent(
  data: Omit<types.TelemetryEvent, "id" | "received_at" | "created_at">
): Promise<types.TelemetryEvent> {
  const { data: result, error } = await supabase
    .from("telemetry_events")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create telemetry event: ${error.message}`);
  return result;
}

export async function getTelemetryEvents(
  job_id: string,
  filters?: {
    event_type?: types.EventType;
    limit?: number;
    offset?: number;
  }
): Promise<{ events: types.TelemetryEvent[]; total_count: number }> {
  let query = supabase
    .from("telemetry_events")
    .select("*", { count: "exact" })
    .eq("job_id", job_id);

  if (filters?.event_type) {
    query = query.eq("event_type", filters.event_type);
  }

  const from = filters?.offset || 0;
  const to = from + (filters?.limit || 50) - 1;
  query = query.range(from, to).order("timestamp", { ascending: false });

  const { data, count, error } = await query;

  if (error) throw new Error(`Failed to fetch telemetry events: ${error.message}`);

  return {
    events: (data || []) as types.TelemetryEvent[],
    total_count: count || 0,
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function createTelemetryEventBatch(
  events: Array<Omit<types.TelemetryEvent, "id" | "received_at" | "created_at">>
): Promise<types.TelemetryEvent[]> {
  const { data, error } = await supabase
    .from("telemetry_events")
    .insert(events)
    .select();

  if (error) throw new Error(`Failed to batch insert telemetry events: ${error.message}`);
  return data || [];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `job-${timestamp}${random}`;
}

export function createRobotId(platform: types.RobotPlatform): string {
  const platformMap: Record<types.RobotPlatform, string> = {
    sand: "FF-S",
    edge: "FF-E",
    coat: "FF-C",
    lay: "FF-L",
    scan: "FF-X",
  };
  const prefix = platformMap[platform];
  const num = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${num}`;
}
