/**
 * POST /api/console/login — operator sign-in with email + password.
 *
 * Real auth via Supabase Auth. On success, Supabase sets the session cookies
 * (through the cookie-wired SSR client). We then enforce the operator allowlist:
 * a valid Supabase user who is NOT an active operator is signed back out and
 * refused — authentication alone never grants console access.
 */
import { getConsoleClient } from "@/lib/supabase/ssr";
import { isConsoleConfigured, getConsoleOperator } from "@/lib/console-auth";
import { loginSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Brute-force brake on credential stuffing / password guessing, per IP.
  const limit = await rateLimit(req, { key: "console-login", limit: 10, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return apiError("rate_limited", "Too many attempts. Please wait and try again.", {
      headers: rateLimitHeaders(limit),
    });
  }

  if (!isConsoleConfigured()) {
    return apiError("unavailable", "Console auth isn't configured on the server.");
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("validation", "Enter a valid email and password.", { status: 400 });
  }

  const supabase = getConsoleClient();
  if (!supabase) {
    return apiError("server_error", "Server error.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Generic message — don't reveal whether the email exists.
  if (error || !data.user) {
    return apiError("unauthorized", "Incorrect email or password.");
  }

  // Authorization: must resolve to an active operator (email allowlist). The
  // session cookie is now set, so getConsoleOperator() sees this user.
  const operator = await getConsoleOperator();
  if (!operator) {
    await supabase.auth.signOut();
    return apiError("forbidden", "This account isn't authorized for the review console.");
  }

  return apiOk({});
}
