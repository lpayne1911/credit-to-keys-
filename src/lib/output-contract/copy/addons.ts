/**
 * ============================================================================
 *  Output Contract — add-on copy catalog
 * ============================================================================
 *
 * The buyer-facing reason + suggested action for each F&I add-on category. The
 * add-on engine reads from here; it keeps the overpriced/cancellation/
 * human-review flags and impact-fraction logic. Some categories intentionally
 * share identical copy (e.g. ceramic / paint_fabric / appearance).
 */
import type { AddOnCategory } from "@/lib/add-on-engine/types";
import type { CopyEntry } from "./fees";

const COSMETIC: CopyEntry = {
  reason:
    "Paint, fabric, ceramic, and appearance protection are optional cosmetic products commonly marked up well above cost.",
  suggestedAction:
    "Decline if unwanted, or ask for the price separately so you can decide; request a revised buyer's order.",
};

const THEFT_GPS: CopyEntry = {
  reason:
    "Theft-protection, etch, and GPS/recovery products are optional and frequently pre-installed and marked up.",
  suggestedAction:
    "Ask whether it can be removed; request a revised buyer's order without it if you don't want it.",
};

export const ADDON_COPY: Record<AddOnCategory, CopyEntry> = {
  vsc: {
    reason:
      "A vehicle service contract is optional and commonly marked up in the finance office. The same coverage is often available for less, and contracts are usually cancellable for a prorated refund.",
    suggestedAction:
      "Ask for the contract terms and price in writing, and request cancellation terms before deciding. You can compare coverage elsewhere.",
  },
  gap: {
    reason:
      "GAP is optional and often marked up at the dealer. Your own lender or insurer may offer it for less, and it is usually cancellable for a prorated refund.",
    suggestedAction:
      "Compare the dealer's GAP price to your lender/insurer and ask for cancellation terms.",
  },
  tire_wheel: {
    reason:
      "Tire & wheel / road-hazard coverage is optional and frequently marked up. Worth weighing against the cost of an occasional repair.",
    suggestedAction:
      "Decide if you want it; if not, request a revised buyer's order without it.",
  },
  maintenance: {
    reason:
      "A prepaid maintenance plan is optional. It can have value if priced near the cost of the services it covers — check that math before financing it.",
    suggestedAction:
      "Ask exactly which services are covered and compare to paying as you go.",
  },
  key: {
    reason:
      "Key replacement coverage is optional and often low-value relative to its price.",
    suggestedAction:
      "Decline if you don't want it; request a revised buyer's order without it.",
  },
  ceramic: COSMETIC,
  paint_fabric: COSMETIC,
  appearance: COSMETIC,
  theft: THEFT_GPS,
  lojack_gps: THEFT_GPS,
  nitrogen: {
    reason:
      "Nitrogen tire fill is optional and typically low-value. A common source of padding.",
    suggestedAction:
      "Decline it and request a revised buyer's order without the nitrogen line.",
  },
  other: {
    reason:
      "We couldn't confidently identify this product. It is listed as an add-on, so it is likely optional — worth a clarification before financing it.",
    suggestedAction:
      "Ask the dealer what this product is, what it costs, and whether it is cancellable.",
  },
};
