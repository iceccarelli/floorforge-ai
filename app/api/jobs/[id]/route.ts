/**
 * GET   /api/jobs/[id] - Fetch a single job
 * PATCH /api/jobs/[id] - Update a job
 *
 * WHAT CHANGED AND WHY.
 *
 * `PATCH` hand-rolled its own allowlist and wrote `allowedUpdates.status =
 * body.status` with no enum check, although `lib/validators.ts:248` already
 * defined `validateJobUpdate`, which checks the enum and bounds `coverage_pct`
 * and `approval_score`. The validator was dead code and `{"status":"finished!"}`
 * reached Postgres. It now goes through the validator.
 *
 * Status changes are additionally checked against `lib/jobState.ts`, so a job
 * cannot reach `approved` without having been `completed` first. A completion
 * report is a commercial document; if `approved` can be set from `draft` then
 * every report, warranty and pilot metric derived from it means nothing.
 *
 * `GET` called `db.getJobById(id)` with one argument although the helper takes
 * an optional `tenant_id` (`lib/db/client.ts:149-165`), so any job id read any
 * job, in any tenant. It is now scoped.
 *
 * WHAT IS STILL NOT FIXED, STATED PLAINLY. `tenant_id` arrives as a query
 * parameter, so this is *scoping*, not *authorisation*: it narrows what a
 * request touches but does not verify that the caller belongs to that tenant.
 * The real boundary needs an identity mapping between the session and
 * `users.tenant_id`, which this repository does not have yet — `users` has no
 * column linking it to a Clerk subject. That is the named next mission in
 * FLOORFORGE_SYSTEM_BASELINE.md, and calling this fixed before then would be
 * exactly the kind of claim the rest of the codebase is careful not to make.
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/client";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";
import { assertTransition, IllegalTransitionError } from "@/lib/jobState";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

function errorBody(code: string, message: string, details?: Record<string, unknown>) {
  return { error: { code, message, details } } as types.ApiResponse<never>;
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const tenantId = req.nextUrl.searchParams.get("tenant_id");

    if (!tenantId) {
      return NextResponse.json(
        errorBody(
          "MISSING_PARAMETER",
          "tenant_id is required. A job is only ever fetched within a tenant."
        ),
        { status: 400 }
      );
    }

    const job = await db.getJobById(id, tenantId);

    return NextResponse.json(
      { data: job } as types.ApiResponse<types.Job>,
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json(
      errorBody("NOT_FOUND", error instanceof Error ? error.message : "Job not found"),
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const tenantId = req.nextUrl.searchParams.get("tenant_id");

    if (!tenantId) {
      return NextResponse.json(
        errorBody(
          "MISSING_PARAMETER",
          "tenant_id is required. A job is only ever updated within a tenant."
        ),
        { status: 400 }
      );
    }

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
        errorBody("VALIDATION_ERROR", "Invalid input", {
          errors: validation.errors,
        }),
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
    // migrations/002_telemetry_integrity.sql §6 is what makes the rule hold
    // under concurrency. This check exists so the caller gets a 409 naming what
    // was allowed, rather than an opaque Postgres exception.
    let current: types.Job;
    try {
      current = await db.getJobById(id, tenantId);
    } catch {
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
            errorBody(error.code, error.message, {
              from: error.from,
              to: error.to,
            }),
            { status: 409 }
          );
        }
        throw error;
      }
    }

    const updated = await db.updateJob(id, updates);

    return NextResponse.json(
      { data: updated } as types.ApiResponse<types.Job>,
      { status: 200 }
    );
  } catch (error) {
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
