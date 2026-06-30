/**
 * Billing — a DERIVED view over the canonical case/engagement model.
 *
 * Per PRODUCT-ARCHITECTURE.md: there are NO subscription tiers, and payment is
 * captured AFTER delivery (Credit-to-Keys monthly in arrears). So billing is not
 * a separate stored state machine — it is a read over `cases.status` (the one
 * canonical taxonomy) and the customer's engagements. A `plan`/`tier` field
 * anywhere would be a defect, so we never introduce one here.
 *
 * States that require a real payment record (a failed/late charge) are out of
 * scope until the payments primitive exists; we do not fabricate them.
 *
 * Pure, no I/O — safe to unit test.
 */
import type { CaseRow, CaseStatus, EngagementRow } from "@/lib/types";
import { isRecurringService } from "@/lib/dashboard/recommendations";

export type BillingState =
  | "free" // free scan — never charged
  | "awaiting_terms" // service requested; scope/terms not set yet
  | "in_progress" // work underway; nothing due (capture is after delivery)
  | "payment_due" // delivered → capture may fire (capture-after-delivery)
  | "active_recurring" // long-running, billed in arrears (Credit-to-Keys/Ownership)
  | "completed" // closed/settled
  | "cancelled";

/** Map a canonical case status onto its billing-facing state. */
export function billingStateForCase(status: CaseStatus): BillingState {
  switch (status) {
    case "scanned":
      return "free";
    case "submitted":
      return "awaiting_terms";
    case "review_requested":
    case "in_review":
    case "needs_customer_info":
    case "ready_for_delivery":
      return "in_progress";
    case "delivered":
    case "payment_pending":
      return "payment_due";
    case "active":
      return "active_recurring";
    case "closed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "in_progress";
  }
}

export const BILLING_LABEL: Record<BillingState, string> = {
  free: "Free",
  awaiting_terms: "Awaiting terms",
  in_progress: "In progress · nothing due yet",
  payment_due: "Delivered · payment due",
  active_recurring: "Active · billed monthly in arrears",
  completed: "Completed",
  cancelled: "Cancelled",
};

export interface BillingSummary {
  /** Delivered work where a capture may fire (the only place payment is due). */
  paymentDue: CaseRow[];
  /** Recurring engagements billed in arrears. */
  activeRecurring: EngagementRow[];
  /** Work underway with nothing due yet. */
  inProgress: CaseRow[];
  /** Settled or cancelled history. */
  history: CaseRow[];
}

/** Aggregate a customer's cases + engagements into billing-facing buckets. */
export function billingSummary(
  engagements: EngagementRow[],
  cases: CaseRow[],
): BillingSummary {
  const paymentDue: CaseRow[] = [];
  const inProgress: CaseRow[] = [];
  const history: CaseRow[] = [];

  for (const c of cases) {
    const state = billingStateForCase(c.status);
    if (state === "payment_due") paymentDue.push(c);
    else if (state === "in_progress" || state === "awaiting_terms") inProgress.push(c);
    else if (state === "completed" || state === "cancelled") history.push(c);
    // `free` scans and `active_recurring` cases are represented elsewhere.
  }

  const activeRecurring = engagements.filter(
    (e) => isRecurringService(e.service) && e.status === "active",
  );

  return { paymentDue, activeRecurring, inProgress, history };
}

/** True when the customer has nothing billing-related to show. */
export function billingIsEmpty(s: BillingSummary): boolean {
  return (
    s.paymentDue.length === 0 &&
    s.activeRecurring.length === 0 &&
    s.inProgress.length === 0 &&
    s.history.length === 0
  );
}
