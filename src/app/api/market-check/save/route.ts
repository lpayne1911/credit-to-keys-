/**
 * POST /api/market-check/save — persist a MarketCheck report and return a
 * shareable capability URL (/r/<id>). No auth: the unguessable id is the access
 * control. Returns 503 when persistence isn't configured so the UI can fail
 * gracefully instead of pretending it saved.
 */
import { NextResponse } from "next/server";
import { saveMarketSnapshot } from "@/lib/market-snapshots";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { MarketCheckResponse } from "@/lib/sources/marketcheck/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Saving reports isn't available right now." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const response = (body as { result?: unknown })?.result ?? body;
  const r = response as Partial<MarketCheckResponse>;
  // Minimal shape check — a real report always carries these.
  if (!r || !r.vehicle || !r.snapshot || !r.source) {
    return NextResponse.json({ error: "Not a valid report." }, { status: 422 });
  }

  const id = await saveMarketSnapshot(response as MarketCheckResponse);
  if (!id) {
    return NextResponse.json({ error: "Could not save the report." }, { status: 502 });
  }

  return NextResponse.json({ id, url: `/r/${id}` });
}
