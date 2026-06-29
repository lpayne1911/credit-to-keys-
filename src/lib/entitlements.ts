/**
 * Entitlements — DERIVED capability flags. See docs/PRODUCT-ARCHITECTURE.md §7.
 *
 * Pure function: input is the customer's engagements + cases, output is a set of
 * capability flags. Granted by engaged services + case state — NEVER by a
 * subscription tier. There is intentionally NO `plan`/`tier` parameter or field;
 * a future change introducing one violates the architecture (§5, §26).
 *
 * This module has no I/O and no `server-only` guard — it's pure and safe to test
 * and (if ever needed) share.
 */
import type { CaseRow, EngagementRow } from "./types";

export interface Entitlements {
  can_scan: boolean;
  can_save_deals: boolean;
  can_view_reports: boolean;
  can_download_reports: boolean;
  can_message_advocate: boolean;
  can_access_credit_to_keys: boolean;
  can_track_ownership: boolean;
}

/** A case has a delivered report once it reaches delivery (or beyond). */
function hasDeliveredReport(cases: CaseRow[]): boolean {
  return cases.some((c) => c.status === "delivered" || c.status === "payment_pending");
}

const ADVOCATE_SERVICES = new Set(["deal_rescue", "buyer_advocate", "credit_to_keys"]);
const ADVOCATE_ACTIVE = new Set([
  "in_review",
  "needs_customer_info",
  "ready_for_delivery",
  "active",
]);

/**
 * Compute entitlements for an authenticated customer from their engagements +
 * cases. (Anonymous visitors can always scan; this function is only called for a
 * signed-in customer, so `can_save_deals` is true.)
 */
export function entitlementsFor(
  engagements: EngagementRow[],
  cases: CaseRow[],
): Entitlements {
  return {
    can_scan: true, // the free scan is always available
    can_save_deals: true, // signed-in customer
    can_view_reports: hasDeliveredReport(cases),
    can_download_reports: hasDeliveredReport(cases),
    can_message_advocate: cases.some(
      (c) => ADVOCATE_SERVICES.has(c.type) && ADVOCATE_ACTIVE.has(c.status),
    ),
    can_access_credit_to_keys: engagements.some((e) => e.service === "credit_to_keys"),
    can_track_ownership: cases.some((c) => c.stage === "ownership"),
  };
}
