/**
 * POST /api/market-check/save — persist a MarketCheck report and return a
 * shareable capability URL (/r/<id>). No auth: the unguessable id is the access
 * control. Returns 503 when persistence isn't configured so the UI can fail
 * gracefully instead of pretending it saved.
 */
import { saveMarketSnapshot } from "@/lib/market-snapshots";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { MarketCheckResponse } from "@/lib/sources/marketcheck/types";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return apiError("unavailable", "Saving reports isn't available right now.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("invalid_json", "Expected a JSON body.");
  }

  const response = (body as { result?: unknown })?.result ?? body;
  const r = response as Partial<MarketCheckResponse>;
  // Minimal shape check — a real report always carries these.
  if (!r || !r.vehicle || !r.snapshot || !r.source) {
    return apiError("validation", "Not a valid report.");
  }

  const id = await saveMarketSnapshot(response as MarketCheckResponse);
  if (!id) {
    return apiError("upstream_error", "Could not save the report.");
  }

  return apiOk({ id, url: `/r/${id}` });
}
