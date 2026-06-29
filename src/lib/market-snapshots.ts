/**
 * Server-side persistence for saved MarketCheck reports.
 *
 * A buyer "saves" a report and gets back an unguessable UUID; anyone with that
 * URL (/r/<id>) can re-open the exact snapshot. No accounts, no buyer auth — the
 * capability URL IS the access control, exactly like the deals pattern. Uses the
 * service-role client (RLS-bypass), so this module is SERVER ONLY.
 *
 * Every function degrades gracefully when Supabase isn't configured (returns
 * null), so the app builds and runs in a not-yet-configured environment.
 */
import "server-only";
import { getServiceClient } from "./supabase/server";
import type { MarketCheckResponse } from "./sources/marketcheck/types";

const TABLE = "market_snapshots";

/** Persist a report; returns its share id, or null if save is unavailable. */
export async function saveMarketSnapshot(
  response: MarketCheckResponse,
): Promise<string | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ response, is_mock: response.source.isMock })
    .select("id")
    .single();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

/** Load a saved report by share id, or null if missing / unavailable. */
export async function getMarketSnapshotById(
  id: string,
): Promise<MarketCheckResponse | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("response")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { response: MarketCheckResponse }).response;
}
