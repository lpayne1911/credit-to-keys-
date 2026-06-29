import type { DealReviewResult } from "./types";

/**
 * The `deals.auto_result` JSONB column is shared by two flows: the fairness
 * engine (Deal Check / verdict) and the Deal Review reconstruction (Quote
 * Review). A Deal Review result is branded with `schemaVersion: "deal-review-1"`.
 *
 * This single guard is the source of truth for telling the two apart, so the
 * verdict page, the console deal-detail page, and the deal-review page never
 * render one shape with the other's components (which crashes).
 */
export function isDealReviewResult(value: unknown): value is DealReviewResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { schemaVersion?: string }).schemaVersion === "deal-review-1"
  );
}
