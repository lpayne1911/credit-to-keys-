/**
 * POST /api/console/oauth — begin a social/OAuth sign-in for the console.
 *
 * Returns the provider authorization URL for the browser to redirect to. The
 * provider sends the user back to /api/console/auth/callback, which exchanges
 * the code for a session. The operator allowlist is enforced on the console
 * itself (isConsoleAuthed), so authenticating with Google/Apple does not by
 * itself grant access.
 *
 * The provider (Google, Apple, …) must be enabled in the Supabase project's
 * Auth settings; no extra app secret is needed here.
 */
import { NextResponse } from "next/server";
import { getConsoleClient } from "@/lib/supabase/ssr";
import { isConsoleConfigured } from "@/lib/console-auth";
import { oauthStartSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

function siteOrigin(req: Request): string {
  // Prefer an explicit site URL (stable behind proxies); else the request origin.
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const limit = await rateLimit(req, { key: "console-oauth", limit: 20, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  if (!isConsoleConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Console auth isn't configured on the server." },
      { status: 503 },
    );
  }

  const parsed = oauthStartSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Unsupported provider." }, { status: 400 });
  }

  const supabase = getConsoleClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }

  const redirectTo = `${siteOrigin(req)}/api/console/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: { redirectTo },
  });
  if (error || !data.url) {
    return NextResponse.json({ ok: false, error: "Could not start sign-in." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: data.url });
}
