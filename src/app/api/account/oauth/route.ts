/**
 * POST /api/account/oauth — begin a social sign-in for a buyer account.
 * Returns the provider URL; the callback returns to /dashboard.
 */
import { getServerSupabase } from "@/lib/supabase/ssr";
import { isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { oauthStartSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

function siteOrigin(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const limit = await rateLimit(req, { key: "account-oauth", limit: 20, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return apiError("rate_limited", "Too many attempts. Please wait and try again.", {
      headers: rateLimitHeaders(limit),
    });
  }
  if (!isBuyerAuthConfigured()) {
    return apiError("unavailable", "Accounts aren't available here yet.");
  }

  const parsed = oauthStartSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("validation", "Unsupported provider.", { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return apiError("server_error", "Server error.");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: { redirectTo: `${siteOrigin(req)}/api/account/auth/callback` },
  });
  if (error || !data.url) {
    return apiError("upstream_error", "Could not start sign-in.");
  }
  return apiOk({ url: data.url });
}
