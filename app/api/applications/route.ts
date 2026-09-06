/**
 * POST /api/applications - Create pilot application
 * GET /api/applications - List pilot applications (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/client";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";
import { requireOperator, OperatorAuthError } from "@/lib/apiAuth";

// ============================================================================
// POST /api/applications
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validate input
    const validation = validators.validatePilotApplicationInput(body);
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

    // Create application
    const application = await db.createPilotApplication(validation.data!);

    return NextResponse.json(
      {
        data: application,
      } as types.ApiResponse<types.PilotApplication>,
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/applications error:", error);
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
// GET /api/applications
// ============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // The pilot pipeline is the company's sales pipeline. Before this guard
    // the route's own comment said "For now, this is open for demo purposes."
    // and it returned every lead's name, email, phone and internal notes to
    // anyone who asked. Unconfigured auth now yields 503, never data.
    await requireOperator();

    // Extract query parameters
    const status = req.nextUrl.searchParams.get("status");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);

    // Fetch applications
    const { applications, total_count } = await db.getPilotApplications({
      status: status as types.PilotApplicationStatus | undefined,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    });

    const response: types.ApiResponse<types.PaginatedResponse<types.PilotApplication>> = {
      data: {
        data: applications,
        total_count,
        offset,
        limit,
        has_more: offset + limit < total_count,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof OperatorAuthError) {
      return NextResponse.json(
        {
          error: { code: error.code, message: error.message },
        } as types.ApiResponse<never>,
        { status: error.status }
      );
    }

    console.error("GET /api/applications error:", error);
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
