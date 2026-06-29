/**
 * VIN decode via NHTSA's free public vPIC API (no key required).
 *
 * The parser (`parseVpicResult`) is pure and unit-tested; `decodeVin` adds the
 * network call. This is a pure enhancement to the Deal Check form — if the API
 * is unreachable or the VIN is junk, callers degrade silently and the buyer
 * just types the vehicle in.
 */

export interface DecodedVehicle {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
}

/** A single flattened record from vPIC's DecodeVinValues endpoint. */
interface VpicRecord {
  ModelYear?: string;
  Make?: string;
  Model?: string;
  Trim?: string;
  ErrorCode?: string;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Map a vPIC result record into our vehicle shape. Pure + testable. */
export function parseVpicResult(rec: VpicRecord | undefined | null): DecodedVehicle {
  if (!rec) return { year: null, make: null, model: null, trim: null };
  const yearNum = rec.ModelYear ? Number(rec.ModelYear) : NaN;
  return {
    year: Number.isFinite(yearNum) && yearNum > 1900 ? yearNum : null,
    make: rec.Make ? titleCase(rec.Make) : null,
    model: rec.Model ? titleCase(rec.Model) : null,
    trim: rec.Trim ? rec.Trim.trim() || null : null,
  };
}

/** Basic VIN shape check (17 chars, no I/O/Q). Not a checksum validation. */
export function looksLikeVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
}

const VPIC_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";

/** Decode a VIN. Returns null on any failure (network, bad VIN, etc.). */
export async function decodeVin(vin: string): Promise<DecodedVehicle | null> {
  const clean = vin.trim().toUpperCase();
  if (!looksLikeVin(clean)) return null;
  try {
    const res = await fetch(`${VPIC_URL}/${clean}?format=json`, {
      // Cache aggressively — VIN decodes are immutable.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { Results?: VpicRecord[] };
    const decoded = parseVpicResult(json.Results?.[0]);
    // Require at least a make to consider it a useful decode.
    return decoded.make ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * ISO 3779 VIN check-digit validation (position 9). A failed check digit
 * usually signals a typo, but this is a LOW-CONFIDENCE nudge only — some
 * legitimate VINs (older or imported) can fail it — so callers should gently
 * warn, never block. Returns false for anything that isn't a 17-char VIN shape.
 */
const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function vinCheckDigitValid(vin: string): boolean {
  const v = vin.trim().toUpperCase();
  if (!looksLikeVin(v)) return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = v[i];
    const value = /[0-9]/.test(c) ? Number(c) : VIN_TRANSLITERATION[c];
    if (value === undefined) return false;
    sum += value * VIN_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? "X" : String(remainder);
  return v[8] === expected;
}
