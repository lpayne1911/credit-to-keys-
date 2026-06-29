/**
 * POST /api/account/signup — create a buyer account with email + password.
 *
 * If the Supabase project requires email confirmation, signUp returns a user
 * but no active session; we tell the client to check their email. If
 * confirmation is off, a session is set and the buyer is signed in immediately.
 */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/ssr";
import { isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { accountSignupSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

function siteOrigin(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const limit = await rateLimit(req, { key: "account-signup", limit: 6, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  if (!isBuyerAuthConfigured()) {
    return NextResponse.json({ ok: false, error: "Accounts aren't available here yet." }, { status: 503 });
  }

  const parsed = accountSignupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${siteOrigin(req)}/api/account/auth/callback` },
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  // Session present → signed in. No session → email confirmation required.
  const needsConfirmation = !data.session;
  return NextResponse.json({ ok: true, needsConfirmation });
}
