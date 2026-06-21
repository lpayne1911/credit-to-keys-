/**
 * ============================================================================
 *  REVIEW CONSOLE AUTH — DELIBERATE V1 STOPGAP. NOT REAL AUTH.
 * ============================================================================
 *
 *  The review console is gated by a SINGLE shared password from the
 *  CONSOLE_PASSWORD env var. On success we set a signed-ish httpOnly cookie so
 *  the operator stays logged in. There are NO user accounts, NO roles, NO
 *  per-operator audit trail, and NO brute-force protection.
 *
 *  >>> REPLACE WITH PROPER AUTH BEFORE LAUNCH <<<
 *  (e.g. Supabase Auth with an `operators` table + RLS, or an SSO provider).
 *  This console is the seed of a future full operator console — when you add
 *  real auth, keep this module's interface (isConsoleAuthed / cookie name) so
 *  the route guards don't have to change.
 *
 *  This file is SERVER ONLY.
 * ============================================================================
 */

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const CONSOLE_COOKIE = "da_console";

function expectedToken(): string | null {
  const pw = process.env.CONSOLE_PASSWORD;
  if (!pw) return null;
  // Derive an opaque cookie value from the password so the raw password isn't
  // stored in the cookie. NOT a substitute for real sessions — stopgap only.
  return createHmac("sha256", pw).update("driveway-advocate-console").digest("hex");
}

/** Constant-time check that a submitted password matches CONSOLE_PASSWORD. */
export function passwordMatches(submitted: string): boolean {
  const pw = process.env.CONSOLE_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(submitted);
  const b = Buffer.from(pw);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function consoleCookieValue(): string | null {
  return expectedToken();
}

/** True when the current request carries a valid console session cookie. */
export function isConsoleAuthed(): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  const got = cookies().get(CONSOLE_COOKIE)?.value;
  if (!got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Whether the console is usable at all (password configured). */
export function isConsoleConfigured(): boolean {
  return Boolean(process.env.CONSOLE_PASSWORD);
}
