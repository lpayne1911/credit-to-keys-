/**
 * POST /api/billing/checkout — PLACEHOLDER capture endpoint.
 *
 * The seam where Stripe will plug in before launch. Today it returns 503 (no
 * provider configured). Once Stripe is wired, startCheckout() returns a URL and
 * this route redirects the buyer to it — capture happens only after delivery.
 */
import { NextResponse } from "next/server";
import { getBuyer } from "@/lib/buyer-auth";
import { startCheckout, PAYMENTS_PLACEHOLDER_NOTE } from "@/lib/billing/payments";
import { claimDealSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const buyer = await getBuyer();
  if (!buyer) {
    return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  }

  // Reuse the uuid-shaped id validator (we pass the case/deal id as `dealId`).
  const parsed = claimDealSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Nothing to pay for." }, { status: 400 });
  }

  const result = await startCheckout(parsed.data.dealId);
  if (!result.ok) {
    const status = result.reason === "disabled" ? 503 : 501;
    return NextResponse.json({ ok: false, error: PAYMENTS_PLACEHOLDER_NOTE }, { status });
  }

  return NextResponse.json({ ok: true, url: result.url });
}
