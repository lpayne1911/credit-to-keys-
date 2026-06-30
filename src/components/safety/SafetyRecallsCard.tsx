import type { SafetyRating, SafetyReport } from "@/lib/sources/nhtsa/types";

/** Real vehicles can carry many verbose recalls — cap the list so the card
 *  stays scannable; the rest roll up into a "+N more" line. */
const MAX_RECALLS = 6;

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-gold" : "text-navy/15"} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

function RatingRow({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between border-b border-edge py-2 text-sm last:border-0">
      <span className="text-slate">{label}</span>
      <Stars value={value} />
    </div>
  );
}

function hasAnyRating(r: SafetyRating): boolean {
  return r.overall != null || r.frontCrash != null || r.sideCrash != null || r.rollover != null;
}

/**
 * Renders NHTSA open recalls + NCAP crash-test ratings. Returns null when there
 * is no real data (the report is REAL-OR-HIDDEN — never a fabricated sample).
 */
export function SafetyRecallsCard({ report }: { report: SafetyReport | null }) {
  if (!report) return null;
  const { recalls, ratings } = report;

  return (
    <section className="rounded-2xl border border-edge bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Safety &amp; recalls</h2>
        <span className="text-xs text-slate">Source: NHTSA</span>
      </div>

      {/* Recalls */}
      <div className="mt-4">
        {recalls.length > 0 ? (
          <div className="rounded-xl border border-orange/30 bg-orange-soft px-4 py-3">
            <p className="text-sm font-bold text-orange">
              {recalls.length} safety recall{recalls.length === 1 ? "" : "s"} on record for this year, make &amp; model
            </p>
            <ul className="mt-2 space-y-2">
              {recalls.slice(0, MAX_RECALLS).map((r, i) => (
                <li key={r.campaignId || i} className="text-sm text-ink">
                  <span className="font-semibold">{r.component || "Recall"}</span>
                  {r.campaignId ? (
                    <span className="ml-1.5 font-mono text-xs text-slate">({r.campaignId})</span>
                  ) : null}
                  {r.consequence || r.summary ? (
                    <span className="mt-0.5 block text-slate">{r.consequence || r.summary}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {recalls.length > MAX_RECALLS && (
              <p className="mt-2 text-xs font-semibold text-slate">
                +{recalls.length - MAX_RECALLS} more — look up the VIN at nhtsa.gov/recalls
              </p>
            )}
            <p className="mt-2 text-xs text-slate">
              These are recall campaigns for this year/make/model — some may already be fixed on this
              specific car. Ask the seller for the VIN and confirm each recall is completed before you buy.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-green/30 bg-green-soft px-4 py-3 text-sm text-green-dark">
            No safety recalls on record with NHTSA for this year, make, and model.
          </div>
        )}
      </div>

      {/* Crash-test ratings */}
      {ratings && hasAnyRating(ratings) && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate">
              NHTSA crash-test ratings
            </p>
            {ratings.overall != null && (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-navy">
                Overall <Stars value={ratings.overall} />
              </span>
            )}
          </div>
          <div className="mt-2">
            <RatingRow label="Frontal crash" value={ratings.frontCrash} />
            <RatingRow label="Side crash" value={ratings.sideCrash} />
            <RatingRow label="Rollover" value={ratings.rollover} />
          </div>
        </div>
      )}
    </section>
  );
}
