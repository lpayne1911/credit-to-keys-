/**
 * Shared application + database types.
 *
 * These mirror the Supabase schema (see supabase/migrations). They are kept
 * separate from the fairness-engine types so the engine stays a pure,
 * swappable module with no database concerns.
 *
 * NAMING NOTE: we deliberately use clear, extensible names (`leads`, `deals`,
 * `findings`) rather than clever shortcuts. This Deal Check is phase one of a
 * larger credit-and-deal advocacy platform; these records may later connect to
 * a broader customer profile, so the shapes are designed to grow.
 */

import type { Flag, FairnessResult, Verdict } from "./fairness-engine";
import type { FeeLineReview } from "./fee-classifier";

export type DealStatus =
  | "new" // auto-verdict generated, no human review requested
  | "review_requested" // buyer asked for a deeper human review
  | "in_review" // an operator has opened it
  | "reviewed" // operator published a reviewed verdict
  | "archived";

/** Row in `leads`. A lead is the person; a deal belongs to a lead. */
export interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
}

/** Row in `deals`. Stores the submitted offer + both auto and reviewed verdicts. */
export interface DealRow {
  id: string;
  lead_id: string | null;

  // Vehicle
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_trim: string | null;
  vehicle_mileage: number | null;
  vehicle_vin: string | null;

  // Deal numbers
  vehicle_price: number | null;
  fees: { label: string; amount: number }[] | null;
  down_payment: number | null;
  apr: number | null;
  term_months: number | null;
  monthly_payment: number | null;
  credit_band: string | null;

  // Warranty offer
  warranty_provider: string | null;
  warranty_coverage_tier: string | null;
  warranty_term_months: number | null;
  warranty_term_miles: number | null;
  warranty_price: number | null;

  // Buyer location (internal analytics signal only; never buyer-facing/scored).
  buyer_zip: string | null;
  buyer_state: string | null;
  buyer_income_band: string | null;

  // Normalized fee categories (state-aware), persisted for analytics.
  fee_categories: FeeLineReview[] | null;

  // Upload
  uploaded_file_path: string | null;
  input_path: "manual" | "upload";

  // Auto verdict (from the fairness engine)
  auto_verdict: Verdict | null;
  auto_result: FairnessResult | null;

  // Reviewed verdict (from a human operator). Null until published.
  reviewed_verdict: Verdict | null;
  reviewed_headline: string | null;
  reviewed_flags: Flag[] | null;
  reviewed_at: string | null;

  status: DealStatus;
  created_at: string;
}

/** Row in `findings` (a.k.a. red_flags). Normalized copy of each flag. */
export interface FindingRow {
  id: string;
  deal_id: string;
  type: string;
  severity: string;
  title: string;
  explanation: string;
  source: "auto" | "reviewed";
  created_at: string;
}
