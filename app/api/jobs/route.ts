/**
 * POST /api/jobs - Create job
 * GET /api/jobs - List jobs for authenticated user's tenant
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/client";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";

// ============================================================================
// POST /api/jobs
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // TODO: Add auth check - extract tenant_id from auth context
    // For now, tenant_id must be provided in request body.

    // Validate input
    const validation = validators.validateJobInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: { errors: validation.errors },
          },
        } as types.ApiResponse<never>,
        { status: 400 }
      );
    }

    // Create job
    const job = await db.createJob(validation.data!);

    // Create associated post-job report (draft)
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

    return NextResponse.json(
      {
        data: job,
      } as types.ApiResponse<types.Job>,
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      } as types.ApiResponse<never>,
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/jobs
// ============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Extract tenant_id from auth context
    // For now, require it as a query parameter.
    const tenantId = req.nextUrl.searchParams.get("tenant_id");
    const status = req.nextUrl.searchParams.get("status");
    const robotId = req.nextUrl.searchParams.get("robot_id");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);

    if (!tenantId) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_PARAMETER",
            message: "tenant_id is required",
          },
        } as types.ApiResponse<never>,
        { status: 400 }
      );
    }

    // Fetch jobs
    const { jobs, total_count } = await db.getJobs(tenantId, {
      status: status as types.JobStatus | undefined,
      robot_id: robotId || undefined,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    });

    const response: types.ApiResponse<types.PaginatedResponse<types.Job>> = {
      data: {
        data: jobs,
        total_count,
        offset,
        limit,
        has_more: offset + limit < total_count,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      } as types.ApiResponse<never>,
      { status: 500 }
    );
  }
}
