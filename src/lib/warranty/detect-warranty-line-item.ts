/**
 * Detects whether a quote line item (or free-form label) is probably a vehicle
 * service contract / extended warranty / extended service plan / mechanical
 * breakdown coverage / OEM or third-party service contract.
 *
 * Design rules:
 *  - Distinctive multi-word phrases and brand names match as substrings.
 *  - Bare abbreviations (VSC, ESP, MBI, …) match only as standalone words, so
 *    they don't fire inside unrelated words (e.g. "esp" in "especially").
 *  - Generic tier words ("platinum", "gold") and ambiguous abbreviations
 *    ("VSA" = Honda Vehicle Stability Assist, "UCC" = Uniform Commercial Code)
 *    are NEVER matched — they're omitted from matchTerms and double-guarded.
 *  - Excluded F&I products (GAP, tire & wheel, key, paint/fabric, prepaid
 *    maintenance, etc.) VETO a match even if some other term also appears, so a
 *    buyer is never told they're "covered" for a product this check doesn't price.
 */
import {
  matchTerms,
  excludedProducts,
  ambiguousTermsExcluded,
} from "./warranty-catalog";

/** Abbreviations short enough to require whole-word matching. */
const SHORT_TERMS = new Set([
  "vsc",
  "esc",
  "esp",
  "epp",
  "vpp",
  "mbi",
  "mbp",
  "gmpp",
  "gmepp",
  "mvp",
  "vip",
  "esa",
  "evsp",
  "vsp",
  "mpp",
  "fws",
  "agws",
  "orias",
  "nsd",
  "cpo",
  "gap",
]);

const AMBIGUOUS = new Set(ambiguousTermsExcluded);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+&-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole-word containment for short/ambiguous tokens; substring otherwise. */
function contains(haystackPadded: string, haystack: string, term: string): boolean {
  if (SHORT_TERMS.has(term)) return haystackPadded.includes(` ${term} `);
  return haystack.includes(term);
}

export interface WarrantyDetection {
  /** True when the line item is probably a vehicle service contract. */
  isWarranty: boolean;
  /** The catalog term that matched, if any. */
  matchedTerm: string | null;
  /** An excluded F&I product that vetoed/blocked a warranty match, if any. */
  excludedBy: string | null;
}

/**
 * Classify a single line item / label. Returns the match result with the term
 * that triggered it (or the excluded product that vetoed it) for transparency.
 */
export function detectWarrantyLineItem(
  text: string | null | undefined,
): WarrantyDetection {
  const result: WarrantyDetection = {
    isWarranty: false,
    matchedTerm: null,
    excludedBy: null,
  };
  if (!text) return result;
  const norm = normalize(text);
  if (!norm) return result;
  const padded = ` ${norm} `;

  // 1) Excluded F&I products veto a warranty classification outright.
  for (const ex of excludedProducts) {
    const e = normalize(ex);
    if (!e) continue;
    if (contains(padded, norm, e)) {
      result.excludedBy = ex;
      return result; // not a warranty — it's an adjacent (excluded) product
    }
  }

  // 2) Look for a distinctive warranty term. Ambiguous bare terms never count.
  for (const term of matchTerms) {
    const t = normalize(term);
    if (!t || AMBIGUOUS.has(t)) continue;
    if (contains(padded, norm, t)) {
      result.isWarranty = true;
      result.matchedTerm = term;
      return result;
    }
  }

  return result;
}

/** Convenience boolean: is this line item probably a service contract? */
export function isWarrantyLineItem(text: string | null | undefined): boolean {
  return detectWarrantyLineItem(text).isWarranty;
}
