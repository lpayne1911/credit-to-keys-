/**
 * Payments seam — PLACEHOLDER until Stripe is wired before launch.
 *
 * Capture-after-delivery is the rule (PRODUCT-ARCHITECTURE.md §16): a charge may
 * only fire once a case is `delivered` / `payment_pending`. Everything that will
 * eventually talk to a payment provider funnels through this module, so wiring
 * Stripe later is a localized change — the UI and routes already call here.
 *
 * Until a provider is configured we report payments as disabled and the UI says
 * so honestly. We never fabricate a charge or imply money moved.
 */

/** Whether a real payment provider is configured. False until Stripe is wired. */
export function isPaymentsEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Honest copy for the not-yet-enabled state. */
export const PAYMENTS_PLACEHOLDER_NOTE =
  "Secure card payments open before launch — nothing is charged yet.";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "disabled" | "not_implemented" };

/**
 * Start a capture for a delivered case. Placeholder: returns `disabled` until a
 * provider is configured, and `not_implemented` once it is but before the Stripe
 * integration lands. Replace the body with a Stripe Checkout/PaymentIntent call.
 */
export async function startCheckout(_caseId: string): Promise<CheckoutResult> {
  if (!isPaymentsEnabled()) return { ok: false, reason: "disabled" };
  // TODO(stripe, pre-launch): create a Checkout Session / PaymentIntent for the
  // delivered case and return its URL. Capture only after `delivered` (§16).
  return { ok: false, reason: "not_implemented" };
}
