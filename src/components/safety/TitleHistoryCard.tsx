import type { TitleHistory } from "@/lib/sources/vinaudit/types";

function Context({ title }: { title: TitleHistory }) {
  const bits: string[] = [];
  if (title.titleRecordCount != null) {
    bits.push(`${title.titleRecordCount} title record${title.titleRecordCount === 1 ? "" : "s"}`);
  }
  if (title.owners != null) bits.push(`${title.owners} owner${title.owners === 1 ? "" : "s"}`);
  if (title.lastOdometer != null) bits.push(`last odometer ${title.lastOdometer.toLocaleString()} mi`);
  if (bits.length === 0) return null;
  return <p className="mt-2 text-xs text-slate">{bits.join(" · ")}</p>;
}

/**
 * NMVTIS title history for a VIN (via VinAudit). Returns null when there's no
 * data — REAL-OR-HIDDEN, never a fabricated sample. Branded / total-loss titles
 * render as a red warning; theft/odometer signals as an orange caution; a clean
 * VIN as a reassuring green state.
 */
export function TitleHistoryCard({ title }: { title: TitleHistory | null }) {
  if (!title) return null;

  const severe = title.branded || title.totalLoss;
  const caution = !severe && (title.theftRecord || title.odometerRollbackSuspected);

  const signals: string[] = [];
  if (title.totalLoss) signals.push("insurance total-loss record");
  if (title.theftRecord) signals.push("theft record");
  if (title.odometerRollbackSuspected) signals.push("possible odometer rollback");

  return (
    <section className="rounded-2xl border border-edge bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Title &amp; history</h2>
        <span className="text-xs text-slate">Source: NMVTIS · VinAudit</span>
      </div>

      <div className="mt-4">
        {severe ? (
          <div className="rounded-xl border border-red bg-red-soft px-4 py-3">
            <p className="text-sm font-bold text-red-dark">
              {title.branded ? "Branded title reported" : "Total-loss record reported"}
            </p>
            {title.brands.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {title.brands.map((b, i) => (
                  <li
                    key={`${b.label}-${i}`}
                    className="rounded-md bg-red px-2 py-0.5 text-xs font-semibold text-white"
                  >
                    {b.label}
                    {b.state ? ` · ${b.state}` : ""}
                  </li>
                ))}
              </ul>
            )}
            {signals.length > 0 && (
              <p className="mt-2 text-sm text-ink">Also on record: {signals.join(", ")}.</p>
            )}
            <p className="mt-2 text-xs text-slate">
              A branded or total-loss title is a major value and safety signal. Have the car inspected
              by an independent mechanic and price it well below a clean-title equivalent — or walk away.
            </p>
            <Context title={title} />
          </div>
        ) : caution ? (
          <div className="rounded-xl border border-orange/30 bg-orange-soft px-4 py-3">
            <p className="text-sm font-bold text-orange">Title signal worth checking</p>
            <p className="mt-1 text-sm text-ink">On record: {signals.join(", ")}.</p>
            <p className="mt-2 text-xs text-slate">
              Confirm the odometer and history with an independent inspection before you buy.
            </p>
            <Context title={title} />
          </div>
        ) : (
          <div className="rounded-xl border border-green/30 bg-green-soft px-4 py-3 text-sm text-green-dark">
            No title brands, total-loss, or theft records reported by NMVTIS for this VIN.
            <Context title={title} />
          </div>
        )}
      </div>
    </section>
  );
}
