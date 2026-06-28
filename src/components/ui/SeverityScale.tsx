/**
 * The four-tier verdict severity scale: Green → Yellow → Red → Black.
 * Used under the Red Flag Matrix. Visually prominent, modern, and consistent
 * with the verdict colors used on real results.
 */
const TIERS = [
  {
    label: "Looks fair",
    sub: "Green · sign it",
    dot: "bg-flag-green",
    band: "from-flag-green/80 to-flag-green",
    text: "text-flag-green",
  },
  {
    label: "Negotiate first",
    sub: "Yellow · push back",
    dot: "bg-verdict-amber",
    band: "from-verdict-amber/80 to-verdict-amber",
    text: "text-verdict-amber",
  },
  {
    label: "Don't sign yet",
    sub: "Red · high risk",
    dot: "bg-flag-red",
    band: "from-flag-red/80 to-flag-red",
    text: "text-flag-red",
  },
  {
    label: "Walk away",
    sub: "Black · serious concern",
    dot: "bg-navy-950",
    band: "from-navy-900 to-navy-950",
    text: "text-navy-950",
  },
];

export function SeverityScale() {
  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white/70 p-1.5 shadow-card backdrop-blur">
      {/* Continuous gradient track to read as a single scale. */}
      <div className="flex h-2 overflow-hidden rounded-full">
        {TIERS.map((t) => (
          <div key={t.label} className={`flex-1 bg-gradient-to-r ${t.band}`} />
        ))}
      </div>
      <div className="grid gap-px sm:grid-cols-4">
        {TIERS.map((t) => (
          <div
            key={t.label}
            className="flex items-start gap-2.5 rounded-xl px-3 py-3 transition hover:bg-cream-100"
          >
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${t.dot}`} />
            <div>
              <p className={`text-sm font-bold ${t.text}`}>{t.label}</p>
              <p className="text-xs text-slate">{t.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
