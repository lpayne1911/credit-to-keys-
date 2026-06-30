/**
 * ============================================================================
 *  Deal Engine — buildDealReview (orchestrator)
 * ============================================================================
 *
 * Takes a {@link NormalizedDeal} plus an optionally-injected MarketCheck band
 * and produces the full {@link DealReviewResult} the Deal Review page renders:
 * reconciled math, classified fees and add-ons, structured risk flags, a 0–100
 * Deal Score with a per-axis breakdown, plain takeaways, and a pushback script.
 *
 * PURE + SYNC by design — no `server-only` imports, no network, no AI. The
 * MarketCheck lookup happens in the API route and is passed in here, so this
 * module stays unit-testable and the engine never reaches the network.
 *
 * Compliance: every string this assembles is decision-support — no legal
 * conclusions, no guarantees of savings.
 * ============================================================================
 */
import type { PriceRange } from "@/lib/fairness-engine";
import { classifyAddOns } from "@/lib/add-on-engine/classifyAddOns";
import { classifyFees } from "@/lib/fee-engine/classifyFees";
import { dealReviewScore } from "./dealReviewScore";
import { buildDealReviewScript } from "./pushbackScript";
import { generateRiskFlags } from "./riskFlags";
import { reconcileDealMath } from "./reconcileDealMath";
import type {
  DealReviewResult,
  FieldConfidence,
  NormalizedDeal,
} from "./types";

const ENGINE_VERSION = "deal-review-1.0.0";

export interface BuildDealReviewOptions {
  /** MarketCheck band injected server-side; null when unavailable. */
  marketValue?: PriceRange | null;
  /** Real national-average APR band (FRED) injected server-side; null when
   *  unavailable, in which case the engine uses its conservative placeholder. */
  aprBenchmark?: DealReviewResult["math"]["aprBenchmark"];
  /** ISO timestamp; injectable for deterministic tests. */
  now?: string;
}

function vehicleLabelOf(deal: NormalizedDeal): string {
  const { year, make, model, trim } = deal.vehicle;
  const parts = [year, make, model, trim].filter(Boolean);
  return parts.length ? parts.join(" ") : "Your vehicle";
}

function downgrade(a: FieldConfidence, b: FieldConfidence): FieldConfidence {
  const rank = (c: FieldConfidence) => (c === "high" ? 2 : c === "medium" ? 1 : 0);
  return rank(a) <= rank(b) ? a : b;
}

export function buildDealReview(
  deal: NormalizedDeal,
  opts: BuildDealReviewOptions = {},
): DealReviewResult {
  const marketValue = opts.marketValue ?? null;

  const math = reconcileDealMath(deal, { aprBenchmark: opts.aprBenchmark });
  const feeAssessments = classifyFees(
    deal.fees.map((f) => ({ rawLabel: f.rawLabel, amount: f.amount })),
    { stateCode: deal.sourceMetadata.buyerState },
  );
  const addOnAssessments = classifyAddOns(
    deal.addOns.map((a) => ({
      rawLabel: a.rawLabel,
      amount: a.amount,
      financed: a.financed,
    })),
  );

  const riskFlags = generateRiskFlags({
    deal,
    math,
    fees: feeAssessments,
    addOns: addOnAssessments,
    marketValue,
  });

  const { dealScore, scoreBreakdown } = dealReviewScore(
    riskFlags,
    deal,
    marketValue,
  );

  const script = buildDealReviewScript({ riskFlags, deal, dealScore });

  /* ---- Confidence -------------------------------------------------------- */
  let confidence = deal.confidence;
  const confidenceReasons: string[] = [];
  if (deal.sourceMetadata.documentUploaded) {
    confidenceReasons.push("Figures came from uploaded paperwork.");
  } else {
    confidenceReasons.push("Figures were entered manually.");
  }
  if (marketValue) {
    confidenceReasons.push(
      `Local market band available (${marketValue.confidence} confidence).`,
    );
  } else {
    confidence = downgrade(confidence, "medium");
    confidenceReasons.push(
      "No local market band was available, so the price check is lower confidence.",
    );
  }
  if (deal.missingFields.length) {
    confidenceReasons.push(
      `Still missing: ${deal.missingFields.slice(0, 4).join(", ")}.`,
    );
  }

  /* ---- Takeaways --------------------------------------------------------- */
  const takeaways = buildTakeaways(deal, math, riskFlags, marketValue);

  /* ---- Assumptions ------------------------------------------------------- */
  const assumptions = [
    ...math.notes,
    "Estimated dollar impacts are ranges, not guarantees of savings.",
    "This is decision support — not legal or financial advice. You make the final decision.",
  ];

  return {
    schemaVersion: "deal-review-1",
    engineVersion: ENGINE_VERSION,
    vehicleLabel: vehicleLabelOf(deal),
    normalized: deal,
    math,
    marketValue,
    feeAssessments,
    addOnAssessments,
    riskFlags,
    dealScore,
    scoreBreakdown,
    takeaways,
    script,
    confidence,
    confidenceReasons,
    assumptions,
    createdAt: opts.now ?? new Date().toISOString(),
  };
}

function buildTakeaways(
  deal: NormalizedDeal,
  math: ReturnType<typeof reconcileDealMath>,
  riskFlags: DealReviewResult["riskFlags"],
  marketValue: PriceRange | null,
): string[] {
  const out: string[] = [];

  // Price
  if (riskFlags.some((f) => f.id === "price_above_market")) {
    out.push(
      "The selling price is above your local market band — aim to bring it toward market before discussing the monthly payment.",
    );
  } else if (marketValue && deal.pricing.vehiclePrice != null) {
    out.push("The selling price sits within your local market band.");
  } else {
    out.push(
      "We couldn't pull a local market band, so treat the price check as lower confidence.",
    );
  }

  // Fees
  const flaggedFees = riskFlags.filter((f) => f.source === "fees").length;
  if (flaggedFees > 0) {
    out.push(
      `${flaggedFees} fee line${flaggedFees === 1 ? "" : "s"} look${flaggedFees === 1 ? "s" : ""} worth questioning — ask for a revised buyer's order.`,
    );
  }

  // Add-ons
  if (math.totalAddOns > 0) {
    out.push(
      "Optional F&I add-ons are increasing what you finance — each one can be declined or renegotiated.",
    );
  }

  // Finance
  if (math.paymentMismatch) {
    out.push(
      "The payment does not reconcile with the APR, term, and amount financed provided — ask for those three in writing.",
    );
  }
  if (riskFlags.some((f) => f.id === "apr_above_benchmark")) {
    out.push(
      "Your APR looks higher than the current national average — compare a credit-union or bank pre-approval before agreeing to the dealer's rate.",
    );
  }

  // Trade
  if (riskFlags.some((f) => f.source === "trade")) {
    out.push("Your trade has an equity concern worth resolving before signing.");
  }

  // Missing info
  if (deal.missingFields.length) {
    out.push(
      `To tighten this review, add: ${deal.missingFields.slice(0, 3).join(", ")}.`,
    );
  }

  return out;
}
