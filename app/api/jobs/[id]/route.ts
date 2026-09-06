/**
 * GET   /api/jobs/[id] - Fetch one job, within the caller's tenant
 * PATCH /api/jobs/[id] - Update one job, within the caller's tenant
 *
 * WHAT CHANGED, IN ORDER OF SEVERITY.
 *
 * `GET` called `db.getJobById(id)` with a single argument although the helper
 * accepted a tenant, so any job id read any job in any tenant. `PATCH` called
 * `updateJob(id, updates)`, which had no tenant filter at all — a known id from
 * any caller was writable. Both are now scoped by a tenant resolved from the
 * session, not from the request (`lib/apiAuth.ts`).
 *
 * `PATCH` also hand-rolled its own allowlist and wrote `allowedUpdates.status =
 * body.status` with **no enum check**, although `validateJobUpdate` had existed
 * at `lib/validators.ts:248` the whole time as dead code — so
 * `{"status":"definitely_finished"}` reached Postgres. It goes through the
 * validator now, and through the state machine in `lib/jobState.ts`: a job
 * cannot reach `approved` without having run. A completion report is a
 * commercial document; if `approved` can be set on a job that never started,
 * every report, warranty and pilot metric derived from it means nothing.
 *
 * A missing job and a job in another tenant return the same 404. Distinguishing
 * them tells a caller which job ids are real across the whole platform.
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/server";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";
import { assertTransition, IllegalTransitionError } from "@/lib/jobState";
import {
  requireOperator,
  resolveTenantScope,
  OperatorAuthError,
} from "@/lib/apiAuth";
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
    const tenantId = resolveTenantScope(
      identity,
      req.nextUrl.searchParams.get("tenant_id")
    );
    const { id } = await params;

    const job = await db.getJobById(id, tenantId);
    if (!job) {
      return NextResponse.json(errorBody("NOT_FOUND", `No job ${id}`), {
        status: 404,
      });
    }

    return NextResponse.json({ data: job } as types.ApiResponse<types.Job>, {
      status: 200,
    });
  } catch (error) {
    const handled = failureResponse(error);
    if (handled) return handled;

    console.error("GET /api/jobs/[id] error:", error);
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
    const tenantId = resolveTenantScope(
      identity,
      req.nextUrl.searchParams.get("tenant_id")
    );
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

    const validation = validators.validateJobUpdate(body);
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

    // A status change is checked against the current status, so the job has to
    // be read first. This read-then-write is not atomic; the trigger in
    // migrations/002 §6 is what makes the rule hold under concurrency. This
    // check exists so the caller gets a 409 naming what was allowed instead of
    // an opaque Postgres exception.
    const current = await db.getJobById(id, tenantId);
    if (!current) {
      return NextResponse.json(errorBody("NOT_FOUND", `No job ${id}`), {
        status: 404,
      });
    }

    if (updates.status) {
      try {
        assertTransition(current.status, updates.status);
      } catch (error) {
        if (error instanceof IllegalTransitionError) {
          return NextResponse.json(
            errorBody(error.code, error.message, { from: error.from, to: error.to }),
            { status: 409 }
          );
        }
        throw error;
      }
    }

    const updated = await db.updateJob(id, tenantId, updates);
    if (!updated) {
      // The row vanished or moved tenant between the read and the write.
      return NextResponse.json(errorBody("NOT_FOUND", `No job ${id}`), {
        status: 404,
      });
    }

    return NextResponse.json({ data: updated } as types.ApiResponse<types.Job>, {
      status: 200,
    });
  } catch (error) {
    const handled = failureResponse(error);
    if (handled) return handled;

    console.error("PATCH /api/jobs/[id] error:", error);
    return NextResponse.json(
      errorBody(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      ),
      { status: 500 }
    );
  }
}
