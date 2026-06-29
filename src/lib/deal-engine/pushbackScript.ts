/**
 * ============================================================================
 *  Deal Engine — pushbackScript
 * ============================================================================
 *
 * Generates the buyer's at-the-desk script from the Quote Review risk flags by
 * reusing the existing, tested `buildNegotiationScript` (which already turns
 * fee/add-on/APR/payment/trade issues into calm, firm talking points). We adapt
 * each {@link RiskFlag} into the fairness-engine `Flag` shape the script
 * generator consumes, and prepend a tailored price-target line when the deal is
 * above the local market.
 *
 * Compliance: the script is suggested wording, not advice or a promise. It is
 * calm, specific, and never legally threatening; the closer preserves the power
 * to walk.
 *
 * Pure + deterministic. No network, no AI.
 * ============================================================================
 */
import type { FairnessResult, Flag, Verdict } from "@/lib/fairness-engine";
import { buildNegotiationScript } from "@/lib/negotiation";
import type { NegotiationScript } from "@/lib/negotiation";
import type { NormalizedDeal, RiskFlag } from "./types";

function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function verdictFromScore(score: number): Verdict {
  if (score >= 80) return "green";
  if (score >= 55) return "amber";
  return "red";
}

/** Adapt a risk flag into a fairness Flag the script generator understands.
 *  Returns null for flags handled specially (price) or non-actionable ones. */
function toFlag(rf: RiskFlag): Flag | null {
  if (!rf.scriptFlagType) return null;
  if (rf.id === "price_above_market") return null; // prepended manually
  // For fee/add-on lines the detail leads with the raw label ("Nitrogen (…": …)
  // — use that so the talking point names the item cleanly.
  const title =
    rf.source === "fees" || rf.source === "addons"
      ? rf.detail.split(" (")[0]
      : rf.title;
  return {
    type: rf.scriptFlagType,
    severity: rf.severity,
    title,
    explanation: rf.detail,
    estimatedImpact: rf.estimatedImpact ?? null,
  };
}

export interface PushbackScriptInputs {
  riskFlags: RiskFlag[];
  deal: NormalizedDeal;
  dealScore: number;
}

export function buildDealReviewScript(
  inputs: PushbackScriptInputs,
): NegotiationScript {
  const { riskFlags, deal, dealScore } = inputs;
  const verdict = verdictFromScore(dealScore);

  const flags = riskFlags
    .map(toFlag)
    .filter((f): f is Flag => f !== null);

  // Minimal FairnessResult — buildNegotiationScript only reads flags,
  // overallVerdict, and warranty.
  const resultLike: FairnessResult = {
    overallVerdict: verdict,
    headline: "",
    confidence: deal.confidence,
    confidenceReasons: [],
    flags,
    warranty: null,
    assumptions: [],
    engineVersion: "deal-review-1",
    marketValue: null,
  };

  const base = buildNegotiationScript(resultLike, {
    offeredApr: deal.finance.apr ?? null,
  });

  // Prepend a price-target line when the deal is above the local market.
  const priceFlag = riskFlags.find((f) => f.id === "price_above_market");
  if (!priceFlag) return base;

  const impact = priceFlag.estimatedImpact;
  const impactNote =
    impact && impact.high > 0
      ? ` (roughly ${money(impact.low)}–${money(impact.high)} above the band)`
      : "";
  const pricePoint = {
    heading: "Selling price",
    say: `I'm seeing the selling price above nearby comparable listings${impactNote}, so I'd like to get closer to the market target before we discuss the monthly payment.`,
  };

  const points = [pricePoint, ...base.points];
  const asText = [
    base.opener,
    "",
    ...points.map((p, i) => `${i + 1}. ${p.say}`),
    "",
    base.closer,
  ].join("\n");

  return { opener: base.opener, points, closer: base.closer, asText };
}
