/**
 * ============================================================================
 *  resolveDealState — pick the best available jurisdiction for a deal.
 * ============================================================================
 *
 * Doc-fee intelligence (and later, other state-aware rules) needs the buyer's
 * REGISTRATION/TAX state. Buyers rarely type it cleanly, so we resolve it from
 * whatever the form, profile, or an uploaded quote gave us — preferring the most
 * reliable signal and being honest about confidence and limitations.
 *
 * Priority (most → least reliable):
 *   1. explicit registration state   (high)
 *   2. explicit purchase state       (high)   — incl. the "what state are you
 *                                               buying in?" step (`buyerState`)
 *   3. registration ZIP → state      (medium) — ZIP-prefix inference
 *   4. dealer ZIP → state            (medium) — buyer may register elsewhere
 *   5. dealer address → state        (medium)
 *   6. user profile state            (medium)
 *   7. unknown                       (low)    — never guessed
 *
 * No network calls. ZIP→state uses a small, hand-verified ZIP3-prefix table for
 * the states we actually have doc-fee rules for; anything outside it resolves to
 * `unknown` rather than a wrong guess.
 * ============================================================================
 */

import { US_JURISDICTIONS, type Confidence } from "./docFeeRules";

export type StateSource =
  | "explicit_registration_state"
  | "explicit_purchase_state"
  | "registration_zip"
  | "dealer_zip"
  | "dealer_address"
  | "user_profile"
  | "unknown";

export interface StateResolution {
  stateCode: string | null;
  source: StateSource;
  confidence: Confidence;
  limitations?: string;
}

/** The signals resolveDealState will consider. All optional. */
export interface DealStateInput {
  registrationState?: string | null;
  purchaseState?: string | null;
  /** Generic explicit state (the "what state are you buying in?" answer). */
  buyerState?: string | null;
  registrationZip?: string | null;
  dealerZip?: string | null;
  dealerState?: string | null;
  dealerAddress?: string | null;
  userProfileState?: string | null;
  /** Generic ZIP fallback (treated as a registration ZIP). */
  zip?: string | null;
}

const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(US_JURISDICTIONS).map(([code, name]) => [name.toLowerCase(), code]),
);

/** Normalize a free-text state to a 2-letter code, or null if not recognized. */
export function normalizeStateCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (upper.length === 2 && US_JURISDICTIONS[upper]) return upper;
  const byName = NAME_TO_CODE[s.toLowerCase()];
  return byName ?? null;
}

/* ---------------------------------------------------------------------------
 *  ZIP → state (hand-verified ZIP3 prefixes for the sourced doc-fee states).
 *  Public USPS ZIP-prefix allocations; stable. Outside these → null (unknown).
 * ------------------------------------------------------------------------- */

type Zip3Range = [number, number];

/**
 * ZIP3-prefix → state for all 50 states + DC, from the public USPS ZIP-prefix
 * allocation (stable). Known split prefixes are special-cased: 733 is TX
 * (Austin) inside Oklahoma's range; 055 is MA inside Vermont's; 201 is VA and
 * 200/202–205 are DC. Military/territory prefixes (006–009, 090–098, 340,
 * 962–969) are intentionally omitted → null (unknown), never a wrong guess.
 */
const ZIP3_RANGES: { state: string; ranges: Zip3Range[] }[] = [
  { state: "MA", ranges: [[10, 27], [55, 55]] },
  { state: "RI", ranges: [[28, 29]] },
  { state: "NH", ranges: [[30, 38]] },
  { state: "ME", ranges: [[39, 49]] },
  { state: "VT", ranges: [[50, 54], [56, 59]] },
  { state: "CT", ranges: [[60, 69]] },
  { state: "NJ", ranges: [[70, 89]] },
  { state: "NY", ranges: [[100, 149]] },
  { state: "PA", ranges: [[150, 196]] },
  { state: "DE", ranges: [[197, 199]] },
  { state: "DC", ranges: [[200, 200], [202, 205]] },
  { state: "VA", ranges: [[201, 201], [220, 246]] },
  { state: "MD", ranges: [[206, 219]] },
  { state: "WV", ranges: [[247, 268]] },
  { state: "NC", ranges: [[270, 289]] },
  { state: "SC", ranges: [[290, 299]] },
  { state: "GA", ranges: [[300, 319], [398, 399]] },
  { state: "FL", ranges: [[320, 339], [341, 342], [344, 349]] },
  { state: "AL", ranges: [[350, 369]] },
  { state: "TN", ranges: [[370, 385]] },
  { state: "MS", ranges: [[386, 397]] },
  { state: "KY", ranges: [[400, 427]] },
  { state: "OH", ranges: [[430, 459]] },
  { state: "IN", ranges: [[460, 479]] },
  { state: "MI", ranges: [[480, 499]] },
  { state: "IA", ranges: [[500, 528]] },
  { state: "WI", ranges: [[530, 549]] },
  { state: "MN", ranges: [[550, 567]] },
  { state: "SD", ranges: [[570, 577]] },
  { state: "ND", ranges: [[580, 588]] },
  { state: "MT", ranges: [[590, 599]] },
  { state: "IL", ranges: [[600, 629]] },
  { state: "MO", ranges: [[630, 658]] },
  { state: "KS", ranges: [[660, 679]] },
  { state: "NE", ranges: [[680, 693]] },
  { state: "LA", ranges: [[700, 714]] },
  { state: "AR", ranges: [[716, 729]] },
  { state: "OK", ranges: [[730, 732], [734, 749]] },
  { state: "TX", ranges: [[733, 733], [750, 799], [885, 885]] },
  { state: "CO", ranges: [[800, 816]] },
  { state: "WY", ranges: [[820, 831]] },
  { state: "ID", ranges: [[832, 838]] },
  { state: "UT", ranges: [[840, 847]] },
  { state: "AZ", ranges: [[850, 865]] },
  { state: "NM", ranges: [[870, 884]] },
  { state: "NV", ranges: [[889, 898]] },
  { state: "CA", ranges: [[900, 961]] },
  { state: "HI", ranges: [[967, 968]] },
  { state: "OR", ranges: [[970, 979]] },
  { state: "WA", ranges: [[980, 994]] },
  { state: "AK", ranges: [[995, 999]] },
];

/**
 * Map a US ZIP (5-digit or ZIP+4) to a state, using verified ZIP3 prefixes for
 * the states we have doc-fee rules for. Returns null for anything outside the
 * table — we never guess a state from an unknown prefix.
 */
export function zipToState(zip: string | null | undefined): string | null {
  if (!zip) return null;
  const digits = zip.replace(/[^0-9]/g, "");
  if (digits.length < 5) return null; // need a full ZIP to be safe
  const z3 = Number(digits.slice(0, 3));
  if (!Number.isFinite(z3)) return null;
  for (const { state, ranges } of ZIP3_RANGES) {
    if (ranges.some(([lo, hi]) => z3 >= lo && z3 <= hi)) return state;
  }
  return null;
}

/** Try to pull a state (", MD ") or ZIP from a free-text address. */
function stateFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  // Explicit 2-letter state, e.g. "..., Rockville, MD 20850"
  const m = address.toUpperCase().match(/\b([A-Z]{2})\b(?:\s+\d{5}(?:-\d{4})?)?\s*$/);
  if (m && US_JURISDICTIONS[m[1]]) return m[1];
  // Fall back to a ZIP found anywhere in the string.
  const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
  return zipToState(zipMatch?.[0] ?? null);
}

/**
 * Resolve the best jurisdiction for a deal. Pure and deterministic. Never
 * guesses: unresolvable input returns `unknown` with a limitation.
 */
export function resolveDealState(input: DealStateInput): StateResolution {
  const regState = normalizeStateCode(input.registrationState);
  if (regState) {
    return { stateCode: regState, source: "explicit_registration_state", confidence: "high" };
  }

  const purchaseState =
    normalizeStateCode(input.purchaseState) ?? normalizeStateCode(input.buyerState);
  if (purchaseState) {
    return { stateCode: purchaseState, source: "explicit_purchase_state", confidence: "high" };
  }

  const regZipState = zipToState(input.registrationZip) ?? zipToState(input.zip);
  if (regZipState) {
    return {
      stateCode: regZipState,
      source: "registration_zip",
      confidence: "medium",
      limitations: "State inferred from your ZIP code.",
    };
  }

  const dealerZipState = zipToState(input.dealerZip);
  if (dealerZipState) {
    return {
      stateCode: dealerZipState,
      source: "dealer_zip",
      confidence: "medium",
      limitations:
        "State taken from the dealer ZIP — your registration/tax state may differ; verify if you'll register elsewhere.",
    };
  }

  const dealerAddrState = normalizeStateCode(input.dealerState) ?? stateFromAddress(input.dealerAddress);
  if (dealerAddrState) {
    return {
      stateCode: dealerAddrState,
      source: "dealer_address",
      confidence: "medium",
      limitations:
        "State taken from the dealer location — your registration/tax state may differ; verify if you'll register elsewhere.",
    };
  }

  const profileState = normalizeStateCode(input.userProfileState);
  if (profileState) {
    return { stateCode: profileState, source: "user_profile", confidence: "medium" };
  }

  return {
    stateCode: null,
    source: "unknown",
    confidence: "low",
    limitations: "No state available to verify a doc-fee rule.",
  };
}

/** A short, buyer-facing note explaining where the state came from. */
export function stateSourceNote(res: StateResolution): string {
  if (!res.stateCode) return "";
  const name = US_JURISDICTIONS[res.stateCode] ?? res.stateCode;
  switch (res.source) {
    case "explicit_registration_state":
      return `Using ${name} (your registration state).`;
    case "registration_zip":
      return `Using ${name} from your ZIP code.`;
    case "dealer_zip":
      return `Using ${name} from the dealer ZIP as a fallback — verify if you'll register elsewhere.`;
    case "dealer_address":
      return `Using ${name} from the dealer location as a fallback — verify if you'll register elsewhere.`;
    case "user_profile":
      return `Using ${name} from your profile.`;
    case "explicit_purchase_state":
    default:
      return "";
  }
}
