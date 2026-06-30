/**
 * ============================================================================
 *  Output Contract — engine result envelope
 * ============================================================================
 *
 * Every engine result (deal review, fairness verdict, target plan, post-sale
 * triage) carries this envelope so persisted / cross-network payloads are
 * self-describing and never collide:
 *
 *  - schemaVersion — brands the SHAPE (e.g. "deal-review-1") so a reader can
 *    safely discriminate one result type from another in a shared JSONB column.
 *  - engineVersion — the implementation version that produced it; bump on a
 *    logic change so stored results remain interpretable.
 *  - createdAt — ISO timestamp of generation. Builders accept an injectable
 *    clock so the value is deterministic under test.
 */
export interface EngineResultEnvelope {
  schemaVersion: string;
  engineVersion: string;
  createdAt: string;
}
