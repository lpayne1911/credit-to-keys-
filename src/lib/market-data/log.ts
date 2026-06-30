/**
 * ============================================================================
 *  Market-data log — de-identified analytics capture
 * ============================================================================
 *
 * Writes one append-only row per reviewed deal into `deal_market_data`: the
 * vehicle, full pricing/fee/add-on/finance breakdown, trade-in, dealer, and the
 * computed score. This is the compiled dataset for internal analysis and future
 * data products.
 *
 * IDENTITY: this layer NEVER records buyer name / DOB / driver's license /
 * insurance / email (the app doesn't collect them) and stores NO user_id, so a
 * row can't be tied back to an account. VIN and salesperson are vehicle/seller
 * data, not buyer identity — see the migration's re-identification notes before
 * any external release.
 *
 * Best-effort and non-blocking: any failure (table missing, transient error) is
 * swallowed so it never affects the buyer's review response.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DealReviewResult, NormalizedDeal } from "@/lib/deal-engine/types";

export async function logMarketData(
  supabase: SupabaseClient,
  deal: NormalizedDeal,
  result: DealReviewResult,
  inputPath: "manual" | "upload",
): Promise<void> {
  try {
    const { vehicle, pricing, finance, trade } = deal;

    const row = {
      input_path: inputPath,
      engine_version: result.engineVersion,

      vehicle_year: vehicle.year,
      vehicle_make: vehicle.make,
      vehicle_model: vehicle.model,
      vehicle_trim: vehicle.trim,
      vehicle_condition: vehicle.condition,
      vehicle_color: vehicle.color,
      vehicle_mileage: vehicle.mileage,
      vehicle_vin: vehicle.vin,

      vehicle_price: pricing.vehiclePrice,
      msrp: pricing.msrp,
      dealer_discount: pricing.dealerDiscount,
      rebates: pricing.rebates,
      out_the_door: pricing.outTheDoor,
      down_payment: pricing.downPayment,
      total_vehicle_price: pricing.totalVehiclePrice,
      balance_due: pricing.balanceDue,

      // Keep the classified line items (label + amount + category) so the
      // dataset is queryable by fee/product type, not just totals.
      fees: result.feeAssessments.map((f) => ({
        label: f.rawLabel,
        amount: f.amount,
        category: f.category,
      })),
      add_ons: result.addOnAssessments.map((a) => ({
        label: a.rawLabel,
        amount: a.amount,
        category: a.category,
        financed: a.financedIntoLoan,
      })),
      total_fees: result.math.totalFees,
      total_add_ons: result.math.totalAddOns,

      apr: finance.apr,
      term_months: finance.termMonths,
      monthly_payment: finance.monthlyPayment,
      amount_financed: finance.amountFinanced ?? result.math.estimatedAmountFinanced,
      credit_band: finance.creditBand,

      trade_year: trade?.year ?? null,
      trade_make: trade?.make ?? null,
      trade_model: trade?.model ?? null,
      trade_mileage: trade?.mileage ?? null,
      trade_offer: trade?.offer ?? null,
      trade_payoff: trade?.loanPayoff ?? null,

      dealer_name: deal.sourceMetadata.dealerName,
      dealer_address: deal.sourceMetadata.dealerAddress,
      dealer_phone: deal.sourceMetadata.dealerPhone,
      dealer_zip: deal.sourceMetadata.dealerZip,
      dealer_state: deal.sourceMetadata.buyerState,
      salesperson: deal.sourceMetadata.salesperson,
      stock_number: deal.sourceMetadata.stockNumber,

      deal_score: result.dealScore,
      market_low: result.marketValue?.low ?? null,
      market_high: result.marketValue?.high ?? null,
    };

    await supabase.from("deal_market_data").insert(row);
  } catch {
    // Non-fatal — analytics capture must never break the review.
  }
}
