/**
 * POST /api/console/logout — end the operator session.
 * Supabase clears the auth cookies through the cookie-wired SSR client.
 */
import { NextResponse } from "next/server";
import { getConsoleClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

export async function POST() {
  const supabase = getConsoleClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
