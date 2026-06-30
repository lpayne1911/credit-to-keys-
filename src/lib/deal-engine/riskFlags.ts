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
import { RISK_COPY } from "@/lib/output-contract/copy/riskFlags";

export interface RiskFlagInputs {
  deal: NormalizedDeal;
  math: DealMathOutput;
  fees: FeeAssessment[];
  addOns: AddOnAssessment[];
  marketValue: PriceRange | null;
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
      title: RISK_COPY.priceAboveMarket.title,
      detail: RISK_COPY.priceAboveMarket.detail(price, marketValue.high, marketValue.basis),
      estimatedImpact: {
        low: overLow,
        high: Math.max(overLow, overHigh),
        confidence: marketValue.confidence,
        basis: RISK_COPY.priceAboveMarket.impactBasis,
      },
      suggestedAction: RISK_COPY.priceAboveMarket.suggestedAction,
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
          ? RISK_COPY.dealerFee.titleDocFee
          : RISK_COPY.dealerFee.titleDealer,
      detail: RISK_COPY.dealerFee.detail(f.rawLabel, f.amount, f.reason),
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
      title: isWarranty ? RISK_COPY.addon.titleWarranty : RISK_COPY.addon.titleAddon,
      detail: RISK_COPY.addon.detail(a.rawLabel, a.amount, a.reason),
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
      title: RISK_COPY.aprPaymentMismatch.title,
      detail: RISK_COPY.aprPaymentMismatch.detail(Math.abs(math.paymentDelta)),
      estimatedImpact: null,
      suggestedAction: RISK_COPY.aprPaymentMismatch.suggestedAction,
      scriptFlagType: "payment_packing",
    });
  }

  /* ---- Finance: APR above the national average --------------------------- */
  // Only when a REAL benchmark was injected (FRED) — never on the placeholder
  // band, so we don't raise false APR flags from a guessed range.
  const benchmark = math.aprBenchmark;
  if (
    benchmark?.source === "fred" &&
    deal.finance.apr != null &&
    deal.finance.apr > benchmark.high
  ) {
    const apr = deal.finance.apr;
    const term = deal.finance.termMonths;
    flags.push({
      id: "apr_above_benchmark",
      source: "finance",
      severity: apr > benchmark.high * 1.15 ? "medium" : "low",
      confidence: "medium",
      title: RISK_COPY.aprAboveBenchmark.title,
      detail: RISK_COPY.aprAboveBenchmark.detail(apr, benchmark.high, term),
      estimatedImpact: null,
      suggestedAction: RISK_COPY.aprAboveBenchmark.suggestedAction,
      scriptFlagType: "apr_markup",
    });
  }

  /* ---- Finance: long-term stretch ---------------------------------------- */
  if (math.termStretch?.flagged) {
    flags.push({
      id: "term_stretch",
      source: "finance",
      severity: "low",
      confidence: "medium",
      title: RISK_COPY.termStretch.title,
      detail: RISK_COPY.termStretch.detail(math.termStretch.current),
      estimatedImpact: null,
      suggestedAction: RISK_COPY.termStretch.suggestedAction,
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
      title: RISK_COPY.tradeLowball.title,
      detail: RISK_COPY.tradeLowball.detail(trade.offer, trade.estimatedValue),
      estimatedImpact: {
        low: Math.max(0, low),
        high: Math.max(0, high),
        confidence: "low",
        basis: RISK_COPY.tradeLowball.impactBasis,
      },
      suggestedAction: RISK_COPY.tradeLowball.suggestedAction,
      scriptFlagType: "trade_lowball",
    });
  }
  if (math.negativeEquity != null && math.negativeEquity > 0) {
    flags.push({
      id: "negative_equity",
      source: "trade",
      severity: "medium",
      confidence: "medium",
      title: RISK_COPY.negativeEquity.title,
      detail: RISK_COPY.negativeEquity.detail(math.negativeEquity),
      estimatedImpact: {
        low: Math.round(math.negativeEquity),
        high: Math.round(math.negativeEquity),
        confidence: "medium",
        basis: RISK_COPY.negativeEquity.impactBasis,
      },
      suggestedAction: RISK_COPY.negativeEquity.suggestedAction,
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
      title: RISK_COPY.missingBuyersOrder.title,
      detail: RISK_COPY.missingBuyersOrder.detail,
      estimatedImpact: null,
      suggestedAction: RISK_COPY.missingBuyersOrder.suggestedAction,
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
        title: RISK_COPY.contractMismatchTotal.title,
        detail: RISK_COPY.contractMismatchTotal.detail,
        estimatedImpact: null,
        suggestedAction: RISK_COPY.contractMismatchTotal.suggestedAction,
      });
    }
  }

  return flags;
}
