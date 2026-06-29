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
import { runMarketCheck } from "@/lib/market-engine/runMarketCheck";
import { isConfigured as isMarketCheckConfigured } from "@/lib/sources/marketcheck/connector";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getBuyer } from "@/lib/buyer-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Persists rows and may trigger a paid MarketCheck call — throttle per IP.
  const limit = await rateLimit(req, { key: "deals", limit: 30, windowMs: 5 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

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

  // Require SOME substantive input so we aren't scoring an empty form — but the
  // focused checks (APR, add-ons) legitimately have no vehicle make/model, so we
  // accept any meaningful signal: a vehicle, loan numbers, fees, or a warranty.
  const hasSubstance = Boolean(
    input.vehicle.make ||
      input.vehicle.model ||
      input.deal.apr != null ||
      input.deal.vehiclePrice != null ||
      input.deal.monthlyPayment != null ||
      (input.deal.fees && input.deal.fees.length > 0) ||
      (input.warranty &&
        (input.warranty.priceQuoted != null ||
          (input.warranty.coverageTier && input.warranty.coverageTier !== "unknown"))) ||
      input.tradeIn,
  );
  if (!hasSubstance) {
    return NextResponse.json(
      { error: "Please enter at least one detail about your deal." },
      { status: 422 },
    );
  }

  // Feed a REAL MarketCheck snapshot into the score when configured. We only
  // inject live data (never the demo mock) so a real buyer's score is never
  // based on fabricated market numbers; with no key, price fairness stays off.
  if (isMarketCheckConfigured()) {
    const mc = await runMarketCheck({
      vin: input.vehicle.vin ?? null,
      year: input.vehicle.year,
      make: input.vehicle.make,
      model: input.vehicle.model,
      trim: input.vehicle.trim,
      mileage: input.vehicle.mileage,
      zipCode: input.registrationZip ?? input.dealerZip ?? null,
      radiusMiles: 75,
      dealerAskingPrice: input.deal.vehiclePrice ?? null,
    }).catch(() => null);
    if (mc && !mc.source.isMock && mc.snapshot.marketLow != null && mc.snapshot.marketHigh != null) {
      input.marketValue = {
        low: mc.snapshot.marketLow,
        high: mc.snapshot.marketHigh,
        confidence: mc.snapshot.confidence.level,
        basis: mc.snapshot.confidence.reasons[0] ?? "MarketCheck comparable listings.",
      };
      input.marketMedian = mc.snapshot.marketMedian;
      input.marketTarget = mc.snapshot.targetPrice;
    }
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

    // Stamp ownership when the buyer is signed in, so it shows on their dashboard.
    const buyer = await getBuyer();
    const row = { ...toDealRow(body, input, result, leadId), user_id: buyer?.id ?? null };
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
