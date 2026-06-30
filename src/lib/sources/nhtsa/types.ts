/**
 * NHTSA safety layer — normalized types.
 *
 * Two free, keyless NHTSA APIs back this: the Recalls API (open recalls by
 * year/make/model) and the NCAP Safety Ratings API (crash-test stars). The app
 * never renders raw NHTSA JSON — the connector fetches it, the normalizer maps
 * it into these shapes, and the UI consumes only the normalized model.
 *
 * Honesty rule: this data is REAL-OR-HIDDEN. There is no mock/sample mode —
 * fabricating recalls or crash ratings would be misleading. When NHTSA returns
 * nothing, `buildSafetyReport` returns null and the card is not rendered.
 */

/** A single open safety recall for the vehicle. */
export interface Recall {
  /** NHTSA campaign number, e.g. "23V456000". */
  campaignId: string;
  /** Affected system, e.g. "ELECTRICAL SYSTEM". */
  component: string;
  /** What the defect is. */
  summary: string;
  /** Why it matters / the risk. */
  consequence: string;
  /** The fix the manufacturer will perform. */
  remedy: string;
  /** ISO date the recall was reported, when available. */
  reportDate: string | null;
}

/** NCAP crash-test stars (1–5), null per metric when not rated. */
export interface SafetyRating {
  overall: number | null;
  frontCrash: number | null;
  sideCrash: number | null;
  rollover: number | null;
}

/** Vehicle-level safety signals from the same NCAP detail response — owner
 *  complaints, open investigations, and standard driver-assist equipment. */
export interface SafetySignals {
  complaints: number | null;
  investigations: number | null;
  /** "Standard" | "Optional" | null per system. */
  forwardCollisionWarning: string | null;
  laneDepartureWarning: string | null;
  electronicStabilityControl: string | null;
}

/** The normalized safety picture for one vehicle. Null fields/empty arrays are
 *  honest "nothing reported", never fabricated. */
export interface SafetyReport {
  recalls: Recall[];
  ratings: SafetyRating | null;
  signals: SafetySignals | null;
  source: {
    provider: "nhtsa";
    fetchedAt: string;
  };
}
