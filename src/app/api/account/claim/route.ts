/**
 * POST /api/account/claim — attach an anonymous deal to the signed-in buyer.
 *
 * Body: { dealId }. Requires a buyer session. Only claims an unowned deal; a
 * deal owned by another user returns 409 (an id guess can't steal it).
 */
import { NextResponse } from "next/server";
import { getBuyer } from "@/lib/buyer-auth";
import { claimDealForUser } from "@/lib/claim";
import { claimDealSchema } from "@/lib/schemas";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limit = await rateLimit(req, { key: "account-claim", limit: 30, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const buyer = await getBuyer();
  if (!buyer) {
    return NextResponse.json({ ok: false, error: "Sign in to save this." }, { status: 401 });
  }

  const parsed = claimDealSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Nothing to claim." }, { status: 400 });
  }

  const result = await claimDealForUser(parsed.data.dealId, buyer.id);
  if (!result.ok) {
    const status =
      result.reason === "owned_by_other" ? 409 : result.reason === "not_found" ? 404 : 503;
    const error =
      result.reason === "owned_by_other"
        ? "This deal is already saved to another account."
        : result.reason === "not_found"
          ? "We couldn't find that deal."
          : "Saving isn't available right now.";
    return NextResponse.json({ ok: false, error }, { status });
  }

  return NextResponse.json({ ok: true, dealId: result.dealId });
}
