/**
 * ============================================================================
 *  Output Contract — fee copy catalog
 * ============================================================================
 *
 * The buyer-facing reason + suggested action for each non-doc fee category.
 * The fee engine reads from here; it keeps the assessment level, confidence, and
 * impact-range logic. Doc/processing fees get state-aware copy from
 * `intelligence/docFeeRules`, so they are intentionally not in this catalog.
 */
import type { FeeCategory } from "@/lib/fee-engine/types";

export interface CopyEntry {
  reason: string;
  suggestedAction: string;
}

export const FEE_COPY: Record<Exclude<FeeCategory, "doc_fee">, CopyEntry> = {
  government: {
    reason:
      "Looks like a required government charge (title, registration, or filing). Confirm it matches your state's actual amount and is itemized separately from dealer fees.",
    suggestedAction:
      "Ask for this itemized against your state's real cost so any dealer padding is separated out.",
  },
  tax: {
    reason:
      "Sales/excise tax is a required government charge set by your state, not a dealer fee. Confirm the rate and taxable amount match your state's rules.",
    suggestedAction:
      "Check the tax is calculated on the correct price (after eligible rebates/trade, per your state) so it isn't overstated.",
  },
  freight: {
    reason:
      "Freight / destination is the manufacturer's set charge to ship the car to the dealer. It's a real, non-negotiable cost printed on the window sticker — not dealer padding.",
    suggestedAction:
      "Confirm it matches the destination charge on the Monroney (window) sticker; it shouldn't exceed that figure.",
  },
  dealer_prep: {
    reason:
      "Dealer prep / reconditioning is a cost of getting the car ready to sell, which is generally built into the price. Billing it again as a separate line is commonly negotiable.",
    suggestedAction:
      "Ask the dealer to remove this or fold it into the selling price; request a revised buyer's order.",
  },
  vin_etch: {
    reason:
      "VIN/theft etch is a low-cost add-on often pre-installed and marked up. It is optional and a common source of padding.",
    suggestedAction:
      "Decline it and ask for a revised buyer's order without the etch charge.",
  },
  nitrogen: {
    reason:
      "A nitrogen tire-fill charge is optional and typically low-value. It is a frequent source of fee padding.",
    suggestedAction:
      "Decline it and request a revised buyer's order without the nitrogen line.",
  },
  protection_pkg: {
    reason:
      "Appearance/protection packages billed as a flat fee are optional and frequently marked up. Treat this as an add-on, not a mandatory cost.",
    suggestedAction:
      "Ask whether it can be removed; request a revised buyer's order without it if you don't want it.",
  },
  advertising: {
    reason:
      "Advertising or market-adjustment lines are dealer-set amounts, not required costs. They are commonly negotiable.",
    suggestedAction:
      "Push back on this through the out-the-door price and ask for a revised buyer's order.",
  },
  other: {
    reason:
      "We couldn't confidently categorize this line. It may be legitimate or padding — worth a clarification before signing.",
    suggestedAction:
      "Ask the dealer to explain what this charge covers and why it applies.",
  },
};
