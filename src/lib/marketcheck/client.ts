/**
 * ============================================================================
 *  MarketCheck client — server-only vehicle market-pricing lookup.
 * ============================================================================
 *
 * Provides a market PRICE RANGE for a vehicle so the fairness engine can judge
 * whether the asking price is over market. Server-only: the API key is read from
 * `process.env.MARKETCHECK_API_KEY` and NEVER exposed to the browser.
 *
 * Mirrors the app's external-call conventions (see `src/lib/vin.ts`):
 *   - plain `fetch` with Next.js response caching to control vendor cost,
 *   - graceful degradation — returns `null` (never throws) when the key is
 *     absent, the vehicle data is too thin, or the request fails/ times out.
 *
 * The engine consumes the returned `PriceRange` via `FairnessInput.marketValue`.
 */
import type { Confidence, PriceRange } from "@/lib/fairness-engine";

const BASE = "https://api.marketcheck.com/v2";
/** Cache vendor responses for a day (keyed by URL) — MarketCheck calls cost money. */
const REVALIDATE_SECONDS = 60 * 60 * 24;
const TIMEOUT_MS = 8_000;

export interface MarketLookupInput {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  mileage?: number | null;
  /** 5-digit ZIP preferred; used to localize comps. */
  zip?: string | null;
}

/** The slice of the MarketCheck `stats.price` object we rely on (all optional). */
export interface MarketPriceStats {
  mean?: number;
  median?: number;
  population?: number;
  min?: number;
  max?: number;
  // Some responses include percentile keys; consumed defensively if present.
  [k: string]: number | undefined;
}

function round50(n: number): number {
  return Math.max(0, Math.round(n / 50) * 50);
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * Pure: turn a MarketCheck `stats.price` object into a buyer-facing range.
 * Prefers p25–p75 when present; otherwise a tight band around the median/mean.
 * Confidence scales with the number of comparable listings. Returns null if the
 * stats are unusable. Exported for unit testing without the network.
 */
export function marketStatsToRange(
  stats: MarketPriceStats | null | undefined,
  ctx: { label: string },
): PriceRange | null {
  if (!stats) return null;
  const p25 = num(stats["25.0"]) ?? num(stats.p25);
  const p75 = num(stats["75.0"]) ?? num(stats.p75);
  const center = num(stats.median) ?? num(stats.mean);

  let low: number | undefined;
  let high: number | undefined;
  if (p25 && p75 && p75 > p25) {
    low = p25;
    high = p75;
  } else if (center && center > 0) {
    low = center * 0.96;
    high = center * 1.04;
  }
  if (!low || !high) return null;

  const population = num(stats.population) ?? 0;
  const confidence: Confidence =
    population >= 25 ? "high" : population >= 8 ? "medium" : "low";

  return {
    low: round50(low),
    high: round50(high),
    confidence,
    basis:
      population > 0
        ? `MarketCheck active listings for ${ctx.label} (${population} comparable${population === 1 ? "" : "s"}).`
        : `MarketCheck active listings for ${ctx.label}.`,
  };
}

/**
 * Look up a market price range for a vehicle. Returns null when unconfigured,
 * under-specified (need make + model + year), or on any error/timeout.
 */
export async function getMarketRange(
  input: MarketLookupInput,
): Promise<PriceRange | null> {
  const apiKey = process.env.MARKETCHECK_API_KEY;
  if (!apiKey) return null;

  const { year, make, model, trim, zip } = input;
  if (!year || !make || !model) return null; // too thin to query meaningfully

  const ymmt = [year, make, model, trim].filter(Boolean).join("|");
  const label = [year, make, model, trim].filter(Boolean).join(" ");

  const params = new URLSearchParams({
    api_key: apiKey,
    car_type: "used",
    ymmt,
    rows: "0",
    stats: "price",
  });
  if (zip && /^\d{5}/.test(zip)) {
    params.set("zip", zip.slice(0, 5));
    params.set("radius", "100");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/search/car/active?${params.toString()}`, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stats?: { price?: MarketPriceStats } };
    return marketStatsToRange(data?.stats?.price ?? null, { label });
  } catch {
    return null; // network/abort/parse — degrade silently
  } finally {
    clearTimeout(timer);
  }
}
