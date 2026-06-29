/**
 * POST /api/account/oauth — begin a social sign-in for a buyer account.
 * Returns the provider URL; the callback returns to /dashboard.
 */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/ssr";
import { isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { oauthStartSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

function siteOrigin(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
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

  const parsed = oauthStartSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Unsupported provider." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }

  // Carry an optional in-app return path through the callback (post-scan "save
  // this deal" returns to the verdict page with ?claim=1). The schema already
  // guarantees `next` is a relative path, so this can't become an open-redirect.
  const callback = new URL(`${siteOrigin(req)}/api/account/auth/callback`);
  if (parsed.data.next) callback.searchParams.set("next", parsed.data.next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) {
    return NextResponse.json({ ok: false, error: "Could not start sign-in." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, url: data.url });
}
