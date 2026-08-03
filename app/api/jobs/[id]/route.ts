/**
 * PATCH /api/jobs/[id] - Update job status
 * GET /api/jobs/[id] - Fetch single job with telemetry
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/client";
import * as types from "@/lib/types";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const job = await db.getJobById(params.id);

    return NextResponse.json(
      {
        data: job,
      } as types.ApiResponse<types.Job>,
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : "Job not found",
        },
      } as types.ApiResponse<never>,
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Only allow updating status, coverage, and time fields
    const allowedUpdates: Partial<types.Job> = {};

    if ("status" in body && body.status) {
      allowedUpdates.status = body.status;
    }
    if ("coverage_pct" in body && typeof body.coverage_pct === "number") {
      allowedUpdates.coverage_pct = body.coverage_pct;
    }
    if ("coverage_area_m2" in body && typeof body.coverage_area_m2 === "number") {
      allowedUpdates.coverage_area_m2 = body.coverage_area_m2;
    }
    if ("time_elapsed_sec" in body && typeof body.time_elapsed_sec === "number") {
      allowedUpdates.time_elapsed_sec = body.time_elapsed_sec;
    }
    if ("approval_score" in body && typeof body.approval_score === "number") {
      allowedUpdates.approval_score = body.approval_score;
    }

    const updated = await db.updateJob(params.id, allowedUpdates);

    return NextResponse.json(
      {
        data: updated,
      } as types.ApiResponse<types.Job>,
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/jobs/[id] error:", error);
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
