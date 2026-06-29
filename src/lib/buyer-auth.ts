/**
 * Buyer authentication — any signed-in Supabase user.
 *
 * Unlike the operator console (which additionally requires an `operators`
 * allowlist row), a "buyer" is simply an authenticated Supabase user. Their
 * session lets the dashboard show the deals they own (deals.user_id).
 *
 * This file is SERVER ONLY.
 */
import "server-only";
import { getServerSupabase } from "./supabase/ssr";

export interface Buyer {
  id: string;
  email: string | null;
}

/** Whether buyer auth can run (Supabase public config present). */
export function isBuyerAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** The current signed-in buyer, or null. Validates the JWT against the auth server. */
export async function getBuyer(): Promise<Buyer | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { id: user.id, email: user.email ?? null };
}
