/**
 * ============================================================================
 *  Fee Engine — label aliases
 * ============================================================================
 *
 * Maps the many names a dealer line item travels under to a canonical
 * {@link FeeCategory}. Matching is substring + case-insensitive on a normalized
 * label. Order matters: more specific categories are checked before broad ones
 * (handled in classifyFees), so this file only declares the alias vocabulary.
 *
 * Doc-fee aliases are intentionally NOT duplicated here — that authority lives
 * in `intelligence/docFeeRules.ts` (`isDocFeeAlias` / `DOC_FEE_ALIASES`), which
 * classifyFees consults directly so the two never drift.
 * ============================================================================
 */
import type { FeeCategory } from "./types";

/** Government / required-charge aliases. */
export const GOVERNMENT_ALIASES: string[] = [
  "title",
  "registration",
  "tag",
  "license",
  "plate",
  "smog",
  "inspection",
  "government fee",
  "state fee",
  "county fee",
  "electronic filing",
  "e-filing",
  "efile",
  "tire fee",
];

/** Dealer prep / reconditioning aliases. */
export const DEALER_PREP_ALIASES: string[] = [
  "dealer prep",
  "dealer preparation",
  "prep fee",
  "preparation",
  "reconditioning",
  "recon",
  "dealer handling",
  "handling fee",
  "delivery and handling",
  "make ready",
  "lot prep",
];

/** VIN etch / theft-deterrent etch aliases. */
export const VIN_ETCH_ALIASES: string[] = [
  "vin etch",
  "vin etching",
  "window etch",
  "theft etch",
  "etch",
];

/** Nitrogen tire fill aliases. */
export const NITROGEN_ALIASES: string[] = ["nitrogen"];

/** Sales / excise tax aliases — a required government charge on the sale. */
export const TAX_ALIASES: string[] = [
  "sales tax",
  "excise tax",
  "use tax",
  "applicable tax",
  "applicable taxes",
  "tax",
];

/** Manufacturer freight / destination aliases — a set, non-negotiable charge
 *  the automaker bills to deliver the car to the dealer. */
export const FREIGHT_ALIASES: string[] = [
  "freight",
  "destination charge",
  "destination fee",
  "destination",
  "transportation charge",
];

/** Appearance / protection package aliases (when billed as a flat fee line). */
export const PROTECTION_PKG_ALIASES: string[] = [
  "protection package",
  "appearance package",
  "appearance protection",
  "protection pkg",
  "environmental package",
  "paint and fabric",
  "paint & fabric",
];

/** Advertising / market-adjustment dressed up as a mandatory fee. */
export const ADVERTISING_ALIASES: string[] = [
  "advertising",
  "ad fee",
  "market adjustment",
  "market value adjustment",
  "additional dealer markup",
  "adm",
];

/** Ordered category → alias list. Earlier entries win in classifyFees. */
export const FEE_ALIAS_TABLE: { category: FeeCategory; aliases: string[] }[] = [
  { category: "vin_etch", aliases: VIN_ETCH_ALIASES },
  { category: "nitrogen", aliases: NITROGEN_ALIASES },
  { category: "protection_pkg", aliases: PROTECTION_PKG_ALIASES },
  { category: "advertising", aliases: ADVERTISING_ALIASES },
  { category: "dealer_prep", aliases: DEALER_PREP_ALIASES },
  { category: "freight", aliases: FREIGHT_ALIASES },
  { category: "government", aliases: GOVERNMENT_ALIASES },
  { category: "tax", aliases: TAX_ALIASES },
];

/** Normalize a raw label for matching: lowercase, collapse whitespace. */
export function normalizeLabel(label: string): string {
  return (label ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
