/**
 * Server-side data access. The only path to tenant data in this product.
 *
 * WHY THIS REPLACES lib/db/client.ts. That module connected with the **anon**
 * key and was imported by exactly four files, all of them API route handlers
 * (`grep -rn "db/client" app lib components`). Not one browser ever used it. So
 * it was a public, RLS-governed key doing server work — and against the
 * migrated schema it could not complete a single query in either direction:
 * every policy in migrations/001 is keyed on `auth.uid()`, which is NULL for a
 * product that authenticates with Clerk (migrations/003 header). It also fell
 * back to `https://example.supabase.co` when unconfigured, so a completely
 * non-functional data layer looked healthy apart from one console warning.
 *
 * THE RULE THIS FILE ENFORCES IN ITS TYPES. Every tenant-scoped function takes
 * `tenantId` as a required parameter, and every query filters on it — including
 * the ones that look up a row by primary key, where it is the difference
 * between "fetch job X" and "fetch job X **if it is ours**". The service role
 * bypasses RLS, so there is no second line of defence underneath this one. That
 * is the trade: authorization is explicit and legible in one place, and it is
 * not optional, because omitting it does not compile.
 *
 * `updateJob(id, tenantId, ...)` is the sharpest example. Its predecessor was
 * `updateJob(id, updates)` with no tenant filter at all — any job id, from any
 * caller, in any tenant.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/db/service";
import type { IdentityStore } from "@/lib/apiAuth";
import * as types from "@/lib/types";

function db(client?: SupabaseClient): SupabaseClient {
  return client ?? getServiceClient();
}

// ============================================================================
// IDENTITY
// ============================================================================

export function createIdentityStore(client?: SupabaseClient): IdentityStore {
  return {
    async findUserByAuthSubject(subject) {
      const { data, error } = await db(client)
        .from("users")
        .select("id, tenant_id, role")
        .eq("auth_subject", subject)
        .maybeSingle();

      if (error) throw new Error(`Identity lookup failed: ${error.message}`);
      return (data as { id: string; tenant_id: string | null; role: types.UserRole } | null) ?? null;
    },
  };
}

// ============================================================================
// PILOT APPLICATIONS
// ============================================================================
//
// Not tenant-scoped: a lead has no tenant until it becomes one. Access is
// controlled by role in the route (requireRole), which is why these functions
// take no tenant id — there is nothing honest to filter on.

export async function createPilotApplication(
  data: Omit<types.PilotApplication, "id" | "created_at" | "updated_at">,
  client?: SupabaseClient
): Promise<types.PilotApplication> {
  const { data: result, error } = await db(client)
    .from("pilot_applications")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create pilot application: ${error.message}`);
  return result as types.PilotApplication;
}

export async function getPilotApplications(
  filters?: { status?: types.PilotApplicationStatus; limit?: number; offset?: number },
  client?: SupabaseClient
): Promise<{ applications: types.PilotApplication[]; total_count: number }> {
  let query = db(client).from("pilot_applications").select("*", { count: "exact" });

  if (filters?.status) query = query.eq("status", filters.status);

  const from = filters?.offset ?? 0;
  const to = from + (filters?.limit ?? 20) - 1;

  const { data, count, error } = await query
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch pilot applications: ${error.message}`);
  return {
    applications: (data ?? []) as types.PilotApplication[],
    total_count: count ?? 0,
  };
}

export async function getPilotApplicationById(
  id: string,
  client?: SupabaseClient
): Promise<types.PilotApplication | null> {
  const { data, error } = await db(client)
    .from("pilot_applications")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch pilot application: ${error.message}`);
  return (data as types.PilotApplication | null) ?? null;
}

export async function updatePilotApplication(
  id: string,
  updates: Partial<types.PilotApplication>,
  client?: SupabaseClient
): Promise<types.PilotApplication | null> {
  const { data, error } = await db(client)
    .from("pilot_applications")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to update pilot application: ${error.message}`);
  return (data as types.PilotApplication | null) ?? null;
}

// ============================================================================
// JOBS — every function below is tenant-scoped, by signature
// ============================================================================

export async function createJob(
  data: Omit<types.Job, "created_at" | "updated_at" | "post_job_report">,
  client?: SupabaseClient
): Promise<types.Job> {
  const { data: result, error } = await db(client)
    .from("jobs")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create job: ${error.message}`);
  return result as types.Job;
}

export async function getJobs(
  tenantId: string,
  filters?: {
    status?: types.JobStatus;
    robot_id?: string;
    limit?: number;
    offset?: number;
  },
  client?: SupabaseClient
): Promise<{ jobs: types.Job[]; total_count: number }> {
  let query = db(client)
    .from("jobs")
    .select("*, post_job_reports(*)", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.robot_id) query = query.eq("robot_id", filters.robot_id);

  const from = filters?.offset ?? 0;
  const to = from + (filters?.limit ?? 20) - 1;

  const { data, count, error } = await query
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch jobs: ${error.message}`);
  return { jobs: (data ?? []) as types.Job[], total_count: count ?? 0 };
}

/**
 * Returns null when the job does not exist **or** belongs to another tenant.
 * One answer for both, deliberately: distinguishing them tells a caller which
 * job ids are real across the whole platform.
 */
export async function getJobById(
  id: string,
  tenantId: string,
  client?: SupabaseClient
): Promise<types.Job | null> {
  const { data, error } = await db(client)
    .from("jobs")
    .select("*, post_job_reports(*)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch job: ${error.message}`);
  return (data as types.Job | null) ?? null;
}

/**
 * Scoped update. The `.eq("tenant_id")` is load-bearing: without it a known job
 * id from any tenant is writable, which is what the previous
 * `updateJob(id, updates)` allowed. Returns null when nothing matched.
 */
export async function updateJob(
  id: string,
  tenantId: string,
  // `post_job_report` is excluded in the type rather than stripped at runtime.
  // It is a joined row from `post_job_reports`, not a column on `jobs`, and
  // passing it through produced a Postgres error that read like a schema
  // problem. Excluding it here means the mistake cannot be made.
  updates: Partial<Omit<types.Job, "post_job_report">>,
  client?: SupabaseClient
): Promise<types.Job | null> {
  const { data, error } = await db(client)
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("*, post_job_reports(*)")
    .maybeSingle();

  if (error) throw new Error(`Failed to update job: ${error.message}`);
  return (data as types.Job | null) ?? null;
}

export async function createPostJobReport(
  data: Omit<types.PostJobReport, "id" | "created_at" | "updated_at">,
  client?: SupabaseClient
): Promise<types.PostJobReport> {
  const { data: result, error } = await db(client)
    .from("post_job_reports")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create post-job report: ${error.message}`);
  return result as types.PostJobReport;
}

// ============================================================================
// ROBOTS
// ============================================================================

export async function getRobots(
  tenantId: string,
  client?: SupabaseClient
): Promise<types.Robot[]> {
  const { data, error } = await db(client)
    .from("robots")
    .select()
    .eq("tenant_id", tenantId)
    .order("id");

  if (error) throw new Error(`Failed to fetch robots: ${error.message}`);
  return (data ?? []) as types.Robot[];
}

export async function getRobotById(
  id: string,
  tenantId: string,
  client?: SupabaseClient
): Promise<types.Robot | null> {
  const { data, error } = await db(client)
    .from("robots")
    .select()
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch robot: ${error.message}`);
  return (data as types.Robot | null) ?? null;
}

// ============================================================================
// ID GENERATION
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
  const num = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${platformMap[platform]}${num}`;
}
