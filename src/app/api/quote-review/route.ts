/**
 * POST /api/quote-review — Quote Review intake → Deal Reconstruction.
 *
 * Validates the line-item intake, normalizes it into a canonical NormalizedDeal,
 * injects a MarketCheck price band (server-only), reconciles the math and
 * classifies fees/add-ons via the deal engine, then returns the DealReviewResult.
 *
 * Persistence mirrors /api/deals: when Supabase is configured we store the
 * result in `deals.auto_result` (JSONB) and return the row id; when it isn't, we
 * generate an id and return the result so the client can save it to the on-device
 * workspace and still render the Deal Review page. The result is branded
 * with `schemaVersion: "deal-review-1"` so it never collides with a
 * fairness-engine verdict read by /verdict.
 *
 * The deal engine stays pure — the only side effects (MarketCheck, Supabase)
 * live here.
 */
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { quoteReviewSchema } from "@/lib/schemas";
import { normalizeDealInput } from "@/lib/deal-engine/normalizeDealInput";
import { buildDealReview } from "@/lib/deal-engine/buildDealReview";
import { runMarketCheck } from "@/lib/market-engine/runMarketCheck";
import { isConfigured as isMarketCheckConfigured } from "@/lib/sources/marketcheck/connector";
import type { PriceRange } from "@/lib/fairness-engine";
import { getServiceClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getBuyer } from "@/lib/buyer-auth";
import { ensureCaseForDeal } from "@/lib/cases";
import { logMarketData } from "@/lib/market-data/log";

export const runtime = "nodejs";

function verdictFromScore(score: number): "green" | "amber" | "red" {
  if (score >= 80) return "green";
  if (score >= 55) return "amber";
  return "red";
}

export async function POST(req: Request) {
  // Persists rows and may trigger a paid MarketCheck call — throttle per IP.
  const limit = await rateLimit(req, { key: "quote-review", limit: 20, windowMs: 5 * 60_000 });
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

  const parsed = quoteReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That submission didn't look right. Please check your entries." },
      { status: 422 },
    );
  }

  const deal = normalizeDealInput(parsed.data);

  // Require some substance so we aren't reviewing an empty form.
  const hasSubstance = Boolean(
    deal.vehicle.make ||
      deal.vehicle.model ||
      deal.pricing.vehiclePrice != null ||
      deal.pricing.outTheDoor != null ||
      deal.finance.monthlyPayment != null ||
      deal.finance.apr != null ||
      deal.fees.length > 0 ||
      deal.addOns.length > 0 ||
      deal.trade,
  );
  if (!hasSubstance) {
    return NextResponse.json(
      { error: "Please enter at least one detail about your deal." },
      { status: 422 },
    );
  }

  // MarketCheck band (server-only). We only inject a REAL snapshot — never the
  // demo mock — so a buyer's deal score is never based on fabricated market
  // numbers. Failure or missing key → null (price check stays off; never guessed).
  let marketValue: PriceRange | null = null;
  if (isMarketCheckConfigured()) {
    const mc = await runMarketCheck({
      vin: deal.vehicle.vin,
      year: deal.vehicle.year,
      make: deal.vehicle.make,
      model: deal.vehicle.model,
      trim: deal.vehicle.trim,
      mileage: deal.vehicle.mileage,
      zipCode: deal.sourceMetadata.registrationZip ?? deal.sourceMetadata.dealerZip ?? null,
      radiusMiles: 75,
      dealerAskingPrice: deal.pricing.vehiclePrice,
    }).catch(() => null);
    if (mc && !mc.source.isMock && mc.snapshot.marketLow != null && mc.snapshot.marketHigh != null) {
      marketValue = {
        low: mc.snapshot.marketLow,
        high: mc.snapshot.marketHigh,
        confidence: mc.snapshot.confidence.level,
        basis: mc.snapshot.confidence.reasons[0] ?? "MarketCheck comparable listings.",
      };
    }
  }

  const result = buildDealReview(deal, { marketValue });

  const inputPath: "manual" | "upload" =
    deal.sourceMetadata.documentUploaded ? "upload" : "manual";

  const supabase = getServiceClient();
  if (!supabase) {
    // Not configured — return the result + a generated id for the workspace.
    return NextResponse.json({
      dealId: randomUUID(),
      result,
      persisted: false,
    });
  }

  // De-identified market-data capture (vehicle/pricing/dealer facts; no buyer
  // identity, no account link). Best-effort and non-blocking.
  void logMarketData(supabase, deal, result, inputPath);

  try {
    // Stamp ownership when the buyer is signed in (shows on their dashboard).
    const buyer = await getBuyer();
    const row = {
      user_id: buyer?.id ?? null,
      buyer_state: deal.sourceMetadata.buyerState,
      vehicle_year: deal.vehicle.year,
      vehicle_make: deal.vehicle.make,
      vehicle_model: deal.vehicle.model,
      vehicle_trim: deal.vehicle.trim,
      vehicle_mileage: deal.vehicle.mileage,
      vehicle_vin: deal.vehicle.vin,
      vehicle_price: deal.pricing.vehiclePrice,
      fees: deal.fees.map((f) => ({ label: f.rawLabel, amount: f.amount })),
      down_payment: deal.pricing.downPayment,
      apr: deal.finance.apr,
      term_months: deal.finance.termMonths,
      monthly_payment: deal.finance.monthlyPayment,
      credit_band: deal.finance.creditBand,
      uploaded_file_path: deal.sourceMetadata.uploadedFilePath,
      input_path: inputPath,
      auto_verdict: verdictFromScore(result.dealScore),
      // DealReviewResult is branded; stored in the shared JSONB column. Cast at
      // the boundary — the result page gates on schemaVersion before reading it.
      auto_result: result as unknown as Record<string, unknown>,
      status: "new" as const,
    };

    const { data: persistedDeal, error } = await supabase
      .from("deals")
      .insert(row)
      .select("id")
      .single();

    if (error || !persistedDeal) {
      return NextResponse.json({ dealId: randomUUID(), result, persisted: false });
    }

    // Open an engagement + Quote Review case for a signed-in buyer (best-effort).
    if (buyer?.id) {
      try {
        await ensureCaseForDeal({
          id: persistedDeal.id as string,
          user_id: buyer.id,
          status: "new",
          auto_result: result as unknown as Record<string, unknown>,
          vehicle_year: deal.vehicle.year,
          vehicle_make: deal.vehicle.make,
          vehicle_model: deal.vehicle.model,
        });
      } catch {
        /* ignore — dashboard backfill is best-effort */
      }
    }

    return NextResponse.json({
      dealId: persistedDeal.id as string,
      result,
      persisted: true,
    });
  } catch {
    return NextResponse.json({ dealId: randomUUID(), result, persisted: false });
  }
}
