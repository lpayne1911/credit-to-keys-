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
  /** operators.id (stable allowlist row id). */
  id: string;
  /** Allowlist email (lower-cased). */
  email: string;
  role: "reviewer" | "admin";
  /** The linked auth user id for this session. */
  userId: string;
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
  if (userErr || !user || !user.email) return null;

  // Require a verified email: the allowlist is keyed by email, so we must not
  // match on an unverified address. OAuth providers (Google/Apple) verify the
  // email; email+password is verified once confirmed in Supabase.
  if (!user.email_confirmed_at) return null;

  const email = user.email.toLowerCase();

  // Authorization: the verified email must be an active operator.
  const { data: op, error: opErr } = await service
    .from("operators")
    .select("id, email, user_id, role, active")
    .eq("email", email)
    .maybeSingle();
  if (opErr || !op || op.active !== true) return null;

  // Link the auth user id on first login so audit/admin views can show it.
  if (!op.user_id) {
    await service
      .from("operators")
      .update({ user_id: user.id, linked_at: new Date().toISOString() })
      .eq("id", op.id);
  }

  return {
    id: op.id as string,
    email: (op.email as string) ?? email,
    role: (op.role as "reviewer" | "admin") ?? "reviewer",
    userId: user.id,
  };
}

/** True when the current request is from an authenticated, active operator. */
export async function isConsoleAuthed(): Promise<boolean> {
  return (await getConsoleOperator()) !== null;
}
