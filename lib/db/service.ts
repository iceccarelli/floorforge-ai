/**
 * Server-only Supabase client, and the telemetry store built on it.
 *
 * WHY A SECOND CLIENT EXISTS. `lib/db/client.ts` connects with the anon key,
 * which is public by design and subject to Row Level Security. That is correct
 * for anything a browser does. It is wrong for telemetry ingest, because the
 * alternative to a server-side write is handing every machine in the field a
 * key that can write to the database directly — and a machine that can write to
 * the database directly is a machine that can forge the quality record of a job
 * it never ran.
 *
 * So `migrations/002_telemetry_integrity.sql` §5 gives `telemetry_events` no
 * anon or authenticated write policy at all. The only path in is this client,
 * reached only from a route handler that has already authenticated the device
 * against `device_credentials`. The service role bypasses RLS; the auth check
 * in lib/telemetry/ingest.ts is what replaces it.
 *
 * THE GUARD BELOW IS NOT DECORATION. A service-role key reaching a browser
 * bundle is a total compromise of every tenant's data at once. `SUPABASE_SERVICE_ROLE_KEY`
 * has no NEXT_PUBLIC_ prefix so Next.js will not inline it, and this module
 * throws on any attempt to evaluate it in a browser, so an accidental import
 * from a client component fails loudly at the first call instead of shipping.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  JobOwnership,
  TelemetryInsertRow,
  TelemetryRejectRow,
  TelemetryStore,
} from "@/lib/telemetry/ingest";
import type * as types from "@/lib/types";

export class ServiceClientUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceClientUnavailableError";
  }
}

let cached: SupabaseClient | null = null;

/** True when the deployment is configured to accept device telemetry. */
export function serviceClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getServiceClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new ServiceClientUnavailableError(
      "lib/db/service.ts was imported into a browser bundle. The service role " +
        "key must never leave the server."
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Deliberately not a silent fallback to a placeholder project. That
    // pattern in lib/db/client.ts:19-20 is why a completely non-functional
    // write path looked healthy for months: every insert went to a URL that
    // does not exist and the only signal was a console warning at boot.
    throw new ServiceClientUnavailableError(
      "Telemetry ingest is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY (server-side only, never NEXT_PUBLIC_)."
    );
  }

  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

// ============================================================================
// TELEMETRY STORE
// ============================================================================

export function createSupabaseTelemetryStore(
  client: SupabaseClient = getServiceClient()
): TelemetryStore {
  return {
    async findActiveCredentialByKeyHash(keyHash) {
      const { data, error } = await client
        .from("device_credentials")
        .select("id, robot_id, tenant_id, kind, label, key_prefix, status, created_at")
        .eq("key_hash", keyHash)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw new Error(`Credential lookup failed: ${error.message}`);
      return (data as types.DeviceCredential | null) ?? null;
    },

    async getJobs(jobIds) {
      const { data, error } = await client
        .from("jobs")
        .select("id, tenant_id, status")
        .in("id", jobIds);

      if (error) throw new Error(`Job lookup failed: ${error.message}`);
      return (data ?? []) as JobOwnership[];
    },

    async insertEvents(rows: TelemetryInsertRow[]) {
      // ON CONFLICT (robot_id, job_id, seq) DO NOTHING, then read back what was
      // actually written. `ignoreDuplicates` is what turns an at-least-once
      // delivery into an exactly-once row, and `.select()` is what lets the
      // machine be told which of its events were new.
      const { data, error } = await client
        .from("telemetry_events")
        .upsert(rows, {
          onConflict: "robot_id,job_id,seq",
          ignoreDuplicates: true,
        })
        .select("seq");

      if (error) throw new Error(`Telemetry insert failed: ${error.message}`);
      return {
        insertedSeqs: ((data ?? []) as Array<{ seq: number }>).map((r) => r.seq),
      };
    },

    async recordRejects(rows: TelemetryRejectRow[]) {
      const { error } = await client.from("telemetry_rejects").insert(rows);
      if (error) throw new Error(`Reject write failed: ${error.message}`);
    },

    async maxSeq(robotId, jobId) {
      const { data, error } = await client
        .from("telemetry_events")
        .select("seq")
        .eq("robot_id", robotId)
        .eq("job_id", jobId)
        .not("seq", "is", null)
        .order("seq", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(`Resume lookup failed: ${error.message}`);
      return (data as { seq: number } | null)?.seq ?? null;
    },

    async touchCredential(credentialId) {
      await client
        .from("device_credentials")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", credentialId);
    },
  };
}
