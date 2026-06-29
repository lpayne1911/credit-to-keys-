/**
 * POST /api/intake — submit a non-automated product request (human review,
 * deal rescue). Stores the focused-intake payload for a human advocate.
 *
 * - No automated scoring, no promises of cancellation/refund/savings.
 * - Writes only via the SERVICE ROLE, server-side (RLS default-deny table).
 * - Degrades gracefully: if the DB isn't configured, it still acknowledges so
 *   the buyer's submit doesn't hard-fail (mirrors the deals route).
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getProduct } from "@/lib/products/product-catalog";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Unauthenticated write path — throttle per IP to prevent lead/row spam.
  const limit = await rateLimit(req, { key: "intake", limit: 20, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const productId = (body as { productId?: unknown })?.productId;
  const fields = (body as { fields?: unknown })?.fields;
  if (typeof productId !== "string" || !getProduct(productId)) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }
  if (typeof fields !== "object" || fields === null) {
    return NextResponse.json({ error: "Missing intake fields." }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    // Not configured in this environment — acknowledge so the UX still works.
    return NextResponse.json({ ok: true, stored: false });
  }

  const { data, error } = await supabase
    .from("product_intakes")
    .insert({ product_id: productId, payload: fields, status: "review_requested" })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not save your request. Please try again." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, stored: true, id: data.id });
}
