/**
 * POST /api/applications - Submit a pilot application (public)
 * GET  /api/applications - List pilot applications (staff only)
 *
 * These two handlers sit on opposite sides of the trust boundary and it is
 * worth being explicit about why.
 *
 * `POST` is the public waitlist form (`lib/waitlist.ts:103`). It takes input
 * from anyone, which is the point. Its guard is the validator, which forces
 * `status: "new"` and — since this change — refuses to read `internal_notes`
 * from the request at all. That field is what the operator console renders as
 * staff commentary on a lead, and it was being written from an unauthenticated
 * form.
 *
 * `GET` is the sales pipeline. It carried the comment "TODO: Add auth check…
 * For now, this is open for demo purposes." and returned every lead's name,
 * email, phone, company and internal notes to anyone who asked. It is now
 * staff-only by role, and fails closed: with no identity provider configured it
 * answers 503, never data.
 *
 * Applications are deliberately NOT tenant-scoped. A lead has no tenant until
 * it becomes one, so there is nothing honest to filter on — access is a role
 * question, and `requireRole` is the whole of it.
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/server";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";
import {
  requireOperator,
  requireRole,
  OperatorAuthError,
} from "@/lib/apiAuth";
import { ServiceClientUnavailableError } from "@/lib/db/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Who may read and work the pipeline. `pilot_technician` and `pilot_customer`
 * are a contractor's own staff and have no business in it.
 */
export const PIPELINE_ROLES: readonly types.UserRole[] = Object.freeze([
  "system_admin",
  "pilot_admin",
  "support",
]);

function errorBody(code: string, message: string, details?: Record<string, unknown>) {
  return { error: { code, message, details } } as types.ApiResponse<never>;
}

function failureResponse(error: unknown): NextResponse | null {
  if (error instanceof OperatorAuthError) {
    return NextResponse.json(errorBody(error.code, error.message), {
      status: error.status,
    });
  }
  if (error instanceof ServiceClientUnavailableError) {
    return NextResponse.json(errorBody("DATABASE_NOT_CONFIGURED", error.message), {
      status: 503,
    });
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        errorBody("MALFORMED_BODY", "Request body is not valid JSON"),
        { status: 400 }
      );
    }

    const validation = validators.validatePilotApplicationInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        errorBody("VALIDATION_ERROR", "Invalid input", { errors: validation.errors }),
        { status: 400 }
      );
    }

    const application = await db.createPilotApplication(validation.data!);

    return NextResponse.json(
      { data: application } as types.ApiResponse<types.PilotApplication>,
      { status: 201 }
    );
  } catch (error) {
    const handled = failureResponse(error);
    if (handled) return handled;

    console.error("POST /api/applications error:", error);
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
    requireRole(identity, PIPELINE_ROLES);

    const status = req.nextUrl.searchParams.get("status");
    const limit = Math.min(
      Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "20", 10) || 20, 1),
      100
    );
    const offset = Math.max(
      parseInt(req.nextUrl.searchParams.get("offset") || "0", 10) || 0,
      0
    );

    const { applications, total_count } = await db.getPilotApplications({
      status: status as types.PilotApplicationStatus | undefined,
      limit,
      offset,
    });

    return NextResponse.json(
      {
        data: {
          data: applications,
          total_count,
          offset,
          limit,
          has_more: offset + limit < total_count,
        },
      } as types.ApiResponse<types.PaginatedResponse<types.PilotApplication>>,
      { status: 200 }
    );
  } catch (error) {
    const handled = failureResponse(error);
    if (handled) return handled;

    console.error("GET /api/applications error:", error);
    return NextResponse.json(
      errorBody(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      ),
      { status: 500 }
    );
  }
}
