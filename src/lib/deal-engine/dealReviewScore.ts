/**
 * ============================================================================
 *  Deal Engine — dealReviewScore
 * ============================================================================
 *
 * A single 0–100 Deal Score for the Quote Review flow. Starts at 100 and docks
 * points per risk flag by severity, grouped into six axes (price, fees,
 * add-ons, finance, trade, paperwork). A low-confidence / thin paperwork deal
 * docks a small amount on the paperwork axis.
 *
 * Price is special: when no MarketCheck band was available we do NOT guess a
 * price problem (no docking on the price axis) — instead the overall confidence
 * is lowered. So a missing market lookup never inflates OR deflates the score
 * dishonestly.
 *
 * Presentation-only and deterministic — kept out of the flag engine so its
 * tests stay stable.
 * ============================================================================
 */
import type { PriceRange } from "@/lib/fairness-engine";
import type {
  DealScoreBreakdown,
  NormalizedDeal,
  RiskFlag,
  RiskFlagSource,
  RiskSeverity,
} from "./types";

function dockFor(severity: RiskSeverity): number {
  switch (severity) {
    case "high":
      return 20;
    case "medium":
      return 11;
    case "low":
      return 5;
    default:
      return 0;
  }
}

const AXIS_BY_SOURCE: Record<RiskFlagSource, keyof DealScoreBreakdown> = {
  pricing: "price",
  fees: "fees",
  addons: "addOns",
  finance: "finance",
  trade: "trade",
  paperwork: "paperwork",
};

export interface DealScoreResult {
  dealScore: number;
  scoreBreakdown: DealScoreBreakdown;
}

export function dealReviewScore(
  flags: RiskFlag[],
  deal: NormalizedDeal,
  _marketValue: PriceRange | null,
): DealScoreResult {
  const breakdown: DealScoreBreakdown = {
    price: 0,
    fees: 0,
    addOns: 0,
    finance: 0,
    trade: 0,
    paperwork: 0,
  };

  for (const f of flags) {
    const axis = AXIS_BY_SOURCE[f.source];
    breakdown[axis] += dockFor(f.severity);
  }

  // Thin / low-confidence paperwork docks a little on the paperwork axis so the
  // score reflects how much we actually had to work with.
  if (deal.confidence === "low") breakdown.paperwork += 8;
  else if (deal.confidence === "medium") breakdown.paperwork += 3;

  const totalDock =
    breakdown.price +
    breakdown.fees +
    breakdown.addOns +
    breakdown.finance +
    breakdown.trade +
    breakdown.paperwork;

  const dealScore = Math.max(8, Math.min(100, Math.round(100 - totalDock)));
  return { dealScore, scoreBreakdown: breakdown };
}
