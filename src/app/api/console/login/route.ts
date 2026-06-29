/**
 * POST /api/console/login — operator sign-in with email + password.
 *
 * Real auth via Supabase Auth. On success, Supabase sets the session cookies
 * (through the cookie-wired SSR client). We then enforce the operator allowlist:
 * a valid Supabase user who is NOT an active operator is signed back out and
 * refused — authentication alone never grants console access.
 */
import { NextResponse } from "next/server";
import { getConsoleClient } from "@/lib/supabase/ssr";
import { getServiceClient } from "@/lib/supabase/server";
import { isConsoleConfigured } from "@/lib/console-auth";
import { loginSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Brute-force brake on credential stuffing / password guessing, per IP.
  const limit = await rateLimit(req, { key: "console-login", limit: 10, windowMs: 10 * 60_000 });
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

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email and password." }, { status: 400 });
  }

  const supabase = getConsoleClient();
  const service = getServiceClient();
  if (!supabase || !service) {
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Generic message — don't reveal whether the email exists.
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "Incorrect email or password." }, { status: 401 });
  }

  // Authorization: must be an active operator. Otherwise drop the session.
  const { data: op } = await service
    .from("operators")
    .select("user_id, active")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!op || op.active !== true) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { ok: false, error: "This account isn't authorized for the review console." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
