/**
 * ============================================================================
 *  Workspace — a unified index of the buyer's saved reports
 * ============================================================================
 *
 * Each service (Quote Review, Build My Plan, Post-Sale Triage) produces a result
 * the buyer should be able to find again. Rather than three scattered storage
 * keys, every result is registered in ONE index — the "My Reports" workspace —
 * so the dashboard can list, reopen, and remove them from a single place.
 *
 * v1 is on-device (localStorage): persistent across sessions, but local to the
 * browser. Cloud sync via Supabase + accounts is the follow-up; this contract is
 * storage-agnostic so that swap doesn't ripple into the UI.
 * ============================================================================
 */
export type ReportType = "quote-review" | "target-plan" | "post-sale";

export interface SavedReport {
  /** Server-generated id for the underlying result. */
  id: string;
  type: ReportType;
  /** Headline for the list row (e.g. the vehicle label). */
  title: string;
  /** Secondary line (e.g. a score, target price, or refund ceiling). */
  subtitle?: string;
  /** ISO timestamp; stamped by the caller (the store) at save time. */
  createdAt: string;
  /** Where reopening the report navigates. */
  href: string;
}

export const REPORT_META: Record<ReportType, { label: string; accent: "green" | "blue" | "red" }> = {
  "quote-review": { label: "Quote Review", accent: "green" },
  "target-plan": { label: "Target Deal Sheet", accent: "blue" },
  "post-sale": { label: "Deal Rescue", accent: "red" },
};
