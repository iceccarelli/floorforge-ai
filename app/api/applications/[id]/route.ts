/**
 * GET   /api/applications/[id] - Fetch one pilot application (staff only)
 * PATCH /api/applications/[id] - Work a lead: status, reason, staff notes
 *
 * WHAT CHANGED. Both handlers were open — the route had no auth of any kind, so
 * a single guessed id returned a lead's name, email, phone and internal notes.
 * Both are now staff-only by role and fail closed with 503 when no identity
 * provider is configured.
 *
 * `PATCH` also repeated the defect the jobs route had: it hand-rolled an
 * allowlist and assigned `allowedUpdates.status = body.status` with no enum
 * check, although `validatePilotApplicationUpdate` had existed at
 * `lib/validators.ts:105` the whole time as dead code. It now goes through the
 * validator, which checks the status against the enum and the timestamps
 * against ISO 8601.
 *
 * This is the one route where `internal_notes` is legitimately writable — it is
 * staff commentary, written by staff. The public form no longer touches it.
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/server";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";
import { requireOperator, requireRole, OperatorAuthError } from "@/lib/apiAuth";
import { PIPELINE_ROLES } from "../route";
import { ServiceClientUnavailableError } from "@/lib/db/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const identity = await requireOperator(db.createIdentityStore());
    requireRole(identity, PIPELINE_ROLES);

    const { id } = await params;
    const application = await db.getPilotApplicationById(id);
    if (!application) {
      return NextResponse.json(errorBody("NOT_FOUND", `No application ${id}`), {
        status: 404,
      });
    }

    return NextResponse.json(
      { data: application } as types.ApiResponse<types.PilotApplication>,
      { status: 200 }
    );
  } catch (error) {
    const handled = failureResponse(error);
    if (handled) return handled;

    console.error("GET /api/applications/[id] error:", error);
    return NextResponse.json(
      errorBody(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      ),
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const identity = await requireOperator(db.createIdentityStore());
    requireRole(identity, PIPELINE_ROLES);

    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        errorBody("MALFORMED_BODY", "Request body is not valid JSON"),
        { status: 400 }
      );
    }

    const validation = validators.validatePilotApplicationUpdate(body);
    if (!validation.valid) {
      return NextResponse.json(
        errorBody("VALIDATION_ERROR", "Invalid input", { errors: validation.errors }),
        { status: 400 }
      );
    }

    const updates = validation.data!;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        errorBody("VALIDATION_ERROR", "No updatable fields supplied"),
        { status: 400 }
      );
    }

    const updated = await db.updatePilotApplication(id, updates);
    if (!updated) {
      return NextResponse.json(errorBody("NOT_FOUND", `No application ${id}`), {
        status: 404,
      });
    }

    return NextResponse.json(
      { data: updated } as types.ApiResponse<types.PilotApplication>,
      { status: 200 }
    );
  } catch (error) {
    const handled = failureResponse(error);
    if (handled) return handled;

    console.error("PATCH /api/applications/[id] error:", error);
    return NextResponse.json(
      errorBody(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      ),
      { status: 500 }
    );
  }
}
