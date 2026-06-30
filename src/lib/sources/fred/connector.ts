/**
 * FRED connector — SERVER-ONLY raw API access. The key is read from
 * `process.env.FRED_API_KEY` and never reaches the browser. Returns null when
 * the key is absent or the call fails, so the deal engine keeps its placeholder
 * band rather than guessing.
 *
 * Endpoint:
 *   GET api.stlouisfed.org/fred/series/observations?series_id=&api_key=&file_type=json
 */
const BASE = "https://api.stlouisfed.org/fred/series/observations";
const TIMEOUT_MS = 8_000;
/** Rates update at most monthly — cache a week. */
const TTL = 60 * 60 * 24 * 7;

/**
 * G.19 "Finance Rate on Consumer Installment Loans at Commercial Banks, New
 * Autos 48 Month Loan" — FRED's canonical published consumer-auto APR series.
 * We anchor every term to it (the low/high band absorbs term variance); confirm
 * against FRED's catalog if a term-specific series is ever wired in.
 */
const SERIES_AUTO_48MO_NEW = "TERMCBAUTO48NS";

export interface RawObservation {
  date?: string;
  value?: string;
}

export interface RawObservationsResponse {
  observations?: RawObservation[];
}

function apiKey(): string | null {
  return process.env.FRED_API_KEY ?? null;
}

/** True when a FRED key is present. */
export function isConfigured(): boolean {
  return Boolean(apiKey());
}

/** True only when the operator has explicitly opted in. Defaults OFF so the
 *  free tier (100 calls/120s) is never spent unless enabled. */
export function isEnabled(): boolean {
  return process.env.FRED_ENABLED === "true";
}

/** Which FRED series backs a given loan term. */
function seriesForTerm(_termMonths: number): string {
  return SERIES_AUTO_48MO_NEW;
}

async function getJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: TTL } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch the most recent ~year of observations for the term's series (latest
 *  first). Null when unconfigured or the call fails. */
export async function fetchAprObservations(
  termMonths: number,
): Promise<RawObservationsResponse | null> {
  const key = apiKey();
  if (!key) return null;
  const params = new URLSearchParams({
    series_id: seriesForTerm(termMonths),
    api_key: key,
    file_type: "json",
    sort_order: "desc",
    limit: "13",
  });
  return getJson<RawObservationsResponse>(`${BASE}?${params.toString()}`);
}
