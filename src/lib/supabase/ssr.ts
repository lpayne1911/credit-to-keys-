/**
 * Cookie-aware Supabase client for the App Router (server side).
 *
 * Unlike `getServiceClient()` (which holds the service-role key and bypasses
 * RLS), this client uses the PUBLIC anon key and carries the operator's auth
 * SESSION via Next's cookie store. It exists so the console can use real
 * Supabase Auth (email+password and OAuth/social providers) instead of the v1
 * shared password.
 *
 * Auth only: because RLS is default-deny, this anon-keyed client can't read app
 * tables directly — it's used to validate the session (`auth.getUser()`) and to
 * run the sign-in / sign-out / OAuth-callback flows, which set the auth cookies.
 * The operator allowlist is read separately with the service client.
 *
 * Cookie adapter: @supabase/ssr 0.5.x uses getAll/setAll. In a Server Component
 * the cookie store is read-only, so setAll can throw — we swallow that (session
 * refresh still works on the next route-handler/middleware write). This is the
 * documented App Router pattern.
 *
 * This file is SERVER ONLY.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a cookie-wired Supabase client, or null when Supabase isn't
 * configured. Used for ALL session-bearing auth (operator console AND buyer
 * accounts) — it's just the SSR anon client; the caller decides authorization.
 * `getServerSupabase` is the general-purpose alias.
 */
export function getConsoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where cookies are read-only. Safe to
          // ignore — auth cookies are written by the route handlers (login,
          // logout, OAuth callback) where setAll succeeds.
        }
      },
    },
  });
}

/** General-purpose alias for the cookie-wired SSR client (see above). */
export const getServerSupabase = getConsoleClient;
