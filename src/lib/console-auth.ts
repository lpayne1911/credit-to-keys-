/**
 * ============================================================================
 *  REVIEW CONSOLE AUTH — real per-operator authentication.
 * ============================================================================
 *
 *  The console is gated by Supabase Auth (email+password OR an OAuth/social
 *  provider) PLUS an operator allowlist. Authenticating with Supabase is not
 *  enough: the user's id must also appear in `public.operators` with
 *  `active = true`. So:
 *
 *      authorized  ==  valid Supabase session  AND  active operator row
 *
 *  This replaces the v1 single shared-password gate. The PUBLIC INTERFACE is
 *  preserved — `isConsoleAuthed()` / `isConsoleConfigured()` keep their names so
 *  the route guards and pages didn't have to change shape — but `isConsoleAuthed`
 *  is now async (it validates a session and reads the allowlist).
 *
 *  - Session validation uses the cookie-wired anon client (`getConsoleClient`)
 *    and `auth.getUser()`, which verifies the JWT against the Supabase auth
 *    server (not just trusting the cookie).
 *  - The allowlist is read with the service client (RLS default-deny means the
 *    anon client can't see `operators`).
 *
 *  This file is SERVER ONLY.
 * ============================================================================
 */

import { getConsoleClient } from "./supabase/ssr";
import { getServiceClient } from "./supabase/server";

export interface ConsoleOperator {
  userId: string;
  email: string;
  role: "reviewer" | "admin";
}

/** Whether console auth can run at all (Supabase configured on the server). */
export function isConsoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Resolve the current operator from the request's Supabase session, or null if
 * not signed in, not an operator, or deactivated. This is the single source of
 * truth for both the boolean guard and audit attribution.
 */
export async function getConsoleOperator(): Promise<ConsoleOperator | null> {
  const auth = getConsoleClient();
  const service = getServiceClient();
  if (!auth || !service) return null;

  // Validate the session against the auth server (not just the cookie).
  const {
    data: { user },
    error: userErr,
  } = await auth.auth.getUser();
  if (userErr || !user) return null;

  // Authorization: the authenticated user must be an active operator.
  const { data: op, error: opErr } = await service
    .from("operators")
    .select("user_id, email, role, active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (opErr || !op || op.active !== true) return null;

  return {
    userId: op.user_id as string,
    email: (op.email as string) ?? user.email ?? "",
    role: (op.role as "reviewer" | "admin") ?? "reviewer",
  };
}

/** True when the current request is from an authenticated, active operator. */
export async function isConsoleAuthed(): Promise<boolean> {
  return (await getConsoleOperator()) !== null;
}
