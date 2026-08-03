/**
 * PATCH /api/applications/[id] - Update pilot application status
 * GET /api/applications/[id] - Fetch single application
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
    const application = await db.getPilotApplicationById(params.id);

    return NextResponse.json(
      {
        data: application,
      } as types.ApiResponse<types.PilotApplication>,
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/applications/[id] error:", error);
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : "Application not found",
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

    // Only allow updating status, status_reason, and internal_notes
    const allowedUpdates: Partial<types.PilotApplication> = {};

    if ("status" in body && body.status) {
      allowedUpdates.status = body.status;
    }
    if ("status_reason" in body) {
      allowedUpdates.status_reason = body.status_reason;
    }
    if ("internal_notes" in body) {
      allowedUpdates.internal_notes = body.internal_notes;
    }

    const updated = await db.updatePilotApplication(params.id, allowedUpdates);

    return NextResponse.json(
      {
        data: updated,
      } as types.ApiResponse<types.PilotApplication>,
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/applications/[id] error:", error);
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
