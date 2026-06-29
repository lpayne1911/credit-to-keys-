/**
 * MarketCheck connector — SERVER-ONLY raw API access. The API key is read from
 * `process.env.MARKETCHECK_API_KEY` and never reaches the browser. Returns null
 * when the key is absent or the call fails, so the engine falls back to mock.
 *
 * Endpoints (api_key as query param):
 *   - GET /v2/search/car/active   (comparable listings + price stats)
 *   - GET /v2/decode/car/{vin}/specs   (VIN identity/equipment)
 */
import type { MarketCheckRequest } from "./types";

const BASE = "https://api.marketcheck.com/v2";
const TIMEOUT_MS = 8_000;
/** Active comps refresh fast-ish; VIN specs are stable. */
const ACTIVE_TTL = 60 * 60 * 8; // 8h
const DECODE_TTL = 60 * 60 * 24 * 30; // 30d

export interface RawListing {
  id?: string;
  vin?: string;
  price?: number;
  miles?: number;
  dom?: number;
  dist?: number;
  dealer?: { name?: string; city?: string; state?: string; zip?: string };
  build?: { year?: number; make?: string; model?: string; trim?: string };
  /** Present on the recents/sold feed — when the listing left the market. */
  last_seen_at?: string;
  scraped_at?: string;
}

export interface RawActiveResponse {
  num_found?: number;
  listings?: RawListing[];
  stats?: { price?: Record<string, number> };
}

export type RawSpecs = Record<string, unknown>;

function apiKey(): string | null {
  return process.env.MARKETCHECK_API_KEY ?? null;
}

async function getJson<T>(url: string, revalidate: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch active comparable listings + price stats. Null when unconfigured/thin. */
export async function fetchActiveListings(
  request: MarketCheckRequest,
): Promise<RawActiveResponse | null> {
  const key = apiKey();
  if (!key) return null;
  const { vin, year, make, model, trim, zipCode, radiusMiles, condition } = request;
  const params = new URLSearchParams({ api_key: key, rows: "50", stats: "price" });
  // Prefer a year/make/model query so we get true COMPARABLES. A `vins=` query
  // matches only that one exact car, which yields too few comps to price against
  // — so use it only as a last resort when the vehicle is otherwise unknown
  // (e.g. the VIN decode failed upstream).
  if (year && make && model) {
    params.set("ymmt", [year, make, model, trim].filter(Boolean).join("|"));
  } else if (vin) {
    params.set("vins", vin);
  } else {
    return null; // too thin to query
  }
  params.set("car_type", condition === "new" ? "new" : "used");
  if (zipCode && /^\d{5}/.test(zipCode)) {
    params.set("zip", zipCode.slice(0, 5));
    params.set("radius", String(radiusMiles ?? 100));
  }
  return getJson<RawActiveResponse>(`${BASE}/search/car/active?${params.toString()}`, ACTIVE_TTL);
}

/** Fetch the single active listing that exactly matches a VIN — gives the real
 *  dealer + days-on-market for the searched car. Null when unconfigured/no match. */
export async function fetchListingByVin(vin: string): Promise<RawListing | null> {
  const key = apiKey();
  if (!key || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) return null;
  const params = new URLSearchParams({ api_key: key, vins: vin, rows: "1" });
  const data = await getJson<RawActiveResponse>(
    `${BASE}/search/car/active?${params.toString()}`,
    ACTIVE_TTL,
  );
  return data?.listings?.[0] ?? null;
}

/** Fetch recently-removed/sold comparable listings for a real price trend.
 *  Plan-dependent: returns null when unconfigured or the endpoint isn't in the
 *  plan, so the caller degrades to the price-distribution. Mirrors the active query. */
export async function fetchRecentListings(
  request: MarketCheckRequest,
): Promise<RawActiveResponse | null> {
  const key = apiKey();
  if (!key) return null;
  const { vin, year, make, model, trim, zipCode, radiusMiles, condition } = request;
  const params = new URLSearchParams({ api_key: key, rows: "50" });
  if (year && make && model) {
    params.set("ymmt", [year, make, model, trim].filter(Boolean).join("|"));
  } else if (vin) {
    params.set("vins", vin);
  } else {
    return null;
  }
  params.set("car_type", condition === "new" ? "new" : "used");
  if (zipCode && /^\d{5}/.test(zipCode)) {
    params.set("zip", zipCode.slice(0, 5));
    params.set("radius", String(radiusMiles ?? 100));
  }
  return getJson<RawActiveResponse>(
    `${BASE}/search/car/recents?${params.toString()}`,
    ACTIVE_TTL,
  );
}

/** Decode a 17-char VIN to specs/equipment. Null when unconfigured/invalid. */
export async function decodeVin(vin: string): Promise<RawSpecs | null> {
  const key = apiKey();
  if (!key || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) return null;
  return getJson<RawSpecs>(`${BASE}/decode/car/${vin}/specs?api_key=${key}`, DECODE_TTL);
}

export function isConfigured(): boolean {
  return Boolean(apiKey());
}

/**
 * Whether an optional PREMIUM MarketCheck endpoint is explicitly enabled. These
 * default OFF so the Free plan (Inventory Search + decode only) never spends a
 * call on — or 403s against — an endpoint it doesn't have. Flip the matching env
 * var to "true" after upgrading to Basic+:
 *   - "specs"   → MARKETCHECK_SPECS_ENABLED   (NeoVIN/Epi specs decode; MSRP/equipment)
 *   - "history" → MARKETCHECK_HISTORY_ENABLED (Dealer Recent Inventory; price trend)
 *   - "dealer"  → MARKETCHECK_DEALER_ENABLED  (Dealer API; same-dealer rows)
 */
export function featureEnabled(feature: "specs" | "history" | "dealer"): boolean {
  const env =
    feature === "specs"
      ? process.env.MARKETCHECK_SPECS_ENABLED
      : feature === "history"
        ? process.env.MARKETCHECK_HISTORY_ENABLED
        : process.env.MARKETCHECK_DEALER_ENABLED;
  return env === "true";
}
