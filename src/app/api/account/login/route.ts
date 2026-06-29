/**
 * POST /api/account/login — buyer sign-in with email + password.
 * Any Supabase user may sign in (no allowlist — that's the operator console).
 */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/ssr";
import { isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { accountLoginSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limit = await rateLimit(req, { key: "account-login", limit: 10, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  if (!isBuyerAuthConfigured()) {
    return NextResponse.json({ ok: false, error: "Accounts aren't available here yet." }, { status: 503 });
  }

  const parsed = accountLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email and password." }, { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "Incorrect email or password." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
