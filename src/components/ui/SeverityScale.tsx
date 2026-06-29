/**
 * The verdict severity scale, in decision-support language. The buyer makes the
 * final call — so every tier describes what the SIGNALS say ("push back first",
 * "verify first"), never an order ("sign it"). Used under the Red Flag Matrix and
 * kept visually consistent with the verdict colors on real results.
 */
const TIERS = [
  {
    label: "Looks fair",
    sub: "Low concern",
    dot: "bg-flag-green",
    band: "from-flag-green/80 to-flag-green",
    text: "text-flag-green",
  },
  {
    label: "Verify first",
    sub: "Some items need confirmation",
    dot: "bg-verdict-amber",
    band: "from-verdict-amber/70 to-verdict-amber",
    text: "text-verdict-amber",
  },
  {
    label: "Push back first",
    sub: "Negotiate or clarify before signing",
    dot: "bg-flag-orange",
    band: "from-flag-orange/80 to-flag-orange",
    text: "text-flag-orange",
  },
  {
    label: "Do not sign yet",
    sub: "Serious unresolved concerns",
    dot: "bg-flag-red",
    band: "from-flag-red/80 to-flag-red",
    text: "text-flag-red",
  },
  {
    label: "Walk-away signal",
    sub: "Consider leaving unless corrected",
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
      <div className="grid gap-px sm:grid-cols-5">
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
      <p className="px-3 pb-1 pt-1.5 text-xs text-slate">
        Every check ends on a plain-English call. You always make the final
        decision.
      </p>
    </div>
  );
}
