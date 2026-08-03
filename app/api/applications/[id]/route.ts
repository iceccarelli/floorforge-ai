/**
 * GET /api/applications/[id] - Get single application
 * PATCH /api/applications/[id] - Update application
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/client";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";

// ============================================================================
// GET /api/applications/[id]
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // TODO: Add auth check - user must be admin or own the application
    // For now, this is open for demo purposes.

    const application = await db.getPilotApplicationById(id);

    return NextResponse.json(
      {
        data: application,
      } as types.ApiResponse<types.PilotApplication>,
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Application not found",
          },
        } as types.ApiResponse<never>,
        { status: 404 }
      );
    }

    console.error("GET /api/applications/[id] error:", error);
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
// PATCH /api/applications/[id]
// ============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await req.json();

    // TODO: Add auth check - only admin can update
    // For now, this is open for demo purposes.

    // Validate updates
    const validation = validators.validatePilotApplicationUpdate(body);
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

    // Update application
    const application = await db.updatePilotApplication(id, validation.data!);

    return NextResponse.json(
      {
        data: application,
      } as types.ApiResponse<types.PilotApplication>,
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Application not found",
          },
        } as types.ApiResponse<never>,
        { status: 404 }
      );
    }

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
