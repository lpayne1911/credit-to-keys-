/**
 * POST /api/deals/[id]/claim — attach an anonymous deal to the signed-in buyer.
 *
 * This is the seam where a value-first signup "claims" the deal a visitor just
 * scanned: we set deals.user_id to the buyer and open an engagement + case so it
 * shows up on their command-center dashboard.
 *
 * SAFETY:
 *   - Auth-gated: a buyer must be signed in (401 otherwise).
 *   - Ownership-safe: only a deal with a null user_id can be claimed; a deal
 *     already owned by SOMEONE ELSE returns 409 (never reassigned). A deal the
 *     caller already owns is a no-op success (idempotent — a double-fire from the
 *     OAuth round-trip is safe).
 *
 * COMPLIANCE: claiming is free. This never charges and never gates the verdict —
 * it only saves the deal to the buyer's workspace.
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getBuyer } from "@/lib/buyer-auth";
import { ensureCaseForDeal } from "@/lib/cases";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  // Authenticated write (ownership flip + case open) — throttle per IP.
  const limit = await rateLimit(req, { key: "deal-claim", limit: 30, windowMs: 10 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait and try again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const buyer = await getBuyer();
  if (!buyer) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to save this deal." },
      { status: 401 },
    );
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Saving isn't available in this environment yet." },
      { status: 503 },
    );
  }

  // Load the deal so we can enforce ownership before writing.
  const { data: deal, error: loadErr } = await supabase
    .from("deals")
    .select("id, user_id, status, auto_result, vehicle_year, vehicle_make, vehicle_model")
    .eq("id", params.id)
    .maybeSingle();

  if (loadErr || !deal) {
    return NextResponse.json({ ok: false, error: "Deal not found." }, { status: 404 });
  }

  // Already owned by someone else → never reassign.
  if (deal.user_id && deal.user_id !== buyer.id) {
    return NextResponse.json(
      { ok: false, error: "This deal is already saved to another account." },
      { status: 409 },
    );
  }

  // Claim it if it's unowned (no-op when the caller already owns it).
  if (!deal.user_id) {
    const { error: updateErr } = await supabase
      .from("deals")
      .update({ user_id: buyer.id })
      .eq("id", params.id)
      .is("user_id", null); // guard against a race: only claim if still unowned
    if (updateErr) {
      return NextResponse.json(
        { ok: false, error: "Could not save this deal." },
        { status: 500 },
      );
    }
  }

  // Open (or refresh) the engagement + case so it lands on the dashboard.
  // Best-effort: a case failure must not fail the claim the buyer just made.
  try {
    await ensureCaseForDeal({
      id: deal.id as string,
      user_id: buyer.id,
      status: deal.status as never,
      auto_result: deal.auto_result,
      vehicle_year: deal.vehicle_year as number | null,
      vehicle_make: deal.vehicle_make as string | null,
      vehicle_model: deal.vehicle_model as string | null,
    });
  } catch {
    /* ignore — dashboard case is best-effort */
  }

  return NextResponse.json({ ok: true });
}
