/**
 * POST /api/account/login — buyer sign-in with email + password.
 * Any Supabase user may sign in (no allowlist — that's the operator console).
 */
import { getServerSupabase } from "@/lib/supabase/ssr";
import { isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { accountLoginSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limit = await rateLimit(req, { key: "account-login", limit: 10, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return apiError("rate_limited", "Too many attempts. Please wait and try again.", {
      headers: rateLimitHeaders(limit),
    });
  }
  if (!isBuyerAuthConfigured()) {
    return apiError("unavailable", "Accounts aren't available here yet.");
  }

  const parsed = accountLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("validation", "Enter a valid email and password.", { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return apiError("server_error", "Server error.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    return apiError("unauthorized", "Incorrect email or password.");
  }
  return apiOk({});
}
