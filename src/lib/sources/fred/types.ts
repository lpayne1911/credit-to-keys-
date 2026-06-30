/**
 * FRED APR-benchmark layer — normalized type.
 *
 * FRED (St. Louis Federal Reserve) publishes the G.19 consumer auto-loan
 * finance rate. We turn the recent series into a low/high national-average band
 * the deal engine compares a buyer's quoted APR against. Real data only — when
 * unconfigured/disabled/failed the engine keeps its conservative placeholder.
 */
export interface AprBenchmark {
  /** Low edge of the national-average band, percent (e.g. 7.2). */
  low: number;
  /** High edge of the national-average band, percent (e.g. 9.1). */
  high: number;
  source: "fred";
  /** The deal's loan term this band was requested for. */
  term?: number;
  /** ISO date of the latest observation the band is based on. */
  asOf?: string;
}
