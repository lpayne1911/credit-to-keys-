/**
 * ============================================================================
 *  Plan Engine — Build My Plan / Target Deal Sheet
 * ============================================================================
 *
 * The Build My Plan flow is forward-looking: the buyer is still shopping and has
 * no quote yet. From the car they want + their financing profile we build a
 * Target Deal Sheet — a realistic target price (from market data), an expected
 * fee checklist, a financing benchmark, and a negotiation game plan + scripts.
 *
 * Like the rest of the app this is decision support, not advice, and it never
 * fabricates numbers it doesn't have: tax and government fees vary by locality,
 * so they're flagged "confirm" rather than invented. Estimates carry a
 * confidence level and the sheet lists what to provide to sharpen it.
 * ============================================================================
 */
import type { CreditBand } from "@/lib/fairness-engine";

export interface PlanVehicle {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  mileage: number | null;
}

export interface PlanTrade {
  estimatedValue: number | null;
  loanPayoff: number | null;
}

/** Canonical, normalized input the pure builder consumes. */
export interface TargetPlanInput {
  vehicle: PlanVehicle;
  condition: "new" | "used" | "cpo";
  /** Buyer/registration ZIP — localizes the market lookup. */
  zip: string | null;
  /** Two-letter state — drives the doc-fee rule. */
  buyerState: string | null;
  creditBand: CreditBand;
  termMonths: number | null;
  downPayment: number | null;
  /** Optional ceilings the buyer is working within. */
  maxMonthly: number | null;
  maxOutTheDoor: number | null;
  trade: PlanTrade | null;
}

/** A market-derived price band for the target vehicle (computed server-side). */
export interface PlanMarket {
  targetPrice: number | null;
  marketLow: number | null;
  marketMedian: number | null;
  marketHigh: number | null;
  confidence: "low" | "medium" | "high";
  basis: string;
  /** True when the band came from demo/mock data, not a real lookup. */
  isEstimate: boolean;
}

export type FeeKind = "negotiable" | "government" | "varies";

export interface TargetFee {
  label: string;
  /** A target ceiling/typical amount when we can state one honestly; else null. */
  target: number | null;
  kind: FeeKind;
  note: string;
}

export interface PlanFinancing {
  creditBand: CreditBand;
  aprBand: { low: number; high: number };
  termMonths: number;
  /** Approx amount financed at the target price (EXCLUDES tax/government fees). */
  estPrincipal: number | null;
  estMonthlyLow: number | null;
  estMonthlyHigh: number | null;
  note: string;
}

export interface PlanStep {
  n: number;
  title: string;
  detail: string;
}

export interface PlanScript {
  heading: string;
  say: string;
}

export interface TargetDealSheet {
  /** Brands the payload so a result page never mis-reads another shape. */
  schemaVersion: "target-plan-1";
  vehicleLabel: string;
  pricing: PlanMarket;
  /** estimatedValue − loanPayoff when both known, else null. */
  tradeEquity: number | null;
  fees: TargetFee[];
  financing: PlanFinancing | null;
  gamePlan: PlanStep[];
  scripts: PlanScript[];
  /** What the buyer can provide to sharpen the sheet. */
  missing: string[];
  disclaimers: string[];
}
