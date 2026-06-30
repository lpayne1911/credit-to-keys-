/**
 * POST /api/account/logout — end the buyer session.
 */
import { getServerSupabase } from "@/lib/supabase/ssr";
import { apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST() {
  const supabase = getServerSupabase();
  if (supabase) await supabase.auth.signOut();
  return apiOk({});
}
