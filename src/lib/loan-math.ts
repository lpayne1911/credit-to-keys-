/**
 * ============================================================================
 *  Driveway Advocate — Loan Math
 * ============================================================================
 *
 * Pure, dependency-free amortization helpers. These contain NO pricing
 * assumptions and NO scoring opinions — just the standard math of a fixed-rate
 * installment loan. The fairness engine uses them to cross-check a quoted
 * monthly payment against the rest of the deal (price, fees, APR, term); the UI
 * never touches this module directly.
 *
 * Keeping the math here (separate from `fairness-engine.ts`) means:
 *  - it can be unit-tested against textbook values with zero placeholders, and
 *  - the real fairness engine swap (Phase 1) reuses the same, trusted formulas.
 *
 * Every function is total and defensive: bad/empty inputs return a safe value
 * (0 or null) rather than NaN/Infinity, because the data comes from a stressed
 * buyer typing numbers off a finance worksheet.
 * ============================================================================
 */

/** Treat monthly rates this small as zero to avoid divide-by-zero blowups. */
const RATE_EPSILON = 1e-9;

/** A monthly-payment estimate paired with the total interest it implies. */
export interface PaymentBreakdown {
  /** Level monthly payment to amortize `principal` over the term. */
  monthlyPayment: number;
  /** Total of all payments minus the amount financed. */
  totalInterest: number;
  /** Sum of every scheduled payment over the life of the loan. */
  totalPaid: number;
}

function monthlyRate(aprPct: number): number {
  return aprPct / 100 / 12;
}

/**
 * Level monthly payment for a fully-amortizing fixed-rate loan.
 *   M = P · r / (1 − (1 + r)^−n)   (and M = P / n when r ≈ 0)
 *
 * Returns 0 for non-positive principal or term.
 */
export function monthlyPayment(
  principal: number,
  aprPct: number,
  termMonths: number,
): number {
  if (!(principal > 0) || !(termMonths > 0)) return 0;
  const r = monthlyRate(aprPct);
  if (Math.abs(r) < RATE_EPSILON) return principal / termMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

/**
 * The inverse: the principal a given level monthly payment can support at a
 * stated APR and term.
 *   P = M · (1 − (1 + r)^−n) / r   (and P = M · n when r ≈ 0)
 *
 * This is how we recover "how much is really being financed" from a quoted
 * payment. Returns 0 for non-positive payment or term.
 */
export function principalFromPayment(
  payment: number,
  aprPct: number,
  termMonths: number,
): number {
  if (!(payment > 0) || !(termMonths > 0)) return 0;
  const r = monthlyRate(aprPct);
  if (Math.abs(r) < RATE_EPSILON) return payment * termMonths;
  return (payment * (1 - Math.pow(1 + r, -termMonths))) / r;
}

/**
 * Solve for the APR implied by a payment / principal / term, via bisection on
 * the monthly rate. Returns:
 *   - `0`    when the payment barely covers (or under-covers) the principal —
 *            i.e. the loan is interest-free or better; nothing to flag.
 *   - `null` when no realistic rate explains the payment (e.g. the implied APR
 *            would exceed our search ceiling), so callers don't show nonsense.
 *
 * Monthly payment is strictly increasing in the rate, so bisection converges.
 */
export function impliedAprPct(
  payment: number,
  principal: number,
  termMonths: number,
): number | null {
  if (!(payment > 0) || !(principal > 0) || !(termMonths > 0)) return null;
  // Total paid never exceeds principal → 0% (or below). Treat as no markup.
  if (payment * termMonths <= principal) return 0;

  // Search monthly rate in [0, hi]. hi = 1.0/mo ≈ 1200% APR is a safe ceiling
  // that still covers even predatory buy-here-pay-here paper.
  let lo = 0;
  let hi = 1.0;
  const payAt = (r: number) =>
    Math.abs(r) < RATE_EPSILON
      ? principal / termMonths
      : (principal * r) / (1 - Math.pow(1 + r, -termMonths));

  // If even the ceiling can't produce a payment this large, give up.
  if (payAt(hi) < payment) return null;

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (payAt(mid) < payment) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 12 * 100;
}

/**
 * Convenience breakdown for a principal financed at an APR over a term. Used to
 * show a buyer the true cost of a long loan (total interest), not just the
 * payment the finance office leads with.
 */
export function paymentBreakdown(
  principal: number,
  aprPct: number,
  termMonths: number,
): PaymentBreakdown {
  const m = monthlyPayment(principal, aprPct, termMonths);
  const totalPaid = m * Math.max(0, termMonths);
  return {
    monthlyPayment: m,
    totalPaid,
    totalInterest: Math.max(0, totalPaid - Math.max(0, principal)),
  };
}
