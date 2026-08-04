/**
 * POST /api/telemetry - Ingest telemetry event(s)
 */

import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db/client";
import * as validators from "@/lib/validators";
import * as types from "@/lib/types";

// ============================================================================
// POST /api/telemetry
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Support both single event and batch (array)
    const events = Array.isArray(body) ? body : [body];

    if (events.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "At least one event is required",
          },
        } as types.ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate all events
    const validatedEvents: Omit<types.TelemetryEvent, "id" | "received_at" | "created_at">[] = [];
    const errors: Array<{ index: number; errors: validators.ValidationError[] }> = [];

    for (let i = 0; i < events.length; i++) {
      const validation = validators.validateTelemetryEvent(events[i]);
      if (!validation.valid) {
        errors.push({ index: i, errors: validation.errors! });
      } else {
        validatedEvents.push(validation.data!);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `${errors.length} event(s) failed validation`,
            details: { validation_errors: errors },
          },
        } as types.ApiResponse<never>,
        { status: 400 }
      );
    }

    // Ingest events
    let createdEvents: types.TelemetryEvent[] = [];

    if (validatedEvents.length === 1) {
      const event = await db.createTelemetryEvent(validatedEvents[0]);
      createdEvents = [event];
    } else {
      createdEvents = await db.createTelemetryEventBatch(validatedEvents);
    }

    return NextResponse.json(
      {
        data: createdEvents,
      } as types.ApiResponse<types.TelemetryEvent[]>,
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/telemetry error:", error);
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
