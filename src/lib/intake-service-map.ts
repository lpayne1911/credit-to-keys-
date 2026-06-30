/**
 * Intake → service mapping. Maps an intake productId to the engagement service
 * line it opens (or null when the intake is just a lead with no service line).
 *
 * Pure, no I/O — safe to unit test.
 */
import type { EngagementService } from "./types";

/** The service line an intake opens, or null for lead-only intakes. */
export function serviceForIntakeProduct(productId: string): EngagementService | null {
  switch (productId) {
    case "concierge":
      return "concierge";
    case "deal-rescue":
      return "deal_rescue";
    case "credit-to-keys":
      return "credit_to_keys";
    default:
      return null; // build-my-plan, human-review, etc. stay leads
  }
}

const INTAKE_TITLE: Record<string, string> = {
  concierge: "Concierge",
  "deal-rescue": "Deal Rescue",
  "credit-to-keys": "Credit-to-Keys",
};

/** A human title for the case opened from an intake (vehicle when we have one). */
export function titleForIntake(productId: string, payload: unknown): string {
  const base = INTAKE_TITLE[productId] ?? "Service";
  const vehicle =
    payload && typeof payload === "object" && "vehicle" in payload
      ? String((payload as { vehicle?: unknown }).vehicle ?? "").trim()
      : "";
  return vehicle ? `${base} · ${vehicle}` : `${base} application`;
}
