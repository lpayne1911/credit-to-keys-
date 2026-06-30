/**
 * POST /api/build-my-plan — Build My Plan intake → Target Deal Sheet.
 *
 * Forward-looking (the buyer has no quote yet), so this resolves the two side
 * inputs the pure engine needs — a market price band and the state doc-fee rule
 * — then calls buildTargetDealSheet. Unlike the deal score, a planning target is
 * useful even from demo data, so we DO use the MarketCheck mock fallback here but
 * flag it (`isEstimate`) so the sheet never implies a live lookup it didn't run.
 *
 * v1 persistence is client-side: we return the sheet + a generated id and the
 * intake form saves it to the on-device workspace for the /plan/[planId] page.
 */
import { randomUUID } from "node:crypto";
import { buildPlanSchema } from "@/lib/schemas";
import { buildTargetDealSheet } from "@/lib/plan-engine/buildTargetDealSheet";
import type { PlanMarket, TargetPlanInput } from "@/lib/plan-engine/types";
import type { CreditBand } from "@/lib/fairness-engine";
import { runMarketCheck } from "@/lib/market-engine/runMarketCheck";
import { getDocFeeRuleForState } from "@/lib/intelligence/docFeeRules";
import { apiError, apiOk } from "@/lib/api-response";

export const runtime = "nodejs";

/** Parse a loose money/number field ("$24,500" | 24500 | "") into a number|null. */
function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  }
  return null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

const CREDIT_BANDS: CreditBand[] = ["excellent", "good", "fair", "poor", "unknown"];
function creditBandOf(v: unknown): CreditBand {
  return typeof v === "string" && CREDIT_BANDS.includes(v as CreditBand) ? (v as CreditBand) : "unknown";
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("invalid_json", "Invalid JSON body.");
  }

  const parsed = buildPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("validation", "That submission didn't look right. Please check your entries.");
  }
  const d = parsed.data;

  const input: TargetPlanInput = {
    vehicle: {
      year: num(d.vehicle?.year),
      make: str(d.vehicle?.make),
      model: str(d.vehicle?.model),
      trim: str(d.vehicle?.trim),
      mileage: num(d.vehicle?.mileage),
    },
    condition: d.condition ?? "used",
    zip: str(d.zip),
    buyerState: str(d.buyerState),
    creditBand: creditBandOf(d.creditBand),
    termMonths: num(d.termMonths),
    downPayment: num(d.downPayment),
    maxMonthly: num(d.maxMonthly),
    maxOutTheDoor: num(d.maxOutTheDoor),
    trade: d.trade
      ? { estimatedValue: num(d.trade.estimatedValue), loanPayoff: num(d.trade.loanPayoff) }
      : null,
  };

  // Require enough to anchor on (a vehicle).
  if (!input.vehicle.make && !input.vehicle.model) {
    return apiError("validation", "Tell us the vehicle you're targeting (make and model).");
  }

  // Market band — mock fallback allowed for planning, but flagged via isEstimate.
  let market: PlanMarket = {
    targetPrice: null,
    marketLow: null,
    marketMedian: null,
    marketHigh: null,
    confidence: "low",
    basis: "No market data available yet.",
    isEstimate: true,
  };
  const mc = await runMarketCheck({
    year: input.vehicle.year,
    make: input.vehicle.make,
    model: input.vehicle.model,
    trim: input.vehicle.trim,
    mileage: input.vehicle.mileage,
    condition: input.condition,
    zipCode: input.zip,
    radiusMiles: 75,
  }).catch(() => null);
  if (mc) {
    market = {
      targetPrice: mc.snapshot.targetPrice ?? mc.snapshot.marketMedian,
      marketLow: mc.snapshot.marketLow,
      marketMedian: mc.snapshot.marketMedian,
      marketHigh: mc.snapshot.marketHigh,
      confidence: mc.snapshot.confidence.level,
      basis: mc.snapshot.confidence.reasons[0] ?? "MarketCheck comparable listings.",
      isEstimate: mc.source.isMock,
    };
  }

  const docFeeRule = input.buyerState ? getDocFeeRuleForState(input.buyerState.toUpperCase()) : null;

  const result = buildTargetDealSheet(input, { market, docFeeRule });

  return apiOk({ planId: randomUUID(), result, persisted: false });
}
