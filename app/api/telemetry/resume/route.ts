/**
 * GET /api/telemetry/resume?job_id=<id> — what does the platform already hold?
 *
 * The first call a machine makes when it comes back from an outage. Without it,
 * an edge with four hours of buffered 1 Hz samples has two choices: replay all
 * of them and rely on the idempotency index to absorb the ones that landed
 * before the network dropped, or guess. The first wastes the job site's uplink
 * on ~14,000 events that are already stored; the second loses data.
 *
 * With it the edge sends one request, reads `max_seq`, and replays from there.
 *
 * Authenticated with the same device credential as ingest, through the same
 * `authenticateDevice`, and scoped the same way: a machine may only ask about
 * its own telemetry, on a job inside its own tenant. Otherwise this endpoint
 * becomes an oracle for enumerating other tenants' job ids.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { authenticateDevice, IngestError } from "@/lib/telemetry/ingest";
import {
  createSupabaseTelemetryStore,
  ServiceClientUnavailableError,
} from "@/lib/db/service";
import type * as types from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sha256Hex = (input: string): string =>
  createHash("sha256").update(input, "utf8").digest("hex");

function errorBody(code: string, message: string) {
  return { error: { code, message } } as types.ApiResponse<never>;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const store = createSupabaseTelemetryStore();
    const credential = await authenticateDevice(
      store,
      sha256Hex,
      req.headers.get("authorization")
    );

    const jobId = req.nextUrl.searchParams.get("job_id");
    if (!jobId) {
      return NextResponse.json(
        errorBody("MISSING_PARAMETER", "job_id is required"),
        { status: 400 }
      );
    }

    const [job] = await store.getJobs([jobId]);

    // A job in another tenant and a job that does not exist give the same
    // answer. The alternative tells an attacker with one valid device key which
    // job ids exist across the whole platform.
    if (!job || job.tenant_id !== credential.tenant_id) {
      return NextResponse.json(errorBody("NOT_FOUND", `No job ${jobId}`), {
        status: 404,
      });
    }

    const maxSeq = await store.maxSeq(credential.robot_id, jobId);

    return NextResponse.json(
      {
        data: {
          job_id: jobId,
          robot_id: credential.robot_id,
          job_status: job.status,
          max_seq: maxSeq,
          /** Resume from here. Null max_seq means the platform holds nothing. */
          next_seq: maxSeq === null ? 0 : maxSeq + 1,
          accepts_telemetry: job.status !== "archived",
        },
      },
      { status: 200 }
    );
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
    console.error("GET /api/telemetry/resume error:", error);
    return NextResponse.json(
      errorBody(
        "INTERNAL_SERVER_ERROR",
        error instanceof Error ? error.message : "Unknown error"
      ),
      { status: 500 }
    );
  }
}
