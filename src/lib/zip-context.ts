/**
 * ZIP-code context — INTERNAL data enrichment only.
 *
 * Derives a coarse location signal (state + Census region) from a US ZIP code,
 * for our own analytics/segmentation. It is NEVER shown to the buyer and NEVER
 * used in any buyer-facing advice or score.
 *
 * Derivation uses only the first 3 digits (the SCF / ZIP3 prefix), mapped to a
 * state via contiguous numeric ranges — so we ship ~55 ranges, not 42k ZIPs,
 * with no dataset file and no network call. ZIP3 maps to the SCF's home state;
 * a handful of border SCFs are ambiguous, which is acceptable for an internal,
 * non-scored signal. Unknown/invalid input falls back to nulls.
 *
 * The `incomeContext` field is a reserved seam for a future ACS area-median
 * lookup (area average, not the person's income). It is always null for now.
 */

export type Region = "Northeast" | "Midwest" | "South" | "West";

export interface ZipContext {
  /** Normalized 5-digit ZIP. */
  zip: string;
  /** 2-letter state, or null if the prefix isn't recognized. */
  state: string | null;
  /** Census 4-region, or null. */
  region: Region | null;
  /** Reserved internal seam (area-median income band). Always null for now. */
  incomeContext: null;
}

/** ZIP3 prefix (numeric 0–999) → state, as inclusive ranges. */
interface Zip3Range {
  lo: number;
  hi: number;
  state: string;
}

// Standard USPS SCF (ZIP3) → state allocation. Ranges are inclusive; unassigned
// prefixes inside a range still resolve to the surrounding state (coarse by
// design). Gaps between ranges resolve to null.
const ZIP3_RANGES: Zip3Range[] = [
  { lo: 5, hi: 5, state: "NY" },
  { lo: 6, hi: 9, state: "PR" },
  { lo: 10, hi: 27, state: "MA" },
  { lo: 28, hi: 29, state: "RI" },
  { lo: 30, hi: 38, state: "NH" },
  { lo: 39, hi: 49, state: "ME" },
  { lo: 50, hi: 59, state: "VT" },
  { lo: 60, hi: 69, state: "CT" },
  { lo: 70, hi: 89, state: "NJ" },
  { lo: 100, hi: 149, state: "NY" },
  { lo: 150, hi: 196, state: "PA" },
  { lo: 197, hi: 199, state: "DE" },
  { lo: 200, hi: 205, state: "DC" },
  { lo: 206, hi: 219, state: "MD" },
  { lo: 220, hi: 246, state: "VA" },
  { lo: 247, hi: 268, state: "WV" },
  { lo: 270, hi: 289, state: "NC" },
  { lo: 290, hi: 299, state: "SC" },
  { lo: 300, hi: 319, state: "GA" },
  { lo: 320, hi: 349, state: "FL" },
  { lo: 350, hi: 369, state: "AL" },
  { lo: 370, hi: 385, state: "TN" },
  { lo: 386, hi: 397, state: "MS" },
  { lo: 398, hi: 399, state: "GA" },
  { lo: 400, hi: 427, state: "KY" },
  { lo: 430, hi: 459, state: "OH" },
  { lo: 460, hi: 479, state: "IN" },
  { lo: 480, hi: 499, state: "MI" },
  { lo: 500, hi: 528, state: "IA" },
  { lo: 530, hi: 549, state: "WI" },
  { lo: 550, hi: 567, state: "MN" },
  { lo: 570, hi: 577, state: "SD" },
  { lo: 580, hi: 588, state: "ND" },
  { lo: 590, hi: 599, state: "MT" },
  { lo: 600, hi: 629, state: "IL" },
  { lo: 630, hi: 658, state: "MO" },
  { lo: 660, hi: 679, state: "KS" },
  { lo: 680, hi: 693, state: "NE" },
  { lo: 700, hi: 714, state: "LA" },
  { lo: 716, hi: 729, state: "AR" },
  { lo: 730, hi: 749, state: "OK" },
  { lo: 750, hi: 799, state: "TX" },
  { lo: 800, hi: 816, state: "CO" },
  { lo: 820, hi: 831, state: "WY" },
  { lo: 832, hi: 838, state: "ID" },
  { lo: 840, hi: 847, state: "UT" },
  { lo: 850, hi: 865, state: "AZ" },
  { lo: 870, hi: 884, state: "NM" },
  { lo: 885, hi: 885, state: "TX" },
  { lo: 889, hi: 898, state: "NV" },
  { lo: 900, hi: 961, state: "CA" },
  { lo: 967, hi: 968, state: "HI" },
  { lo: 970, hi: 979, state: "OR" },
  { lo: 980, hi: 994, state: "WA" },
  { lo: 995, hi: 999, state: "AK" },
];

const STATE_TO_REGION: Record<string, Region> = {
  // Northeast
  CT: "Northeast", ME: "Northeast", MA: "Northeast", NH: "Northeast",
  RI: "Northeast", VT: "Northeast", NJ: "Northeast", NY: "Northeast",
  PA: "Northeast",
  // Midwest
  IL: "Midwest", IN: "Midwest", MI: "Midwest", OH: "Midwest", WI: "Midwest",
  IA: "Midwest", KS: "Midwest", MN: "Midwest", MO: "Midwest", NE: "Midwest",
  ND: "Midwest", SD: "Midwest",
  // South
  DE: "South", FL: "South", GA: "South", MD: "South", NC: "South", SC: "South",
  VA: "South", DC: "South", WV: "South", AL: "South", KY: "South", MS: "South",
  TN: "South", AR: "South", LA: "South", OK: "South", TX: "South",
  // West
  AZ: "West", CO: "West", ID: "West", MT: "West", NV: "West", NM: "West",
  UT: "West", WY: "West", AK: "West", CA: "West", HI: "West", OR: "West",
  WA: "West",
  // PR has no Census 4-region; leave it out (resolves to null region).
};

/** True if the input is a clean 5-digit ZIP (ignoring surrounding whitespace). */
export function isValidZip(raw: string): boolean {
  return /^\d{5}$/.test(raw.trim());
}

/** Map a 5-digit ZIP to a 2-letter state via its ZIP3 prefix, or null. */
export function zip3ToState(zip: string): string | null {
  if (!isValidZip(zip)) return null;
  const prefix = Number(zip.trim().slice(0, 3));
  for (const r of ZIP3_RANGES) {
    if (prefix >= r.lo && prefix <= r.hi) return r.state;
  }
  return null;
}

/**
 * Derive internal location context from a ZIP. Returns null for invalid input;
 * an unrecognized-but-valid ZIP returns `{ state: null, region: null }`.
 */
export function deriveZipContext(raw: string): ZipContext | null {
  if (!isValidZip(raw)) return null;
  const zip = raw.trim();
  const state = zip3ToState(zip);
  const region = state ? STATE_TO_REGION[state] ?? null : null;
  return { zip, state, region, incomeContext: null };
}
