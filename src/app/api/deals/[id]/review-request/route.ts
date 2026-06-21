/**
 * POST /api/deals/[id]/review-request — buyer asks for a deeper human review.
 *
 * Flips the deal's status to `review_requested` and optionally captures buyer
 * contact info so an operator can follow up.
 *
 * COMPLIANCE — ADVANCE-FEE RULE (CROA / TSR):
 *   v1 has NO payments. When a *paid* deeper review is added later, the charge
 *   MUST occur only AFTER the reviewed verdict is delivered to the buyer — never
 *   before. Do not add any pre-charge step to this flow. This is the seam where
 *   that "charge only after delivery" rule will be enforced.
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { reviewRequestSchema } from "@/lib/schemas";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Reviews aren't available in this environment yet." },
      { status: 503 },
    );
  }

  let contact: { name?: string; email?: string } = {};
  try {
    const parsed = reviewRequestSchema.safeParse(await req.json());
    if (parsed.success) contact = parsed.data;
  } catch {
    // body is optional
  }

  // Attach/refresh a lead with the buyer's contact info if provided.
  let leadId: string | null = null;
  const name = contact.name?.trim() || null;
  const email = contact.email?.trim() || null;
  if (name || email) {
    const { data: lead } = await supabase
      .from("leads")
      .insert({ name, email })
      .select("id")
      .single();
    if (lead) leadId = lead.id as string;
  }

  const update: Record<string, unknown> = { status: "review_requested" };
  if (leadId) update.lead_id = leadId;

  const { error } = await supabase
    .from("deals")
    .update(update)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Could not submit your review request." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
