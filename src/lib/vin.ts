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

/** Equipment/spec fields vPIC returns for free alongside the identity. */
export interface VehicleEquipment {
  bodyStyle: string | null;
  drivetrain: string | null;
  engine: string | null;
  transmission: string | null;
  fuelType: string | null;
}

/** Identity + equipment from one decode. */
export interface DecodedVehicleDetailed extends DecodedVehicle {
  equipment: VehicleEquipment;
}

/** A single flattened record from vPIC's DecodeVinValues endpoint. */
interface VpicRecord {
  ModelYear?: string;
  Make?: string;
  Model?: string;
  Trim?: string;
  ErrorCode?: string;
  BodyClass?: string;
  DriveType?: string;
  DisplacementL?: string;
  EngineCylinders?: string;
  FuelTypePrimary?: string;
  TransmissionStyle?: string;
  EngineModel?: string;
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

/** vPIC frequently returns these placeholder strings for fields it can't fill. */
function clean(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  if (!t || /^(not applicable|not available|n\/a|none)$/i.test(t)) return null;
  return t;
}

/** Map a vPIC record's equipment fields. Pure + testable. Builds a readable
 *  engine string from displacement + cylinder count when present. */
export function parseVpicEquipment(rec: VpicRecord | undefined | null): VehicleEquipment {
  if (!rec) return { bodyStyle: null, drivetrain: null, engine: null, transmission: null, fuelType: null };
  const dispRaw = rec.DisplacementL ? Number(rec.DisplacementL) : NaN;
  const disp = Number.isFinite(dispRaw) && dispRaw > 0 ? `${dispRaw.toFixed(1)}L` : null;
  const cyl = clean(rec.EngineCylinders) ? `${clean(rec.EngineCylinders)}-Cyl` : null;
  const engine = [disp, cyl].filter(Boolean).join(" ") || clean(rec.EngineModel);
  return {
    bodyStyle: clean(rec.BodyClass),
    drivetrain: clean(rec.DriveType),
    engine: engine || null,
    transmission: clean(rec.TransmissionStyle),
    fuelType: clean(rec.FuelTypePrimary),
  };
}

/** Basic VIN shape check (17 chars, no I/O/Q). Not a checksum validation. */
export function looksLikeVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
}

const VPIC_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";

/** Fetch the raw vPIC record for a VIN. Null on any failure (network/bad VIN). */
async function fetchVpicRecord(vin: string): Promise<VpicRecord | null> {
  const clean = vin.trim().toUpperCase();
  if (!looksLikeVin(clean)) return null;
  try {
    const res = await fetch(`${VPIC_URL}/${clean}?format=json`, {
      // Cache aggressively — VIN decodes are immutable.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { Results?: VpicRecord[] };
    return json.Results?.[0] ?? null;
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

/** Decode a VIN to its identity. Returns null on any failure (network, bad VIN,
 *  or no make). Unchanged contract — used by the Deal Check form. */
export async function decodeVin(vin: string): Promise<DecodedVehicle | null> {
  const decoded = parseVpicResult(await fetchVpicRecord(vin));
  return decoded.make ? decoded : null;
}

/** Decode a VIN to identity + equipment in one call. Null when the decode is
 *  unusable (no make). Used by the Market Check engine so equipment is real per
 *  VIN even without the paid MarketCheck specs decode. */
export async function decodeVinDetailed(vin: string): Promise<DecodedVehicleDetailed | null> {
  const rec = await fetchVpicRecord(vin);
  const decoded = parseVpicResult(rec);
  if (!decoded.make) return null;
  return { ...decoded, equipment: parseVpicEquipment(rec) };
}
