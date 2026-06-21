/**
 * POST /api/deals — manual-entry path: score a submitted deal and persist it.
 *
 * Scoring is INSTANT for manual entry (typed numbers can be scored immediately).
 * Persistence happens server-side with the service-role key (RLS-bypassing);
 * the public anon key is never used to read/write deals. If Supabase isn't
 * configured, we still return the scored verdict so the app is usable — we just
 * can't persist or offer a shareable link / human review.
 */
import { NextResponse } from "next/server";
import { scoreDeal } from "@/lib/fairness-engine";
import { toFairnessInput, toDealRow } from "@/lib/deal-mapper";
import { dealSubmissionSchema } from "@/lib/schemas";
import { getServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = dealSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That submission didn't look right. Please check your entries." },
      { status: 422 },
    );
  }
  const body = parsed.data;

  const input = toFairnessInput(body);

  // Require at least a vehicle make/model so we aren't scoring an empty form.
  if (!input.vehicle.make && !input.vehicle.model) {
    return NextResponse.json(
      { error: "Please enter at least the vehicle make and model." },
      { status: 422 },
    );
  }

  const result = scoreDeal(input);

  const supabase = getServiceClient();
  if (!supabase) {
    // Not configured — return the verdict for inline display, no persistence.
    return NextResponse.json({ id: null, result, persisted: false });
  }

  try {
    // Create (or reuse) a lead if the buyer gave contact info.
    let leadId: string | null = null;
    const name = body.lead?.name?.trim() || null;
    const email = body.lead?.email?.trim() || null;
    if (name || email) {
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .insert({ name, email })
        .select("id")
        .single();
      if (!leadErr && lead) leadId = lead.id as string;
    }

    const row = toDealRow(body, input, result, leadId);
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .insert(row)
      .select("id")
      .single();

    if (dealErr || !deal) {
      // Persistence failed — degrade gracefully, still return the verdict.
      return NextResponse.json({ id: null, result, persisted: false });
    }

    // Mirror flags into the normalized findings table for the console.
    const findings = result.flags.map((f) => ({
      deal_id: deal.id,
      type: f.type,
      severity: f.severity,
      title: f.title,
      explanation: f.explanation,
      source: "auto" as const,
    }));
    if (findings.length) {
      await supabase.from("findings").insert(findings);
    }

    return NextResponse.json({ id: deal.id, result, persisted: true });
  } catch {
    return NextResponse.json({ id: null, result, persisted: false });
  }
}
