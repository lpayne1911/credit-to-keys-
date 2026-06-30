/**
 * NHTSA connector — SERVER-OK raw API access. Both endpoints are free and
 * KEYLESS (no api_key), so this can run anywhere. Every function returns null
 * on any failure (network/timeout/bad shape) so the orchestrator degrades to
 * "nothing reported" instead of throwing.
 *
 * Endpoints:
 *   - GET api.nhtsa.gov/recalls/recallsByVehicle?make=&model=&modelYear=
 *   - GET api.nhtsa.gov/SafetyRatings/modelyear/{y}/make/{mk}/model/{md}
 *   - GET api.nhtsa.gov/SafetyRatings/VehicleId/{id}
 */
const RECALLS_BASE = "https://api.nhtsa.gov/recalls/recallsByVehicle";
const RATINGS_BASE = "https://api.nhtsa.gov/SafetyRatings";
const TIMEOUT_MS = 8_000;
/** Recalls/ratings change slowly; cache a day. */
const TTL = 60 * 60 * 24;

export interface RawRecall {
  NHTSACampaignNumber?: string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
  Notes?: string;
  ReportReceivedDate?: string;
}

export interface RawRecallsResponse {
  Count?: number;
  /** This endpoint returns rows under lowercase `results`; we also accept the
   *  uppercase `Results` other NHTSA endpoints use, so a casing surprise can't
   *  silently zero out the feature. */
  results?: RawRecall[];
  Results?: RawRecall[];
}

export interface RawRatingVariant {
  VehicleId?: number;
  VehicleDescription?: string;
}

export interface RawRatingVariantsResponse {
  Count?: number;
  Results?: RawRatingVariant[];
  results?: RawRatingVariant[];
}

export interface RawRatingDetail {
  OverallRating?: string;
  OverallFrontCrashRating?: string;
  OverallSideCrashRating?: string;
  RolloverRating?: string;
  /** Vehicle-level safety signals carried in the same detail response. */
  ComplaintsCount?: number;
  InvestigationCount?: number;
  RecallsCount?: number;
  NHTSAForwardCollisionWarning?: string;
  NHTSALaneDepartureWarning?: string;
  NHTSAElectronicStabilityControl?: string;
}

export interface RawRatingDetailResponse {
  Count?: number;
  Results?: RawRatingDetail[];
  results?: RawRatingDetail[];
}

/** Fetch + parse JSON with a timeout. Null on any non-OK/network/timeout. */
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

/** Open recalls for a year/make/model. Null on failure. */
export async function fetchRecalls(
  year: number,
  make: string,
  model: string,
): Promise<RawRecallsResponse | null> {
  const params = new URLSearchParams({
    make: make,
    model: model,
    modelYear: String(year),
  });
  return getJson<RawRecallsResponse>(`${RECALLS_BASE}?${params.toString()}`);
}

/** NCAP rated-variant list for a year/make/model (step 1 of the 2-step ratings
 *  lookup). Null on failure. */
export async function fetchSafetyVariants(
  year: number,
  make: string,
  model: string,
): Promise<RawRatingVariant[] | null> {
  const url = `${RATINGS_BASE}/modelyear/${year}/make/${encodeURIComponent(
    make,
  )}/model/${encodeURIComponent(model)}`;
  const data = await getJson<RawRatingVariantsResponse>(url);
  return data?.Results ?? data?.results ?? null;
}

/** Full crash-test ratings for a specific NCAP VehicleId (step 2). Null on failure. */
export async function fetchRatingDetail(
  vehicleId: number,
): Promise<RawRatingDetail | null> {
  const data = await getJson<RawRatingDetailResponse>(
    `${RATINGS_BASE}/VehicleId/${vehicleId}`,
  );
  return data?.Results?.[0] ?? data?.results?.[0] ?? null;
}
