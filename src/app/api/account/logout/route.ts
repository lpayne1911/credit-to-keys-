/**
 * POST /api/account/logout — end the buyer session.
 */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

export async function POST() {
  const supabase = getServerSupabase();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
