/**
 * GET /api/jobs/[id] - Get single job + telemetry
 * PATCH /api/jobs/[id] - Update job status, coverage, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/client";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";

// ============================================================================
// GET /api/jobs/[id]
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // TODO: Add auth check - user must have access to job's tenant
    // For now, this is open for demo purposes.

    // Fetch job with post-job report
    const job = await db.getJobById(id);

    // Fetch telemetry events
    const { events } = await db.getTelemetryEvents(id, {
      limit: 100,
      offset: 0,
    });

    // Enrich response with telemetry
    const response: types.ApiResponse<types.Job & { telemetry_events: types.TelemetryEvent[] }> = {
      data: {
        ...job,
        telemetry_events: events,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Job not found",
          },
        } as types.ApiResponse<never>,
        { status: 404 }
      );
    }

    console.error("GET /api/jobs/[id] error:", error);
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
// PATCH /api/jobs/[id]
// ============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await req.json();

    // TODO: Add auth check - user must have access to job's tenant
    // For now, this is open for demo purposes.

    // Validate updates
    const validation = validators.validateJobUpdate(body);
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

    // Update job
    const job = await db.updateJob(id, validation.data!);

    return NextResponse.json(
      {
        data: job,
      } as types.ApiResponse<types.Job>,
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Job not found",
          },
        } as types.ApiResponse<never>,
        { status: 404 }
      );
    }

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
