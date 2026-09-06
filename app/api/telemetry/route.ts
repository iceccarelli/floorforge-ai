/**
 * POST /api/telemetry — ingest telemetry from an authenticated device.
 * GET  /api/telemetry/resume?job_id=&robot_id= is served from this route's
 *      sibling; see lib/telemetry/ingest.ts for the delivery contract.
 *
 * This file is deliberately thin. Every decision that matters — who may write,
 * what a duplicate is, what happens to a poison event — lives in
 * lib/telemetry/ingest.ts, where it is a pure function of an injected store and
 * is covered by tests/contract/telemetry-ingest.test.mjs. What is left here is
 * HTTP: read a header, pick a status code, shape a body.
 *
 * STATUS CODES, and why they are what they are. A machine has to be able to
 * branch on the answer without parsing prose:
 *
 *   200  the batch was processed. Read `accepted`, `duplicate` and `rejected`.
 *        All three outcomes are terminal — drop those events from the buffer.
 *   401  the device key is missing, unknown or revoked. Do not retry; escalate.
 *   400  the body is not a telemetry envelope at all.
 *   413  the batch is too large. Split it and resend.
 *   422  every event in the batch was rejected. The batch is poison; the body
 *        says why, per event. Retrying it unchanged will never succeed.
 *   503  this deployment has no telemetry database configured.
 *   500  something else. Retry with backoff; the events are not stored.
 *
 * 422 rather than 200 for a wholly-rejected batch is the one debatable choice.
 * It is deliberate: a 200 there would make a machine emitting nothing but
 * malformed events indistinguishable, to every dashboard and alert, from a
 * machine running perfectly.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  ingestTelemetry,
  IngestError,
  type IngestReport,
} from "@/lib/telemetry/ingest";
import {
  createSupabaseTelemetryStore,
  ServiceClientUnavailableError,
} from "@/lib/db/service";
import type * as types from "@/lib/types";

// node:crypto, and the service-role client, are not available on the edge
// runtime. Stating it here means a future default change cannot silently move
// this route somewhere its dependencies do not exist.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sha256Hex = (input: string): string =>
  createHash("sha256").update(input, "utf8").digest("hex");

function errorBody(code: string, message: string, details?: Record<string, unknown>) {
  return { error: { code, message, details } } as types.ApiResponse<never>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      errorBody("MALFORMED_BODY", "Request body is not valid JSON"),
      { status: 400 }
    );
  }

  try {
    const report: IngestReport = await ingestTelemetry({
      store: createSupabaseTelemetryStore(),
      sha256Hex,
      authorizationHeader: req.headers.get("authorization"),
      body,
    });

    // Every event refused: the batch cannot succeed on retry, and a monitor
    // watching error rates must be able to see it.
    const status = report.accepted + report.duplicate === 0 ? 422 : 200;

    // One structured line per request. There is no observability in this
    // repository yet (FLOORFORGE_SYSTEM_BASELINE.md §1); a parseable log is the
    // smallest thing that makes ingest loss visible before a contractor
    // reports it.
    console.log(
      JSON.stringify({
        at: "telemetry.ingest",
        accepted: report.accepted,
        duplicate: report.duplicate,
        rejected: report.rejected,
        reject_codes: Array.from(
          new Set(
            report.results
              .filter((r) => r.outcome === "rejected")
              .map((r) => r.reason_code)
          )
        ),
      })
    );

    return NextResponse.json({ data: report }, { status });
  } catch (error) {
    if (error instanceof IngestError) {
      return NextResponse.json(errorBody(error.code, error.message), {
        status: error.status,
      });
    }

    if (error instanceof ServiceClientUnavailableError) {
      return NextResponse.json(
        errorBody("TELEMETRY_NOT_CONFIGURED", error.message),
        { status: 503 }
      );
    }

    console.error("POST /api/telemetry error:", error);
    return NextResponse.json(
      errorBody(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      ),
      { status: 500 }
    );
  }
}
