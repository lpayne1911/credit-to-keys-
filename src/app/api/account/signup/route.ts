/**
 * POST /api/account/signup — create a buyer account with email + password.
 *
 * If the Supabase project requires email confirmation, signUp returns a user
 * but no active session; we tell the client to check their email. If
 * confirmation is off, a session is set and the buyer is signed in immediately.
 */
import { getServerSupabase } from "@/lib/supabase/ssr";
import { isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { accountSignupSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

function siteOrigin(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const limit = await rateLimit(req, { key: "account-signup", limit: 6, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return apiError("rate_limited", "Too many attempts. Please wait and try again.", {
      headers: rateLimitHeaders(limit),
    });
  }
  if (!isBuyerAuthConfigured()) {
    return apiError("unavailable", "Accounts aren't available here yet.");
  }

  const parsed = accountSignupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      "validation",
      "Enter a valid email and a password of at least 8 characters.",
      { status: 400 },
    );
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return apiError("server_error", "Server error.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${siteOrigin(req)}/api/account/auth/callback` },
  });
  if (error) {
    return apiError("validation", error.message, { status: 400 });
  }
  // Session present → signed in. No session → email confirmation required.
  const needsConfirmation = !data.session;
  return apiOk({ needsConfirmation });
}
