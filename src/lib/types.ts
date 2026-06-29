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
  // Owning buyer (Supabase auth user) when the deal was run while signed in.
  // null for anonymous/legacy deals (capability-URL only).
  user_id: string | null;

  // Where the buyer is purchasing (two-letter state code). Drives state-aware
  // copy and, later, state-specific fee caps.
  buyer_state: string | null;

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
  // `buyer_state` is declared above (shared with the state-aware copy field).
  buyer_zip: string | null;
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

// ---------------------------------------------------------------------------
//  Engagements + Cases spine (Phase A). See docs/PRODUCT-ARCHITECTURE.md §4–§5.
//  Engagement = a service LINE a customer uses; Case = a unit of WORK under it.
// ---------------------------------------------------------------------------

/** A service line a customer can engage. */
export type EngagementService =
  | "deal_check"
  | "quote_review"
  | "deal_rescue"
  | "buyer_advocate"
  | "credit_to_keys"
  | "concierge";

/** The ONE canonical case-status taxonomy. Every feature reads this. */
export type CaseStatus =
  | "scanned" // free verdict generated; no paid service engaged
  | "submitted" // customer opened/requested a paid service
  | "review_requested" // queued for an operator
  | "in_review" // operator actively working it
  | "needs_customer_info" // blocked on the customer (drives a Customer Action)
  | "ready_for_delivery" // work complete, awaiting publish
  | "delivered" // deliverable published + delivery event recorded
  | "payment_pending" // delivered, awaiting capture (capture-after-delivery)
  | "active" // long-running recurring case (Credit-to-Keys / Ownership)
  | "closed"
  | "cancelled";

/** Row in `engagements`. */
export interface EngagementRow {
  id: string;
  user_id: string | null;
  service: EngagementService;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
}

/** Row in `cases`. The operational unit of work. */
export interface CaseRow {
  id: string;
  engagement_id: string | null;
  user_id: string | null;
  type: EngagementService;
  status: CaseStatus;
  stage: string | null;
  priority: number;
  assigned_operator_id: string | null;
  due_at: string | null;
  sla_status: "on_track" | "at_risk" | "breached" | null;
  escalation_reason: string | null;
  intake_completeness: number | null;
  deal_id: string | null;
  intake_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}
