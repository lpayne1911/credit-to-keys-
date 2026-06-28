/**
 * The Deal Check flow "spine" — step order, progress math, and the per-step
 * "can the buyer continue?" gates. Extracted from the (client) form component so
 * the state machine is pure and unit-testable: a mis-ordered step, a broken
 * progress bar, or a gate that lets a buyer skip a required choice is exactly
 * the kind of silent break that reading the component can't catch.
 */

export type StepKey =
  | "start"
  | "brand" // the vehicle step: make + model (dependent) + trim + VIN, via VehicleSelector
  | "specs"
  | "state"
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
  "state",
  "credit",
  "price",
  "financing",
  "addons",
  "trade",
  "warranty",
];

/**
 * Focused entry points. The product routes (/warranty-check, /apr-check,
 * /add-on-check) reuse this same flow but only collect the steps relevant to
 * the buyer's intent, so they aren't forced through the whole deal. The last
 * step in each set submits.
 */
export type Focus = "full" | "warranty" | "apr" | "addons";

export function stepsForFocus(focus: Focus = "full"): StepKey[] {
  switch (focus) {
    // Warranty fair-pricing uses the brand's reliability tier + age/mileage, so
    // the warranty check legitimately asks for the vehicle.
    case "warranty":
      return ["start", "brand", "specs", "warranty"];
    // APR/payment scoring uses credit band + the loan numbers — NOT the make —
    // so the brand picker is dropped; the flow diverges immediately.
    case "apr":
      return ["start", "credit", "price", "financing"];
    // Add-on/fee scoring keys off the fee labels (+ state), not the make.
    case "addons":
      return ["start", "state", "addons", "warranty"];
    case "full":
    default:
      return STEPS;
  }
}

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
  hasWarranty: boolean | null;
  hasTrade: boolean | null;
}

/**
 * Steps that collect optional context (vehicle identity, buyer state). They
 * always allow Continue — they're never required, but capturing them means we
 * don't identify or score a deal on year/mileage alone, and unlocks
 * state-aware copy (and later, state fee caps).
 */

/**
 * Whether the sticky footer button is enabled for a step. Steps with no footer
 * button (start, credit — they auto-advance on tap) return false. The choice
 * steps (trade, warranty) require an explicit yes/no so a buyer can't blow past
 * a question; brand requires a selection (and a typed value for "Other").
 */
export function continueEnabled(step: StepKey, s: FlowState): boolean {
  switch (step) {
    case "trade":
      return s.hasTrade !== null;
    case "warranty":
      return s.hasWarranty !== null;
    case "brand": // vehicle identity is optional (the selector offers "I don't know")
    case "specs":
    case "state":
    case "price":
    case "financing":
    case "addons":
      return true;
    default:
      return false; // start, credit — no footer button
  }
}
