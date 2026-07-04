import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Guarded, lazy Supabase client. Returns null when env vars are absent so
 * importing this module can never crash a build or a Vercel deployment.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

// Schema reference (see README): jobs, sanding_reports, finish_applications, robots, quotes
