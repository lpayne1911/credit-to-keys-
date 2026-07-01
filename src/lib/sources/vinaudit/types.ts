/**
 * VinAudit (NMVTIS) title-history layer — normalized types.
 *
 * NMVTIS title/brand data is only available through approved resellers; we use
 * VinAudit's JSON API. The app never renders raw VinAudit JSON — the connector
 * fetches it, the normalizer maps it into these shapes, and the UI + deal engine
 * consume only the normalized model.
 *
 * REAL-OR-HIDDEN: there is no mock/sample mode. Fabricating a title record would
 * be dangerous and misleading. When VinAudit returns nothing (or the lookup is
 * disabled/unconfigured/failed), `buildTitleHistory` returns null and the card /
 * risk flag simply don't appear.
 */

/** A single title-brand record (e.g. SALVAGE, FLOOD, REBUILT). */
export interface TitleBrand {
  /** Human-readable brand label, e.g. "Salvage". */
  label: string;
  /** Titling state (2-letter), when known. */
  state: string | null;
  /** ISO-ish date the brand was recorded, when known. */
  date: string | null;
}

/** The normalized title picture for one VIN. Boolean flags are the buyer-facing
 *  risk signals; counts add context. Nothing here is fabricated. */
export interface TitleHistory {
  /** Any negative brand present (salvage/junk/flood/rebuilt/lemon/…). The single
   *  most important buyer signal. */
  branded: boolean;
  brands: TitleBrand[];
  /** An insurance total-loss record exists. */
  totalLoss: boolean;
  /** A theft record exists. */
  theftRecord: boolean;
  /** Odometer readings suggest a rollback / inconsistency. */
  odometerRollbackSuspected: boolean;
  /** Count of NMVTIS title records (roughly, states titled in). */
  titleRecordCount: number | null;
  /** Estimated number of owners, when derivable. */
  owners: number | null;
  /** Most recent odometer reading, when available. */
  lastOdometer: number | null;
  source: {
    provider: "vinaudit";
    fetchedAt: string;
  };
}
