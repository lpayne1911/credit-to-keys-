/**
 * ============================================================================
 *  Add-On Engine — types
 * ============================================================================
 *
 * F&I add-ons (service contracts, GAP, tire & wheel, paint/fabric, theft, …)
 * are optional products sold in the finance office. This engine detects the
 * product category from a raw label and produces a decision-support
 * {@link AddOnAssessment} — never a legal conclusion, never a promise.
 *
 * Pure + deterministic. No network, no AI.
 * ============================================================================
 */
import type { PriceRange } from "@/lib/fairness-engine";

export type FieldConfidence = "low" | "medium" | "high";

export type AddOnCategory =
  | "vsc" // vehicle service contract / extended warranty
  | "gap" // guaranteed asset protection
  | "tire_wheel" // tire & wheel / road hazard
  | "maintenance" // prepaid maintenance plan
  | "key" // key replacement
  | "paint_fabric" // paint / fabric / interior protection
  | "ceramic" // ceramic coating
  | "theft" // theft protection / VIN etch product / window etch
  | "lojack_gps" // LoJack / GPS recovery / tracking
  | "nitrogen" // nitrogen tire fill (as a product)
  | "appearance" // appearance package
  | "other";

export interface AddOnAssessment {
  /** The label exactly as it appeared on the paperwork. */
  rawLabel: string;
  /** Canonical product category. */
  category: AddOnCategory;
  /** Dollar amount of the line (>= 0). */
  amount: number;
  /** Optional products can be declined without affecting the car's price. */
  optional: boolean;
  /** True when the category is commonly marked up well above cost. */
  overpricedRisk: boolean;
  /** True when this product was rolled into the financed amount. */
  financedIntoLoan: boolean;
  /** True when cancellation terms should be obtained before deciding. */
  cancellationTermsNeeded: boolean;
  /** True when a human advocate should take a closer look. */
  humanReviewRecommended: boolean;
  /** Plain-English, compliance-safe reason. */
  reason: string;
  /** How confident we are in the classification. */
  confidence: FieldConfidence;
  /** A calm next step for the buyer. */
  suggestedAction: string;
  /** Estimated dollar impact if removed/renegotiated, when calculable. */
  estimatedImpact?: PriceRange | null;
}
