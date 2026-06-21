/**
 * Server-side Supabase clients.
 *
 * Two flavors:
 *  - {@link getServiceClient}: uses SUPABASE_SERVICE_ROLE_KEY. Bypasses RLS.
 *    SERVER ONLY. Used by the private review console and trusted server routes.
 *    Never import this into a Client Component.
 *  - {@link getAnonServerClient}: uses the public anon key from the server, for
 *    RLS-constrained writes (e.g. a buyer creating their own deal).
 *
 * Both return `null` when env vars are missing so the app can build and run in
 * a not-yet-configured environment without crashing. Callers must handle null.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Service-role client. SERVER ONLY — bypasses Row Level Security. */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client used from the server. Constrained by RLS. */
export function getAnonServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
