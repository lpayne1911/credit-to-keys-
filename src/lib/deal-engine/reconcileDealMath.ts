/**
 * ============================================================================
 *  Deal Engine — reconcileDealMath
 * ============================================================================
 *
 * Deterministically reconciles a {@link NormalizedDeal}: totals the fees and
 * add-ons, works out trade equity, estimates the amount financed, and checks
 * the dealer's quoted monthly payment against the APR, term, and amount
 * financed using the trusted amortization helpers in `loan-math.ts`.
 *
 * NO AI is used for any of this math. The reconciliation is conservative about
 * what it asserts: a hard "payment mismatch" is only raised when the amount
 * financed is known on a reliable basis (explicitly stated, or derived from a
 * dealer-provided out-the-door price that already includes tax). When the
 * amount financed is only estimated (no tax figure), the comparison is reported
 * as approximate and never hard-flagged — so we don't accuse a deal that simply
 * has tax we couldn't see.
 *
 * Compliance: when the numbers don't line up we say exactly
 *   "The payment does not reconcile with the APR, term, and amount financed
 *    provided."
 * We never say the dealer lied.
 * ============================================================================
 */
import {
  compareTerm,
  impliedAprPct,
  monthlyPayment,
} from "@/lib/loan-math";
import type { DealMathOutput, NormalizedDeal } from "./types";

/** Payment is considered reconciled within this tolerance. */
function paymentTolerance(expected: number): number {
  return Math.max(15, expected * 0.04);
}

/** A conservative placeholder APR band — NOT a real benchmark. */
const APR_BENCHMARK_PLACEHOLDER = { low: 5, high: 9, source: "placeholder" as const };

export function reconcileDealMath(deal: NormalizedDeal): DealMathOutput {
  const notes: string[] = [];

  const totalFees = deal.fees.reduce((s, f) => s + (f.amount || 0), 0);
  const totalAddOns = deal.addOns.reduce((s, a) => s + (a.amount || 0), 0);

  // Trade: the net amount the trade applies to the deal is (allowance − payoff).
  const offer = deal.trade?.offer ?? null;
  const estimatedValue = deal.trade?.estimatedValue ?? null;
  const payoff = deal.trade?.loanPayoff ?? null;
  const allowance = offer ?? estimatedValue;
  const tradeEquity =
    allowance != null ? allowance - (payoff ?? 0) : null;
  const negativeEquity =
    offer != null && payoff != null ? Math.max(0, payoff - offer) : null;

  const { vehiclePrice, downPayment, outTheDoor } = deal.pricing;
  const down = downPayment ?? 0;
  const { apr, termMonths, monthlyPayment: dealerMonthlyPayment } = deal.finance;

  // Estimate the amount financed, preferring the most reliable basis.
  let estimatedAmountFinanced: number | null = null;
  let financedBasisReliable = false;

  if (deal.finance.amountFinanced != null) {
    estimatedAmountFinanced = deal.finance.amountFinanced;
    financedBasisReliable = true;
    notes.push("Amount financed taken directly from the figures provided.");
  } else if (outTheDoor != null) {
    estimatedAmountFinanced = Math.max(
      0,
      outTheDoor - down - (tradeEquity ?? 0),
    );
    financedBasisReliable = true;
    notes.push(
      "Amount financed estimated from the out-the-door price minus down payment and trade equity (taxes already included in out-the-door).",
    );
  } else if (vehiclePrice != null) {
    estimatedAmountFinanced = Math.max(
      0,
      vehiclePrice - down + totalFees + totalAddOns - (tradeEquity ?? 0),
    );
    notes.push(
      "Amount financed estimated from selling price + fees + add-ons − down payment − trade equity. Sales tax is NOT included (no out-the-door figure provided), so this is approximate.",
    );
  } else {
    notes.push("Not enough pricing detail to estimate the amount financed.");
  }

  // Expected payment from the reconstructed financing.
  let expectedMonthlyPayment: number | null = null;
  if (estimatedAmountFinanced != null && apr != null && termMonths != null) {
    expectedMonthlyPayment = monthlyPayment(
      estimatedAmountFinanced,
      apr,
      termMonths,
    );
  }

  // Imply the APR when it wasn't given but we have payment + principal + term.
  let impliedApr: number | null = null;
  if (
    apr == null &&
    dealerMonthlyPayment != null &&
    estimatedAmountFinanced != null &&
    termMonths != null
  ) {
    impliedApr = impliedAprPct(
      dealerMonthlyPayment,
      estimatedAmountFinanced,
      termMonths,
    );
    if (impliedApr != null) {
      notes.push(
        `APR was not provided; the quoted payment implies roughly ${impliedApr.toFixed(1)}% based on the estimated amount financed.`,
      );
    }
  }

  // Compare expected vs dealer-quoted payment.
  let paymentDelta: number | null = null;
  let paymentMismatch = false;
  if (expectedMonthlyPayment != null && dealerMonthlyPayment != null) {
    paymentDelta = dealerMonthlyPayment - expectedMonthlyPayment;
    if (financedBasisReliable) {
      paymentMismatch =
        Math.abs(paymentDelta) > paymentTolerance(expectedMonthlyPayment);
    } else if (
      Math.abs(paymentDelta) > paymentTolerance(expectedMonthlyPayment)
    ) {
      notes.push(
        "The quoted payment differs from the reconstructed payment, but the amount financed is approximate (no tax figure). Treat the gap as a prompt to confirm the numbers, not a confirmed mismatch.",
      );
    }
  }

  // Term stretch: a long loan with a meaningfully shorter standard rung.
  let termStretch: DealMathOutput["termStretch"] = null;
  if (termMonths != null && estimatedAmountFinanced != null) {
    const cmp = compareTerm(estimatedAmountFinanced, apr ?? 0, termMonths);
    if (cmp?.shorter) {
      termStretch = {
        current: termMonths,
        rung: cmp.shorter.termMonths,
        flagged: termMonths >= 72,
      };
    } else if (termMonths >= 72) {
      termStretch = { current: termMonths, rung: termMonths, flagged: true };
    }
  }

  return {
    totalFees,
    totalAddOns,
    tradeEquity,
    negativeEquity,
    estimatedAmountFinanced,
    expectedMonthlyPayment,
    dealerMonthlyPayment: dealerMonthlyPayment ?? null,
    paymentDelta,
    paymentMismatch,
    impliedApr,
    termStretch,
    aprBenchmark: APR_BENCHMARK_PLACEHOLDER,
    notes,
  };
}
