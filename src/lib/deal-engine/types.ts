/**
 * ============================================================================
 *  Deal Engine — canonical types
 * ============================================================================
 *
 * The Quote Review flow turns messy dealer paperwork (uploaded or manually
 * entered) into a single canonical {@link NormalizedDeal}, reconciles the math
 * deterministically, classifies every fee and add-on, and produces a
 * {@link DealReviewResult} — the payload the Deal Review page renders.
 *
 * Document extraction is imperfect, so fields carry confidence and the deal
 * tracks what is still missing. None of this layer makes a legal conclusion or
 * promises savings — it is decision support.
 * ============================================================================
 */
import type { PriceRange } from "@/lib/fairness-engine";
import type { NegotiationScript } from "@/lib/negotiation";
import type { FeeAssessment } from "@/lib/fee-engine/types";
import type { AddOnAssessment } from "@/lib/add-on-engine/types";

export type FieldConfidence = "low" | "medium" | "high";
export type DealSource = "manual" | "upload" | "mixed";

export interface NormalizedVehicle {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  mileage: number | null;
  vin: string | null;
  /** Condition as stated on the order: new / used / cpo / demo / rental. */
  condition: string | null;
  /** Exterior color, when shown. */
  color: string | null;
}

export interface NormalizedPricing {
  /** Selling price of the car before fees, add-ons, and taxes. */
  vehiclePrice: number | null;
  /** MSRP / sticker, when known. */
  msrp: number | null;
  /** Dealer discount off MSRP, when stated. */
  dealerDiscount: number | null;
  /** Rebates / incentives, when stated. */
  rebates: number | null;
  /** Dealer-stated out-the-door total, when provided. */
  outTheDoor: number | null;
  /** Cash down payment. */
  downPayment: number | null;
  /** Dealer-stated "total vehicle price" line, kept for cross-checking math. */
  totalVehiclePrice: number | null;
  /** Dealer-stated "balance due on delivery", kept for cross-checking math. */
  balanceDue: number | null;
}

export interface NormalizedFinance {
  apr: number | null;
  termMonths: number | null;
  /** Dealer-stated monthly payment. */
  monthlyPayment: number | null;
  /** Amount financed, when stated on the order. */
  amountFinanced: number | null;
  creditBand: string | null;
}

export interface NormalizedTrade {
  /** Dealer's trade allowance/offer. */
  offer: number | null;
  /** Buyer's own researched value (KBB/Edmunds), when provided. */
  estimatedValue: number | null;
  /** Remaining loan balance on the trade. */
  loanPayoff: number | null;
  /** Identity of the trade-in vehicle, when stated on the order. */
  year: number | null;
  make: string | null;
  model: string | null;
  mileage: number | null;
}

export interface NormalizedFeeLine {
  rawLabel: string;
  amount: number;
}

export interface NormalizedAddOnLine {
  rawLabel: string;
  amount: number;
  /** Whether this product was rolled into the financed amount. */
  financed: boolean | null;
}

export interface SourceMetadata {
  source: DealSource;
  uploadedFilePath: string | null;
  documentUploaded: boolean;
  dealerName: string | null;
  /** Dealer street address, when shown on the paperwork. */
  dealerAddress: string | null;
  /** Dealer phone number, when shown. */
  dealerPhone: string | null;
  /** Salesperson named on the order. */
  salesperson: string | null;
  /** Dealer stock number for the vehicle. */
  stockNumber: string | null;
  /** Buyer's auto-insurance carrier NAME only — never a policy number. */
  insuranceCarrier: string | null;
  /** Explicit purchase/buyer state (two-letter). */
  buyerState: string | null;
  dealerZip: string | null;
  registrationZip: string | null;
  alreadySigned: boolean | null;
}

export interface NormalizedDeal {
  vehicle: NormalizedVehicle;
  pricing: NormalizedPricing;
  fees: NormalizedFeeLine[];
  addOns: NormalizedAddOnLine[];
  finance: NormalizedFinance;
  trade: NormalizedTrade | null;
  sourceMetadata: SourceMetadata;
  /** Overall paperwork confidence. */
  confidence: FieldConfidence;
  /** Per-field confidence (keyed by dotted field name, e.g. "pricing.vehiclePrice"). */
  fieldConfidence: Record<string, FieldConfidence>;
  /** Human-readable keys for fields still needed to complete the review. */
  missingFields: string[];
}

/** Deterministic reconciliation of the deal math (no AI). */
export interface DealMathOutput {
  totalFees: number;
  totalAddOns: number;
  /** estimatedValue − loanPayoff, when both known (can be negative). */
  tradeEquity: number | null;
  /** max(0, loanPayoff − offer), when both known. */
  negativeEquity: number | null;
  /** price − down + fees + addOns − tradeEquity (when computable). */
  estimatedAmountFinanced: number | null;
  /** monthlyPayment(estimatedAmountFinanced, apr, term). */
  expectedMonthlyPayment: number | null;
  /** Dealer-stated payment echoed for comparison. */
  dealerMonthlyPayment: number | null;
  /** dealerMonthlyPayment − expectedMonthlyPayment (null if not computable). */
  paymentDelta: number | null;
  /** True when the quoted payment doesn't reconcile with APR/term/financed. */
  paymentMismatch: boolean;
  /** APR implied by the dealer payment when APR wasn't provided. */
  impliedApr: number | null;
  /** Long-term stretch comparison (e.g. 84 → 72), when applicable. */
  termStretch: { current: number; rung: number; flagged: boolean } | null;
  /** Placeholder APR band — NOT a real benchmark until seed data exists. */
  aprBenchmark: { low: number; high: number; source: "placeholder" } | null;
  /** Transparency notes about the assumptions used. */
  notes: string[];
}

export type RiskSeverity = "info" | "low" | "medium" | "high";
export type RiskFlagSource =
  | "pricing"
  | "fees"
  | "addons"
  | "finance"
  | "trade"
  | "paperwork";

export interface RiskFlag {
  /** Stable kind key, e.g. "price_above_market", "apr_payment_mismatch". */
  id: string;
  source: RiskFlagSource;
  severity: RiskSeverity;
  confidence: FieldConfidence;
  /** Compliance-safe headline (e.g. "Contract mismatch signal"). */
  title: string;
  detail: string;
  estimatedImpact?: PriceRange | null;
  suggestedAction: string;
  /** Maps to a fairness-engine FlagType so the pushback script can speak to it. */
  scriptFlagType?: import("@/lib/fairness-engine").FlagType;
}

export interface DealScoreBreakdown {
  price: number;
  fees: number;
  addOns: number;
  finance: number;
  trade: number;
  paperwork: number;
}

export interface DealReviewResult {
  /** Brands this payload so the shared `deals.auto_result` column never
   *  collides with a fairness-engine FairnessResult read by /verdict. */
  schemaVersion: "deal-review-1";
  engineVersion: string;
  vehicleLabel: string;
  normalized: NormalizedDeal;
  math: DealMathOutput;
  /** MarketCheck band injected server-side (null when unavailable). */
  marketValue: PriceRange | null;
  feeAssessments: FeeAssessment[];
  addOnAssessments: AddOnAssessment[];
  riskFlags: RiskFlag[];
  /** 0–100 headline Deal Score. */
  dealScore: number;
  scoreBreakdown: DealScoreBreakdown;
  /** "Driveway Advocate Takeaways" — short, plain bullets. */
  takeaways: string[];
  script: NegotiationScript;
  confidence: FieldConfidence;
  confidenceReasons: string[];
  assumptions: string[];
  createdAt: string;
}
