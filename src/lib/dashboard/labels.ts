/**
 * Shared display labels + destinations for service lines. Kept in one place so
 * the dashboard, account, and billing views can't drift.
 */
import type { EngagementService } from "@/lib/types";

export const SERVICE_LABEL: Record<EngagementService, string> = {
  deal_check: "Deal Check",
  quote_review: "Quote Review",
  deal_rescue: "Deal Rescue",
  buyer_advocate: "Buyer Advocate",
  credit_to_keys: "Credit-to-Keys",
  concierge: "Concierge",
};

/** Where each service line opens / continues. */
export const SERVICE_HREF: Record<EngagementService, string> = {
  deal_check: "/check",
  quote_review: "/quote-review",
  deal_rescue: "/post-sale-triage",
  buyer_advocate: "/services/buyer-advocate",
  credit_to_keys: "/credit-to-keys",
  concierge: "/concierge",
};
