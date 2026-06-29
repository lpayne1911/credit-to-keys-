/**
 * ============================================================================
 *  Deal Engine — riskFlags
 * ============================================================================
 *
 * Turns a reconciled deal (normalized + math + fee/add-on assessments +
 * optional MarketCheck band) into structured {@link RiskFlag}s. Each flag
 * carries a severity, confidence, an estimated dollar impact when calculable, a
 * source axis, a calm suggested action, and a `scriptFlagType` the pushback
 * generator can speak to.
 *
 * Compliance: titles and details are decision-support only — "risk signal",
 * "possible overcharge", "mismatch signal". Never "fraud", "illegal", or a
 * legal conclusion. The payment line uses the mandated sentence verbatim.
 *
 * Pure + deterministic. No network, no AI.
 * ============================================================================
 */
import type { PriceRange } from "@/lib/fairness-engine";
import type { AddOnAssessment } from "@/lib/add-on-engine/types";
import type { FeeAssessment } from "@/lib/fee-engine/types";
import type {
  DealMathOutput,
  NormalizedDeal,
  RiskFlag,
} from "./types";

export interface RiskFlagInputs {
  deal: NormalizedDeal;
  math: DealMathOutput;
  fees: FeeAssessment[];
  addOns: AddOnAssessment[];
  marketValue: PriceRange | null;
}

function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function generateRiskFlags(inputs: RiskFlagInputs): RiskFlag[] {
  const { deal, math, fees, addOns, marketValue } = inputs;
  const flags: RiskFlag[] = [];

  /* ---- Pricing: above local market --------------------------------------- */
  const price = deal.pricing.vehiclePrice;
  if (price != null && marketValue && price > marketValue.high) {
    const overLow = Math.round(price - marketValue.high);
    const overHigh = Math.round(price - marketValue.low);
    flags.push({
      id: "price_above_market",
      source: "pricing",
      severity: overLow > marketValue.high * 0.06 ? "high" : "medium",
      confidence: marketValue.confidence,
      title: "Price above local market",
      detail: `The selling price (${money(price)}) is above the local market band (${money(marketValue.high)} at the top). ${marketValue.basis}`,
      estimatedImpact: {
        low: overLow,
        high: Math.max(overLow, overHigh),
        confidence: marketValue.confidence,
        basis: "Distance above the local market band. Not a guarantee of savings.",
      },
      suggestedAction:
        "Ask to bring the selling price toward the market band before discussing monthly payment; request a revised buyer's order.",
      scriptFlagType: "overpriced_vehicle",
    });
  }

  /* ---- Fees: padding ----------------------------------------------------- */
  for (const f of fees) {
    const flaggable =
      f.assessment === "likely_junk" ||
      f.assessment === "questionable" ||
      f.assessment === "likely_negotiable" ||
      (f.category === "doc_fee" && f.docFee?.overCap === true);
    if (!flaggable) continue;

    const severity: RiskFlag["severity"] =
      f.assessment === "likely_junk"
        ? "medium"
        : f.assessment === "questionable"
          ? "medium"
          : "low";

    flags.push({
      id: `dealer_fee_${f.category}`,
      source: "fees",
      severity,
      confidence: f.confidence,
      title:
        f.category === "doc_fee"
          ? "Documentation fee signal"
          : "Dealer fee padding",
      detail: `${f.rawLabel} (${money(f.amount)}): ${f.reason}`,
      estimatedImpact: f.estimatedImpact ?? null,
      suggestedAction: f.suggestedAction,
      scriptFlagType: f.category === "government" ? "government_fee" : "junk_fee",
    });
  }

  /* ---- Add-ons: package + warranty markup risk --------------------------- */
  for (const a of addOns) {
    if (!a.overpricedRisk && !a.humanReviewRecommended) continue;
    const isWarranty = a.category === "vsc";
    flags.push({
      id: isWarranty ? "warranty_markup" : `addon_${a.category}`,
      source: "addons",
      severity: a.overpricedRisk ? "medium" : "low",
      confidence: a.confidence,
      title: isWarranty ? "Warranty markup risk" : "Add-on package risk",
      detail: `${a.rawLabel} (${money(a.amount)}): ${a.reason}`,
      estimatedImpact: a.estimatedImpact ?? null,
      suggestedAction: a.suggestedAction,
      scriptFlagType: isWarranty ? "overpriced_warranty" : "overpriced_addon",
    });
  }

  /* ---- Finance: APR / payment mismatch ----------------------------------- */
  if (math.paymentMismatch && math.paymentDelta != null) {
    flags.push({
      id: "apr_payment_mismatch",
      source: "finance",
      severity: "high",
      confidence: "medium",
      title: "APR / payment mismatch",
      detail:
        "The payment does not reconcile with the APR, term, and amount financed provided." +
        ` The quoted payment differs from the reconstructed payment by about ${money(Math.abs(math.paymentDelta))} per month.`,
      estimatedImpact: null,
      suggestedAction:
        "Ask the dealer to show the amount financed, APR, and term in writing so the monthly payment can be confirmed.",
      scriptFlagType: "payment_packing",
    });
  }

  /* ---- Finance: long-term stretch ---------------------------------------- */
  if (math.termStretch?.flagged) {
    flags.push({
      id: "term_stretch",
      source: "finance",
      severity: "low",
      confidence: "medium",
      title: "Long loan term",
      detail: `The loan runs ${math.termStretch.current} months. A longer term lowers the payment but raises total interest.`,
      estimatedImpact: null,
      suggestedAction:
        "Ask what a shorter term looks like so you can compare total interest, not just the monthly payment.",
    });
  }

  /* ---- Trade: lowball + negative equity ---------------------------------- */
  const trade = deal.trade;
  if (
    trade?.estimatedValue != null &&
    trade.offer != null &&
    trade.offer < trade.estimatedValue * 0.9
  ) {
    const low = Math.round(trade.estimatedValue * 0.9 - trade.offer);
    const high = Math.round(trade.estimatedValue - trade.offer);
    flags.push({
      id: "trade_lowball",
      source: "trade",
      severity: "medium",
      confidence: "low",
      title: "Trade equity concern",
      detail: `The trade offer (${money(trade.offer)}) is below your researched value (${money(trade.estimatedValue)}).`,
      estimatedImpact: {
        low: Math.max(0, low),
        high: Math.max(0, high),
        confidence: "low",
        basis: "Difference between your researched value and the dealer's offer. Not a guarantee.",
      },
      suggestedAction:
        "Ask the dealer to move the trade offer up, or get competing offers before agreeing.",
      scriptFlagType: "trade_lowball",
    });
  }
  if (math.negativeEquity != null && math.negativeEquity > 0) {
    flags.push({
      id: "negative_equity",
      source: "trade",
      severity: "medium",
      confidence: "medium",
      title: "Trade equity concern",
      detail: `You owe about ${money(math.negativeEquity)} more on the trade than the dealer is offering. Rolling that into the new loan increases what you finance.`,
      estimatedImpact: {
        low: Math.round(math.negativeEquity),
        high: Math.round(math.negativeEquity),
        confidence: "medium",
        basis: "Trade payoff minus the dealer's offer.",
      },
      suggestedAction:
        "Ask to handle the payoff separately rather than rolling negative equity into the new payment.",
      scriptFlagType: "negative_equity",
    });
  }

  /* ---- Paperwork: missing buyer's order ---------------------------------- */
  if (deal.fees.length === 0) {
    flags.push({
      id: "missing_buyers_order",
      source: "paperwork",
      severity: "low",
      confidence: "high",
      title: "Missing buyer's order",
      detail:
        "We don't have an itemized list of fees. Without the buyer's order, padding can hide inside an out-the-door total.",
      estimatedImpact: null,
      suggestedAction:
        "Request an itemized buyer's order so every fee and add-on is listed separately.",
    });
  }

  /* ---- Paperwork: price doesn't add up to out-the-door ------------------- */
  if (
    price != null &&
    deal.pricing.outTheDoor != null &&
    deal.fees.length > 0
  ) {
    const partsKnown =
      price + math.totalFees + math.totalAddOns - (math.tradeEquity ?? 0);
    const gap = deal.pricing.outTheDoor - partsKnown;
    // A large positive gap beyond a plausible tax band (~12%) is worth asking
    // about; we never assert it's wrong, only that it doesn't visibly add up.
    if (gap > price * 0.14) {
      flags.push({
        id: "contract_mismatch_total",
        source: "paperwork",
        severity: "low",
        confidence: "low",
        title: "Contract mismatch signal",
        detail:
          "The out-the-door total is higher than the listed price, fees, and add-ons add up to, beyond a typical tax range. There may be charges not itemized here.",
        estimatedImpact: null,
        suggestedAction:
          "Ask for a line-by-line buyer's order that reconciles to the out-the-door total.",
      });
    }
  }

  return flags;
}
