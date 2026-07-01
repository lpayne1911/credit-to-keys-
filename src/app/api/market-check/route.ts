/**
 * POST /api/market-check — run the market-intelligence layer for a vehicle and
 * return a normalized snapshot + comps + trend. Server-only (the MarketCheck key
 * never reaches the browser); falls back to deterministic mock when unconfigured.
 */
import { runMarketCheck } from "@/lib/market-engine/runMarketCheck";
import { buildSafetyReport } from "@/lib/safety-engine/buildSafetyReport";
import { buildTitleHistory } from "@/lib/title-engine/buildTitleHistory";
import type { MarketCheckRequest } from "@/lib/sources/marketcheck/types";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // This route triggers a PAID MarketCheck API call on an unauthenticated
  // request — throttle per IP to prevent quota/cost-amplification abuse.
  const limit = await rateLimit(req, { key: "market-check", limit: 20, windowMs: 5 * 60_000 });
  if (!limit.ok) {
    return apiError("rate_limited", "Too many requests. Please slow down.", {
      headers: rateLimitHeaders(limit),
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("invalid_json", "Expected a JSON body.");
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const request: MarketCheckRequest = {
    vin: typeof b.vin === "string" ? b.vin : null,
    year: typeof b.year === "number" ? b.year : Number(b.year) || null,
    make: typeof b.make === "string" ? b.make : null,
    model: typeof b.model === "string" ? b.model : null,
    trim: typeof b.trim === "string" ? b.trim : null,
    mileage: typeof b.mileage === "number" ? b.mileage : Number(b.mileage) || null,
    condition: b.condition === "new" || b.condition === "cpo" ? b.condition : "used",
    zipCode: typeof b.zipCode === "string" ? b.zipCode : null,
    radiusMiles: typeof b.radiusMiles === "number" ? b.radiusMiles : 75,
    dealerAskingPrice:
      typeof b.dealerAskingPrice === "number" ? b.dealerAskingPrice : Number(b.dealerAskingPrice) || null,
  };

  // Need at least a VIN or make+model to produce anything meaningful.
  if (!request.vin && !(request.make && request.model)) {
    return apiError("validation", "Enter a VIN, or at least a make and model.");
  }

  const result = await runMarketCheck(request);

  // Free, keyless NHTSA safety layer, keyed off the resolved vehicle identity.
  // REAL-OR-HIDDEN: null when there's nothing real to show. Never blocks the
  // pricing result — failures degrade to null.
  const safety = await buildSafetyReport(
    result.vehicle.year,
    result.vehicle.make,
    result.vehicle.model,
  ).catch(() => null);

  // NMVTIS title/salvage history (VinAudit) — gated off by default, so this
  // makes a paid call only when explicitly enabled + configured. REAL-OR-HIDDEN.
  const title = await buildTitleHistory(request.vin).catch(() => null);

  return apiOk({ result, safety, title });
}
