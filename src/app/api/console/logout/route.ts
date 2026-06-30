/**
 * POST /api/console/logout — end the operator session.
 * Supabase clears the auth cookies through the cookie-wired SSR client.
 */
import { getConsoleClient } from "@/lib/supabase/ssr";
import { apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST() {
  const supabase = getConsoleClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return apiOk({});
}
