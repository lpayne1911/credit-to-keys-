/**
 * GET /api/console/auth/callback — OAuth/social sign-in return URL.
 *
 * The provider redirects here with a `?code`. We exchange it for a session
 * (which sets the auth cookies via the SSR client) and bounce the operator to
 * the console. The allowlist check happens on the console page itself, so a
 * non-operator who authenticates just lands on the locked login view.
 */
import { NextResponse } from "next/server";
import { getConsoleClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const consoleUrl = new URL("/console", url.origin);

  if (!code) {
    consoleUrl.searchParams.set("auth_error", "1");
    return NextResponse.redirect(consoleUrl);
  }

  const supabase = getConsoleClient();
  if (!supabase) {
    consoleUrl.searchParams.set("auth_error", "1");
    return NextResponse.redirect(consoleUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    consoleUrl.searchParams.set("auth_error", "1");
  }
  return NextResponse.redirect(consoleUrl);
}
