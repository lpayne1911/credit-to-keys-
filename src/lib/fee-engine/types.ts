/**
 * ============================================================================
 *  Fee Engine — types
 * ============================================================================
 *
 * A single dealer line item is classified into a canonical CATEGORY and given a
 * decision-support ASSESSMENT. The engine never makes a legal conclusion: it
 * labels a charge as likely-legitimate, state-dependent, questionable,
 * negotiable, likely-junk, or unknown, and pairs it with a calm action the
 * buyer can take ("request revised buyer's order", "ask for clarification").
 *
 * Pure + deterministic: same line in, same assessment out. No network, no AI.
 * ============================================================================
 */
import type { PriceRange } from "@/lib/fairness-engine";
import type { DocFeeFinding } from "@/lib/intelligence/docFeeRules";

export type FieldConfidence = "low" | "medium" | "high";

/** Canonical fee categories (what a raw label normalizes to). */
export type FeeCategory =
  | "doc_fee" // dealer documentation / processing / admin
  | "government" // title, registration, tag, license, electronic filing to the state
  | "dealer_prep" // prep, reconditioning, recon, dealer handling
  | "vin_etch" // VIN etch / theft etch
  | "nitrogen" // nitrogen tire fill
  | "protection_pkg" // appearance / protection package billed as a fee
  | "advertising" // dealer advertising / market adjustment dressed as a fee
  | "other";

/**
 * Decision-support assessment of a single fee.
 * - likely_legitimate : a real, expected cost (e.g. state title/registration)
 * - state_dependent   : legitimacy/cap depends on the buyer's state rule
 * - questionable      : worth asking the dealer to justify
 * - likely_negotiable : real charge, but commonly reduced or offset
 * - likely_junk       : padding with no real cost of the car behind it
 * - unknown           : not enough signal to classify
 */
export type FeeAssessmentLevel =
  | "likely_legitimate"
  | "state_dependent"
  | "questionable"
  | "likely_negotiable"
  | "likely_junk"
  | "unknown";

export interface FeeAssessment {
  /** The label exactly as it appeared on the paperwork. */
  rawLabel: string;
  /** Canonical category the label normalized to. */
  category: FeeCategory;
  /** Dollar amount of the line (>= 0). */
  amount: number;
  /** Decision-support assessment level. */
  assessment: FeeAssessmentLevel;
  /** Plain-English, compliance-safe reason (no legal conclusions). */
  reason: string;
  /** How confident we are in the classification. */
  confidence: FieldConfidence;
  /** A calm next step ("request revised buyer's order", "ask for clarification"). */
  suggestedAction: string;
  /** Estimated dollar impact if the line were removed/reduced, when calculable. */
  estimatedImpact?: PriceRange | null;
  /** State-aware doc-fee intelligence, attached only for doc-fee category lines. */
  docFee?: DocFeeFinding | null;
}
