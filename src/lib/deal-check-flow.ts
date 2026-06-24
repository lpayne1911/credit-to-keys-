/**
 * The Deal Check flow "spine" — step order, progress math, and the per-step
 * "can the buyer continue?" gates. Extracted from the (client) form component so
 * the state machine is pure and unit-testable: a mis-ordered step, a broken
 * progress bar, or a gate that lets a buyer skip a required choice is exactly
 * the kind of silent break that reading the component can't catch.
 */

export type StepKey =
  | "start"
  | "brand"
  | "specs"
  | "credit"
  | "price"
  | "financing"
  | "addons"
  | "trade"
  | "warranty";

/** Ordered steps. `start` is the intro; the rest drive the progress bar. */
export const STEPS: StepKey[] = [
  "start",
  "brand",
  "specs",
  "credit",
  "price",
  "financing",
  "addons",
  "trade",
  "warranty",
];

/** Steps counted by the progress bar (everything after the intro). */
export const PROGRESS_STEPS = STEPS.length - 1;

/** Progress-bar fill for a given step index (0 on the intro, 100 at the end). */
export function progressPercent(stepIdx: number): number {
  if (stepIdx <= 0) return 0;
  return Math.round((Math.min(stepIdx, PROGRESS_STEPS) / PROGRESS_STEPS) * 100);
}

/** The slice of form state the continue-gates depend on. */
export interface FlowState {
  make: string;
  makeOther: string;
  hasWarranty: boolean | null;
  hasTrade: boolean | null;
}

/**
 * Whether the sticky footer button is enabled for a step. Steps with no footer
 * button (start, credit — they auto-advance on tap) return false. The choice
 * steps (trade, warranty) require an explicit yes/no so a buyer can't blow past
 * a question; brand requires a selection (and a typed value for "Other").
 */
export function continueEnabled(step: StepKey, s: FlowState): boolean {
  switch (step) {
    case "brand":
      return Boolean(s.make && (s.make !== "Other" || s.makeOther.trim()));
    case "trade":
      return s.hasTrade !== null;
    case "warranty":
      return s.hasWarranty !== null;
    case "specs":
    case "price":
    case "financing":
    case "addons":
      return true;
    default:
      return false; // start, credit — no footer button
  }
}
