/**
 * ============================================================================
 *  Output Contract — shared finding shape
 * ============================================================================
 *
 * The common shape of a single buyer-facing finding/assessment — the
 * what / why / ask / impact / confidence pattern already used by
 * `FeeAssessment`, `AddOnAssessment`, and `RiskFlag`. New outputs should
 * conform to this so every report reads consistently. Existing engine types
 * are structurally compatible and can adopt it incrementally.
 */
import type { PriceRange } from "@/lib/fairness-engine";
import type { Confidence } from "./confidence";

export interface Finding {
  /** What it is — a label or short headline. */
  title: string;
  /** Why it matters — plain-English decision support, never a legal conclusion. */
  reason: string;
  /** The calm next step for the buyer ("Ask for…", "Confirm…", "Decline…"). */
  suggestedAction: string;
  /** Optional dollar impact — always a range with a basis, never false precision. */
  estimatedImpact?: PriceRange | null;
  /** How confident we are in this finding. */
  confidence: Confidence;
}
