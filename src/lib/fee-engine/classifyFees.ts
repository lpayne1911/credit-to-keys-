/**
 * ============================================================================
 *  Fee Engine — classifier
 * ============================================================================
 *
 * Turns raw dealer fee lines into decision-support {@link FeeAssessment}s.
 *
 * Doc/processing/admin fees are routed through the state-aware authority in
 * `intelligence/docFeeRules.ts` (`isDocFeeAlias` + `classifyDocFeeAmount`) so
 * cap comparisons only ever run against VERIFIED state rules. Everything else
 * is classified from a small, conservative alias table.
 *
 * Compliance: copy is decision-support only — never "illegal", "fraud",
 * "scam", or a legal conclusion. We say "possible overcharge", "ask for
 * clarification", "request revised buyer's order".
 *
 * Pure + deterministic. No network, no AI.
 * ============================================================================
 */
import type { PriceRange } from "@/lib/fairness-engine";
import {
  classifyDocFeeAmount,
  isDocFeeAlias,
} from "@/lib/intelligence/docFeeRules";
import { FEE_ALIAS_TABLE, normalizeLabel } from "./aliases";
import type {
  FeeAssessment,
  FeeAssessmentLevel,
  FeeCategory,
  FieldConfidence,
} from "./types";

export interface ClassifyFeesContext {
  /** Two-letter state code for doc-fee cap comparison. Optional. */
  stateCode?: string | null;
}

/** A single raw fee line as it arrives from intake/extraction. */
export interface RawFeeLine {
  rawLabel: string;
  amount: number;
}

/** Map a non-doc category to its base assessment + reason + action. */
function assessByCategory(
  category: FeeCategory,
  amount: number,
): {
  assessment: FeeAssessmentLevel;
  reason: string;
  suggestedAction: string;
  confidence: FieldConfidence;
  estimatedImpact: PriceRange | null;
} {
  switch (category) {
    case "government":
      return {
        assessment: "likely_legitimate",
        reason:
          "Looks like a required government charge (title, registration, or filing). Confirm it matches your state's actual amount and is itemized separately from dealer fees.",
        suggestedAction:
          "Ask for this itemized against your state's real cost so any dealer padding is separated out.",
        confidence: "medium",
        estimatedImpact: null,
      };
    case "tax":
      return {
        assessment: "likely_legitimate",
        reason:
          "Sales/excise tax is a required government charge set by your state, not a dealer fee. Confirm the rate and taxable amount match your state's rules.",
        suggestedAction:
          "Check the tax is calculated on the correct price (after eligible rebates/trade, per your state) so it isn't overstated.",
        confidence: "medium",
        estimatedImpact: null,
      };
    case "freight":
      return {
        assessment: "likely_legitimate",
        reason:
          "Freight / destination is the manufacturer's set charge to ship the car to the dealer. It's a real, non-negotiable cost printed on the window sticker — not dealer padding.",
        suggestedAction:
          "Confirm it matches the destination charge on the Monroney (window) sticker; it shouldn't exceed that figure.",
        confidence: "medium",
        estimatedImpact: null,
      };
    case "dealer_prep":
      return {
        assessment: "likely_negotiable",
        reason:
          "Dealer prep / reconditioning is a cost of getting the car ready to sell, which is generally built into the price. Billing it again as a separate line is commonly negotiable.",
        suggestedAction:
          "Ask the dealer to remove this or fold it into the selling price; request a revised buyer's order.",
        confidence: "medium",
        estimatedImpact: rangeAround(amount),
      };
    case "vin_etch":
      return {
        assessment: "likely_junk",
        reason:
          "VIN/theft etch is a low-cost add-on often pre-installed and marked up. It is optional and a common source of padding.",
        suggestedAction:
          "Decline it and ask for a revised buyer's order without the etch charge.",
        confidence: "medium",
        estimatedImpact: rangeAround(amount),
      };
    case "nitrogen":
      return {
        assessment: "likely_junk",
        reason:
          "A nitrogen tire-fill charge is optional and typically low-value. It is a frequent source of fee padding.",
        suggestedAction:
          "Decline it and request a revised buyer's order without the nitrogen line.",
        confidence: "medium",
        estimatedImpact: rangeAround(amount),
      };
    case "protection_pkg":
      return {
        assessment: "questionable",
        reason:
          "Appearance/protection packages billed as a flat fee are optional and frequently marked up. Treat this as an add-on, not a mandatory cost.",
        suggestedAction:
          "Ask whether it can be removed; request a revised buyer's order without it if you don't want it.",
        confidence: "medium",
        estimatedImpact: rangeAround(amount),
      };
    case "advertising":
      return {
        assessment: "likely_negotiable",
        reason:
          "Advertising or market-adjustment lines are dealer-set amounts, not required costs. They are commonly negotiable.",
        suggestedAction:
          "Push back on this through the out-the-door price and ask for a revised buyer's order.",
        confidence: "medium",
        estimatedImpact: rangeAround(amount),
      };
    default:
      return {
        assessment: "unknown",
        reason:
          "We couldn't confidently categorize this line. It may be legitimate or padding — worth a clarification before signing.",
        suggestedAction:
          "Ask the dealer to explain what this charge covers and why it applies.",
        confidence: "low",
        estimatedImpact: null,
      };
  }
}

/** A conservative ± impact band around a fee amount (never false precision). */
function rangeAround(amount: number): PriceRange | null {
  if (!(amount > 0)) return null;
  return {
    low: Math.round(amount * 0.5),
    high: Math.round(amount),
    confidence: "low",
    basis:
      "Estimated impact assumes part or all of this dealer-set line could be removed or reduced. Not a guarantee.",
  };
}

/** Match a normalized label to a category via the alias table, or null. */
function categoryFor(label: string): FeeCategory | null {
  for (const { category, aliases } of FEE_ALIAS_TABLE) {
    if (aliases.some((a) => label.includes(a))) return category;
  }
  return null;
}

/** Classify one raw fee line. */
export function classifyFee(
  line: RawFeeLine,
  ctx: ClassifyFeesContext = {},
): FeeAssessment {
  const rawLabel = line.rawLabel ?? "";
  const amount = Number.isFinite(line.amount) ? Math.max(0, line.amount) : 0;
  const label = normalizeLabel(rawLabel);

  // Doc / processing / admin fees go through the state-aware authority first.
  if (isDocFeeAlias(rawLabel)) {
    const docFee = classifyDocFeeAmount({
      stateCode: ctx.stateCode ?? null,
      feeName: rawLabel,
      amountCents: Math.round(amount * 100),
    });

    let assessment: FeeAssessmentLevel;
    if (docFee.comparisonStatus === "above_verified_cap") {
      assessment = "questionable";
    } else if (docFee.comparisonStatus === "within_verified_cap") {
      assessment = "likely_legitimate";
    } else {
      // missing state, seeded, needs research, uncapped, disclosure-only
      assessment = "state_dependent";
    }

    const estimatedImpact: PriceRange | null =
      docFee.overCap && docFee.capAmountCents != null
        ? {
            low: Math.max(
              0,
              Math.round((amount * 100 - docFee.capAmountCents) / 100),
            ),
            high: Math.round(amount),
            confidence: docFee.confidence,
            basis: `Difference between the charged amount and the verified ${docFee.stateCode ?? ""} cap on file. Not a legal determination.`,
          }
        : null;

    return {
      rawLabel,
      category: "doc_fee",
      amount,
      assessment,
      reason: docFee.buyerSummary,
      confidence: docFee.confidence,
      suggestedAction: docFee.whatToAsk,
      estimatedImpact,
      docFee,
    };
  }

  const category = categoryFor(label) ?? "other";
  const base = assessByCategory(category, amount);
  return {
    rawLabel,
    category,
    amount,
    assessment: base.assessment,
    reason: base.reason,
    confidence: base.confidence,
    suggestedAction: base.suggestedAction,
    estimatedImpact: base.estimatedImpact,
    docFee: null,
  };
}

/** Classify a list of raw fee lines. Empty/zero lines are kept (amount 0). */
export function classifyFees(
  lines: RawFeeLine[],
  ctx: ClassifyFeesContext = {},
): FeeAssessment[] {
  return (lines ?? [])
    .filter((l) => l && (l.rawLabel?.trim() || l.amount))
    .map((l) => classifyFee(l, ctx));
}
