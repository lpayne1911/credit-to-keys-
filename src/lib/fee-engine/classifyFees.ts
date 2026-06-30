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
import { FEE_COPY } from "@/lib/output-contract/copy/fees";
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
      return { assessment: "likely_legitimate", ...FEE_COPY.government, confidence: "medium", estimatedImpact: null };
    case "tax":
      return { assessment: "likely_legitimate", ...FEE_COPY.tax, confidence: "medium", estimatedImpact: null };
    case "freight":
      return { assessment: "likely_legitimate", ...FEE_COPY.freight, confidence: "medium", estimatedImpact: null };
    case "dealer_prep":
      return { assessment: "likely_negotiable", ...FEE_COPY.dealer_prep, confidence: "medium", estimatedImpact: rangeAround(amount) };
    case "vin_etch":
      return { assessment: "likely_junk", ...FEE_COPY.vin_etch, confidence: "medium", estimatedImpact: rangeAround(amount) };
    case "nitrogen":
      return { assessment: "likely_junk", ...FEE_COPY.nitrogen, confidence: "medium", estimatedImpact: rangeAround(amount) };
    case "protection_pkg":
      return { assessment: "questionable", ...FEE_COPY.protection_pkg, confidence: "medium", estimatedImpact: rangeAround(amount) };
    case "advertising":
      return { assessment: "likely_negotiable", ...FEE_COPY.advertising, confidence: "medium", estimatedImpact: rangeAround(amount) };
    default:
      return { assessment: "unknown", ...FEE_COPY.other, confidence: "low", estimatedImpact: null };
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
