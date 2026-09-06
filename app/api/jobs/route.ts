/**
 * POST /api/jobs - Create a job in the caller's tenant
 * GET  /api/jobs - List jobs in the caller's tenant
 *
 * WHAT CHANGED. Both handlers used to carry `// TODO: Add auth check` and take
 * `tenant_id` from the request — the body on POST, a query parameter on GET. The
 * caller chose whose data to create and read. Tenancy now comes from the
 * session (`lib/apiAuth.ts`), and `tenant_id` in a request is either ignored or
 * refused, never obeyed.
 *
 * Platform staff (system_admin, support) may still name a tenant, because
 * supporting a pilot means being able to look at it. Everyone else is pinned to
 * their own, and a mismatched `tenant_id` is a 403 rather than a silent
 * substitution — a client sending the wrong tenant is broken or probing, and
 * quietly returning the right answer teaches neither of them anything.
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/server";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";
import {
  requireOperator,
  resolveTenantScope,
  OperatorAuthError,
} from "@/lib/apiAuth";
import { ServiceClientUnavailableError } from "@/lib/db/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorBody(code: string, message: string, details?: Record<string, unknown>) {
  return { error: { code, message, details } } as types.ApiResponse<never>;
}

/** One place that turns an auth or configuration failure into a response. */
function failureResponse(error: unknown): NextResponse | null {
  if (error instanceof OperatorAuthError) {
    return NextResponse.json(errorBody(error.code, error.message), {
      status: error.status,
    });
  }
  if (error instanceof ServiceClientUnavailableError) {
    return NextResponse.json(
      errorBody("DATABASE_NOT_CONFIGURED", error.message),
      { status: 503 }
    );
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const identity = await requireOperator(db.createIdentityStore());

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        errorBody("MALFORMED_BODY", "Request body is not valid JSON"),
        { status: 400 }
      );
    }

    const requestedTenant =
      body && typeof body === "object" && "tenant_id" in body
        ? String((body as Record<string, unknown>).tenant_id)
        : null;
    const tenantId = resolveTenantScope(identity, requestedTenant);

    // The tenant is overwritten, not trusted. validateJobInput requires the
    // field, and this is the value it must see.
    const validation = validators.validateJobInput({
      ...(body as Record<string, unknown>),
      tenant_id: tenantId,
    });
    if (!validation.valid) {
      return NextResponse.json(
        errorBody("VALIDATION_ERROR", "Invalid input", { errors: validation.errors }),
        { status: 400 }
      );
    }

    // A job may only be assigned a robot in the same tenant. Without this,
    // telemetry, quality evidence and the completion report for this job are
    // attributed across a tenant boundary. migrations/003 §4 enforces the same
    // rule in the database for writes that never come through here.
    const robot = await db.getRobotById(validation.data!.robot_id, tenantId);
    if (!robot) {
      return NextResponse.json(
        errorBody(
          "ROBOT_NOT_FOUND",
          `No robot ${validation.data!.robot_id} in this tenant.`
        ),
        { status: 400 }
      );
    }

    const job = await db.createJob(validation.data!);

    await db.createPostJobReport({
      job_id: job.id,
      status: "draft",
      grit_sequence_executed: [],
      total_coverage_area_m2: 0,
      total_time_hours: 0,
      coverage_approval: false,
      coverage_approval_score: 0,
      avg_dust_ugm3: 0,
      dust_peak_ugm3: 0,
      dust_samples_count: 0,
      photos: [],
    });

    return NextResponse.json({ data: job } as types.ApiResponse<types.Job>, {
      status: 201,
    });
  } catch (error) {
    const handled = failureResponse(error);
    if (handled) return handled;

    console.error("POST /api/jobs error:", error);
    return NextResponse.json(
      errorBody(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      ),
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const identity = await requireOperator(db.createIdentityStore());
    const tenantId = resolveTenantScope(
      identity,
      req.nextUrl.searchParams.get("tenant_id")
    );

    const status = req.nextUrl.searchParams.get("status");
    const limit = Math.min(
      Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "20", 10) || 20, 1),
      100
    );
    const offset = Math.max(
      parseInt(req.nextUrl.searchParams.get("offset") || "0", 10) || 0,
      0
    );

    const { jobs, total_count } = await db.getJobs(tenantId, {
      status: status as types.JobStatus | undefined,
      robot_id: req.nextUrl.searchParams.get("robot_id") || undefined,
      limit,
      offset,
    });

    return NextResponse.json(
      {
        data: {
          data: jobs,
          total_count,
          offset,
          limit,
          has_more: offset + limit < total_count,
        },
      } as types.ApiResponse<types.PaginatedResponse<types.Job>>,
      { status: 200 }
    );
  } catch (error) {
    const handled = failureResponse(error);
    if (handled) return handled;

    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      errorBody(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      ),
      { status: 500 }
    );
  }
}
