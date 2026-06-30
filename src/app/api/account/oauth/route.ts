/**
 * POST /api/account/oauth — begin a social sign-in for a buyer account.
 * Returns the provider URL; the callback returns to /dashboard.
 */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/ssr";
import { isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { oauthStartSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { safeRedirectPath, isUuid } from "@/lib/safe-redirect";

export const runtime = "nodejs";

function siteOrigin(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
}

/** Build the callback URL, threading redirectTo + claimDealId so the post-auth
 * return can claim an anonymous deal and land on the right page. */
function callbackUrl(req: Request, body: Record<string, unknown>): string {
  const url = new URL("/api/account/auth/callback", siteOrigin(req));
  const redirectTo = safeRedirectPath(body.redirectTo, "");
  if (redirectTo) url.searchParams.set("redirectTo", redirectTo);
  if (isUuid(body.claimDealId)) url.searchParams.set("claimDealId", body.claimDealId);
  if (isUuid(body.claimIntakeId)) url.searchParams.set("claimIntakeId", body.claimIntakeId);
  if (isUuid(body.claimArtifactId)) url.searchParams.set("claimArtifactId", body.claimArtifactId);
  return url.toString();
}

export async function POST(req: Request) {
  const limit = await rateLimit(req, { key: "account-oauth", limit: 20, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  if (!isBuyerAuthConfigured()) {
    return NextResponse.json({ ok: false, error: "Accounts aren't available here yet." }, { status: 503 });
  }

  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = oauthStartSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Unsupported provider." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: { redirectTo: callbackUrl(req, raw ?? {}) },
  });
  if (error || !data.url) {
    return NextResponse.json({ ok: false, error: "Could not start sign-in." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, url: data.url });
}
