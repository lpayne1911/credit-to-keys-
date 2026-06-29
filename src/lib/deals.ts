/**
 * Server-side data access for deals. Uses the service-role client (RLS-bypass),
 * so this module is SERVER ONLY — never import it into a Client Component.
 *
 * A buyer reaches their own deal through an unguessable UUID (capability URL).
 * We never expose a list of deals to buyers — only the private console lists.
 */
import "server-only";
import { getServiceClient } from "./supabase/server";
import type { DealRow, FindingRow } from "./types";

export async function getDealById(id: string): Promise<DealRow | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as DealRow;
}

export async function getFindingsForDeal(id: string): Promise<FindingRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("findings")
    .select("*")
    .eq("deal_id", id)
    .order("created_at", { ascending: true });
  return (data ?? []) as FindingRow[];
}

/** Deals owned by a specific buyer (newest first). For the buyer dashboard. */
export async function listDealsForUser(userId: string): Promise<DealRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as DealRow[];
}

export async function listDeals(): Promise<DealRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as DealRow[];
}
