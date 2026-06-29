/**
 * ============================================================================
 *  Add-On Engine — classifier
 * ============================================================================
 *
 * Detects F&I add-on products from raw labels and produces decision-support
 * {@link AddOnAssessment}s. Every add-on here is OPTIONAL — declining one does
 * not change the price of the car. The engine flags overpricing risk,
 * whether the product was financed into the loan, and when cancellation terms
 * or human review are worth getting before deciding.
 *
 * Compliance: decision-support language only. We never say a product is a
 * "scam" or "illegal"; we say "optional", "commonly marked up", "ask for
 * cancellation terms", "request a revised buyer's order".
 *
 * Pure + deterministic. No network, no AI.
 * ============================================================================
 */
import type { PriceRange } from "@/lib/fairness-engine";
import type { AddOnAssessment, AddOnCategory, FieldConfidence } from "./types";

/** A single raw add-on line as it arrives from intake/extraction. */
export interface RawAddOnLine {
  rawLabel: string;
  amount: number;
  /** Whether the buyer indicated this was rolled into the financed amount. */
  financed?: boolean | null;
}

export interface ClassifyAddOnsContext {
  /** Default for financedIntoLoan when a line doesn't specify. */
  addOnsFinancedDefault?: boolean | null;
}

/** Ordered detection table — earlier, more-specific entries win. */
const ADDON_ALIASES: { category: AddOnCategory; aliases: string[] }[] = [
  { category: "lojack_gps", aliases: ["lojack", "gps", "tracker", "tracking", "recovery system", "stolen vehicle"] },
  { category: "gap", aliases: ["gap", "guaranteed asset", "guaranteed auto protection"] },
  { category: "vsc", aliases: ["vsc", "service contract", "extended warranty", "extended service", "vehicle service", "mechanical breakdown", "powertrain coverage"] },
  { category: "tire_wheel", aliases: ["tire and wheel", "tire & wheel", "wheel and tire", "road hazard", "tire/wheel"] },
  { category: "maintenance", aliases: ["maintenance plan", "prepaid maintenance", "scheduled maintenance", "oil change plan"] },
  { category: "key", aliases: ["key replacement", "key fob", "key protection", "lost key"] },
  { category: "ceramic", aliases: ["ceramic", "ceramic coating"] },
  { category: "paint_fabric", aliases: ["paint protection", "fabric protection", "paint and fabric", "paint & fabric", "interior protection", "exterior protection", "environmental protection"] },
  { category: "theft", aliases: ["theft protection", "theft deterrent", "vin etch", "window etch", "etch"] },
  { category: "nitrogen", aliases: ["nitrogen"] },
  { category: "appearance", aliases: ["appearance package", "appearance protection", "protection package"] },
];

function normalize(label: string): string {
  return (label ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function categoryFor(label: string): AddOnCategory {
  const l = normalize(label);
  for (const { category, aliases } of ADDON_ALIASES) {
    if (aliases.some((a) => l.includes(a))) return category;
  }
  return "other";
}

/** ± impact band assuming the product could be removed or renegotiated. */
function impactRange(amount: number, fraction: number): PriceRange | null {
  if (!(amount > 0)) return null;
  return {
    low: Math.round(amount * fraction),
    high: Math.round(amount),
    confidence: "low",
    basis:
      "Estimated impact assumes this optional product could be removed or renegotiated. Not a guarantee.",
  };
}

/** Per-category profile of an add-on. */
function profileFor(category: AddOnCategory): {
  overpricedRisk: boolean;
  cancellationTermsNeeded: boolean;
  humanReviewRecommended: boolean;
  reason: string;
  suggestedAction: string;
  confidence: FieldConfidence;
  impactFraction: number;
} {
  switch (category) {
    case "vsc":
      return {
        overpricedRisk: true,
        cancellationTermsNeeded: true,
        humanReviewRecommended: true,
        reason:
          "A vehicle service contract is optional and commonly marked up in the finance office. The same coverage is often available for less, and contracts are usually cancellable for a prorated refund.",
        suggestedAction:
          "Ask for the contract terms and price in writing, and request cancellation terms before deciding. You can compare coverage elsewhere.",
        confidence: "medium",
        impactFraction: 0.3,
      };
    case "gap":
      return {
        overpricedRisk: true,
        cancellationTermsNeeded: true,
        humanReviewRecommended: false,
        reason:
          "GAP is optional and often marked up at the dealer. Your own lender or insurer may offer it for less, and it is usually cancellable for a prorated refund.",
        suggestedAction:
          "Compare the dealer's GAP price to your lender/insurer and ask for cancellation terms.",
        confidence: "medium",
        impactFraction: 0.4,
      };
    case "tire_wheel":
      return {
        overpricedRisk: true,
        cancellationTermsNeeded: true,
        humanReviewRecommended: false,
        reason:
          "Tire & wheel / road-hazard coverage is optional and frequently marked up. Worth weighing against the cost of an occasional repair.",
        suggestedAction:
          "Decide if you want it; if not, request a revised buyer's order without it.",
        confidence: "medium",
        impactFraction: 0.5,
      };
    case "maintenance":
      return {
        overpricedRisk: false,
        cancellationTermsNeeded: true,
        humanReviewRecommended: false,
        reason:
          "A prepaid maintenance plan is optional. It can have value if priced near the cost of the services it covers — check that math before financing it.",
        suggestedAction:
          "Ask exactly which services are covered and compare to paying as you go.",
        confidence: "medium",
        impactFraction: 0.5,
      };
    case "key":
      return {
        overpricedRisk: true,
        cancellationTermsNeeded: false,
        humanReviewRecommended: false,
        reason:
          "Key replacement coverage is optional and often low-value relative to its price.",
        suggestedAction:
          "Decline if you don't want it; request a revised buyer's order without it.",
        confidence: "medium",
        impactFraction: 0.6,
      };
    case "ceramic":
    case "paint_fabric":
    case "appearance":
      return {
        overpricedRisk: true,
        cancellationTermsNeeded: false,
        humanReviewRecommended: false,
        reason:
          "Paint, fabric, ceramic, and appearance protection are optional cosmetic products commonly marked up well above cost.",
        suggestedAction:
          "Decline if unwanted, or ask for the price separately so you can decide; request a revised buyer's order.",
        confidence: "medium",
        impactFraction: 0.6,
      };
    case "theft":
    case "lojack_gps":
      return {
        overpricedRisk: true,
        cancellationTermsNeeded: false,
        humanReviewRecommended: false,
        reason:
          "Theft-protection, etch, and GPS/recovery products are optional and frequently pre-installed and marked up.",
        suggestedAction:
          "Ask whether it can be removed; request a revised buyer's order without it if you don't want it.",
        confidence: "medium",
        impactFraction: 0.6,
      };
    case "nitrogen":
      return {
        overpricedRisk: true,
        cancellationTermsNeeded: false,
        humanReviewRecommended: false,
        reason:
          "Nitrogen tire fill is optional and typically low-value. A common source of padding.",
        suggestedAction:
          "Decline it and request a revised buyer's order without the nitrogen line.",
        confidence: "medium",
        impactFraction: 0.8,
      };
    default:
      return {
        overpricedRisk: false,
        cancellationTermsNeeded: true,
        humanReviewRecommended: true,
        reason:
          "We couldn't confidently identify this product. It is listed as an add-on, so it is likely optional — worth a clarification before financing it.",
        suggestedAction:
          "Ask the dealer what this product is, what it costs, and whether it is cancellable.",
        confidence: "low",
        impactFraction: 0.5,
      };
  }
}

/** Classify one raw add-on line. */
export function classifyAddOn(
  line: RawAddOnLine,
  ctx: ClassifyAddOnsContext = {},
): AddOnAssessment {
  const rawLabel = line.rawLabel ?? "";
  const amount = Number.isFinite(line.amount) ? Math.max(0, line.amount) : 0;
  const category = categoryFor(rawLabel);
  const p = profileFor(category);
  const financedIntoLoan =
    line.financed ?? ctx.addOnsFinancedDefault ?? false;

  return {
    rawLabel,
    category,
    amount,
    optional: true, // every recognized F&I add-on is optional
    overpricedRisk: p.overpricedRisk,
    financedIntoLoan: Boolean(financedIntoLoan),
    cancellationTermsNeeded: p.cancellationTermsNeeded,
    humanReviewRecommended: p.humanReviewRecommended,
    reason: p.reason,
    confidence: p.confidence,
    suggestedAction: p.suggestedAction,
    estimatedImpact: impactRange(amount, p.impactFraction),
  };
}

/** Classify a list of raw add-on lines. */
export function classifyAddOns(
  lines: RawAddOnLine[],
  ctx: ClassifyAddOnsContext = {},
): AddOnAssessment[] {
  return (lines ?? [])
    .filter((l) => l && (l.rawLabel?.trim() || l.amount))
    .map((l) => classifyAddOn(l, ctx));
}
