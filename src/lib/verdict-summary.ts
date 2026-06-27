/**
 * Verdict-summary math — pure aggregations the verdict UI leads with, kept out
 * of the fairness engine (so its tests stay stable) and out of the React layer
 * (so they can be unit-tested directly).
 */
import type { FairnessResult, FlagType } from "./fairness-engine";

/**
 * Flag types whose dollar impact is NOT money the buyer claws back, so they
 * must never inflate the "potential savings" headline. Negative equity is
 * pre-existing debt to restructure — real money at risk, but not a fee you
 * remove — so counting it as "savings we spotted" would overstate the number.
 */
const NON_SAVINGS_TYPES: ReadonlySet<FlagType> = new Set<FlagType>([
  "negative_equity",
]);

/**
 * Total dollars a buyer could plausibly claw back by pushing on the flags —
 * junk fees, marked-up rate, overpriced add-ons/warranty, a lowball trade.
 * Excludes debt-restructuring impacts. Returns null when there's nothing to
 * claw back, so the UI can show a clean "nothing obvious" state.
 */
export function savingsRange(
  result: FairnessResult,
): { low: number; high: number } | null {
  let low = 0;
  let high = 0;
  let any = false;
  for (const f of result.flags) {
    if (!f.estimatedImpact) continue;
    if (NON_SAVINGS_TYPES.has(f.type)) continue;
    low += f.estimatedImpact.low;
    high += f.estimatedImpact.high;
    any = true;
  }
  return any && high > 0 ? { low, high } : null;
}

export interface SavingsLine {
  /** Human label for the category (the flag's title). */
  label: string;
  low: number;
  high: number;
}

/**
 * Per-category breakdown behind {@link savingsRange}: one line per flag that
 * contributes clawback-able dollars, each with its own range. Same exclusions as
 * the headline total, so the lines always sum to it.
 */
export function savingsBreakdown(result: FairnessResult): SavingsLine[] {
  const out: SavingsLine[] = [];
  for (const f of result.flags) {
    if (!f.estimatedImpact) continue;
    if (NON_SAVINGS_TYPES.has(f.type)) continue;
    if (f.estimatedImpact.high <= 0) continue;
    out.push({
      label: f.title,
      low: f.estimatedImpact.low,
      high: f.estimatedImpact.high,
    });
  }
  return out;
}
