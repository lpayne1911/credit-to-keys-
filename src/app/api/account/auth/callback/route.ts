/**
 * GET /api/account/auth/callback — buyer OAuth / email-confirmation return URL.
 * Exchanges the code for a session (sets cookies) and sends the buyer to their
 * dashboard.
 */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

/** Only allow returning to a same-origin relative path — never an open redirect. */
function safeNext(raw: string | null, origin: string): URL {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return new URL(raw, origin);
  }
  return new URL("/dashboard", origin);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const dest = safeNext(url.searchParams.get("next"), url.origin);

  if (!code) {
    dest.searchParams.set("auth_error", "1");
    return NextResponse.redirect(dest);
  }
  const supabase = getServerSupabase();
  if (!supabase) {
    dest.searchParams.set("auth_error", "1");
    return NextResponse.redirect(dest);
  }
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) dest.searchParams.set("auth_error", "1");
  return NextResponse.redirect(dest);
}
