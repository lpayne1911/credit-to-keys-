/**
 * ============================================================================
 *  Output Contract — the program's shared output foundation
 * ============================================================================
 *
 * One import site for the cross-engine output vocabulary: the canonical
 * confidence scale, the result envelope, the shared finding shape, and a
 * re-export of `PriceRange` (whose canonical definition stays in
 * `fairness-engine.ts` to avoid churning ~15 import sites).
 */
export type { Confidence } from "./confidence";
export { minConfidence } from "./confidence";
export type { EngineResultEnvelope } from "./envelope";
export type { Finding } from "./finding";
export type { PriceRange } from "@/lib/fairness-engine";
