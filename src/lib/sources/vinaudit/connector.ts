/**
 * VinAudit connector — SERVER-ONLY raw NMVTIS API access. The key is read from
 * `process.env.VINAUDIT_API_KEY` and never reaches the browser. Returns null
 * when unconfigured or the call fails, so the title layer degrades to "hidden".
 *
 * Endpoint (key + vin as query params):
 *   GET api.vinaudit.com/v2/query?key=&vin=&format=json
 *
 * NOTE: the raw field names below follow VinAudit's documented JSON shape and
 * are LOOP-CHECKED against a real response before we rely on them in production
 * (the sandbox can't reach the API to confirm). The normalizer reads defensively
 * so a shape surprise degrades to null rather than throwing.
 */
const BASE = "https://api.vinaudit.com/v2/query";
const TIMEOUT_MS = 10_000;
/** Title history is stable per VIN — cache aggressively. */
const TTL = 60 * 60 * 24 * 30; // 30d

/** A raw title record. */
export interface RawTitleRecord {
  state?: string;
  date?: string;
  meter?: number | string;
  current?: boolean;
}

/** A raw brand record (salvage/junk/flood/…). */
export interface RawBrand {
  code?: string;
  label?: string;
  state?: string;
  date?: string;
}

/** A raw junk/salvage/insurance (total-loss) record. */
export interface RawJsiRecord {
  type?: string;
  date?: string;
  state?: string;
}

export interface RawVinAuditResponse {
  success?: boolean;
  error?: string;
  vin?: string;
  titles?: RawTitleRecord[];
  brands?: RawBrand[];
  /** Junk / salvage / insurance (total-loss) records. */
  jsi?: RawJsiRecord[];
  thefts?: unknown[];
  /** Estimated owner count, when VinAudit provides it. */
  owners?: number;
}

function apiKey(): string | null {
  return process.env.VINAUDIT_API_KEY ?? null;
}

/** True when a VinAudit key is present. */
export function isConfigured(): boolean {
  return Boolean(apiKey());
}

/** True only when the operator has explicitly opted in. Defaults OFF so a paid
 *  per-report call is never made unless enabled. */
export function isEnabled(): boolean {
  return process.env.VINAUDIT_ENABLED === "true";
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

/** Fetch the raw NMVTIS title history for a VIN. Null when unconfigured/failed. */
export async function fetchTitleHistory(
  vin: string,
): Promise<RawVinAuditResponse | null> {
  const key = apiKey();
  if (!key || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) return null;
  const params = new URLSearchParams({
    key,
    vin: vin.trim().toUpperCase(),
    format: "json",
  });
  return getJson<RawVinAuditResponse>(`${BASE}?${params.toString()}`);
}
