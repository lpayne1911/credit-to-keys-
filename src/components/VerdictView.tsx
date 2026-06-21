/**
 * Buyer-facing verdict display. Reused on the public verdict page and inside
 * the review console preview.
 *
 * Design rules enforced here:
 *  - Red/amber/green appear ONLY as verdict cues, never as buttons.
 *  - Every estimate shows a confidence level and a RANGE — no false precision.
 */
import {
  type FairnessResult,
  type Verdict,
  type Confidence,
  type PriceRange,
  type Flag,
  type WarrantyAssessment,
  VERDICT_LABEL,
  WARRANTY_RATING_LABEL,
} from "@/lib/fairness-engine";

const VERDICT_STYLES: Record<
  Verdict,
  { bg: string; text: string; ring: string; dot: string }
> = {
  green: {
    bg: "bg-verdict-green/10",
    text: "text-verdict-green",
    ring: "ring-verdict-green/30",
    dot: "bg-verdict-green",
  },
  amber: {
    bg: "bg-verdict-amber/10",
    text: "text-verdict-amber",
    ring: "ring-verdict-amber/30",
    dot: "bg-verdict-amber",
  },
  red: {
    bg: "bg-verdict-red/10",
    text: "text-verdict-red",
    ring: "ring-verdict-red/30",
    dot: "bg-verdict-red",
  },
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  const label =
    level === "high"
      ? "High confidence"
      : level === "medium"
        ? "Medium confidence"
        : "Low confidence — limited data";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy/70">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          level === "high"
            ? "bg-verdict-green"
            : level === "medium"
              ? "bg-verdict-amber"
              : "bg-navy/40"
        }`}
      />
      {label}
    </span>
  );
}

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function RangePill({ range }: { range: PriceRange }) {
  return (
    <div className="rounded-lg bg-cream-100 px-3 py-2">
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-lg font-semibold text-navy">
          {money(range.low)}–{money(range.high)}
        </span>
        <ConfidenceBadge level={range.confidence} />
      </div>
      <p className="mt-1 text-xs text-navy/55">{range.basis}</p>
    </div>
  );
}

export function VerdictBadge({
  verdict,
  size = "lg",
}: {
  verdict: Verdict;
  size?: "lg" | "sm";
}) {
  const s = VERDICT_STYLES[verdict];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full ${s.bg} ${s.text} ring-1 ${s.ring} ${
        size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      } font-semibold`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

const SEVERITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
};

function FlagCard({ flag }: { flag: Flag }) {
  const isInfo = flag.severity === "info";
  return (
    <li
      className={`rounded-xl border p-4 ${
        isInfo
          ? "border-navy/10 bg-cream-100"
          : flag.severity === "high"
            ? "border-verdict-red/25 bg-verdict-red/5"
            : flag.severity === "medium"
              ? "border-verdict-amber/25 bg-verdict-amber/5"
              : "border-navy/15 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold text-navy">{flag.title}</h4>
        {!isInfo && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              flag.severity === "high"
                ? "bg-verdict-red/15 text-verdict-red"
                : flag.severity === "medium"
                  ? "bg-verdict-amber/15 text-verdict-amber"
                  : "bg-navy-50 text-navy/60"
            }`}
          >
            {flag.severity}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-navy/70">
        {flag.explanation}
      </p>
      {flag.estimatedImpact && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-navy/60">
            Estimated impact
          </p>
          <RangePill range={flag.estimatedImpact} />
        </div>
      )}
    </li>
  );
}

export function WarrantyCard({ warranty }: { warranty: WarrantyAssessment }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-navy">
          Extended warranty price
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            warranty.rating === "fair"
              ? "bg-verdict-green/10 text-verdict-green"
              : warranty.rating === "very_overpriced"
                ? "bg-verdict-red/10 text-verdict-red"
                : "bg-verdict-amber/10 text-verdict-amber"
          }`}
        >
          {WARRANTY_RATING_LABEL[warranty.rating]}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-navy/70">
        {warranty.explanation}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-navy/60">
            Estimated fair price range
          </p>
          <RangePill range={warranty.fairRange} />
        </div>
        {warranty.quotedPrice !== null && (
          <div>
            <p className="mb-1 text-xs font-medium text-navy/60">
              Price you were quoted
            </p>
            <div className="rounded-lg bg-cream-100 px-3 py-2">
              <span className="font-serif text-lg font-semibold text-navy">
                {money(warranty.quotedPrice)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function VerdictView({
  result,
  reviewedNote,
}: {
  result: FairnessResult;
  reviewedNote?: string | null;
}) {
  const s = VERDICT_STYLES[result.overallVerdict];
  const sortedFlags = [...result.flags].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );
  const realFlags = sortedFlags.filter(
    (f) => f.type !== "missing_info" && f.type !== "info",
  );
  const infoFlags = sortedFlags.filter(
    (f) => f.type === "missing_info" || f.type === "info",
  );

  return (
    <div className="space-y-6">
      {/* Overall verdict */}
      <div className={`rounded-2xl ${s.bg} ring-1 ${s.ring} p-6`}>
        <div className="flex flex-wrap items-center gap-3">
          <VerdictBadge verdict={result.overallVerdict} />
          <ConfidenceBadge level={result.confidence} />
        </div>
        <h2 className={`mt-3 font-serif text-2xl font-semibold ${s.text}`}>
          {result.headline}
        </h2>
        {reviewedNote && (
          <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-navy/75">
            <span className="font-semibold">Reviewed by a human advocate:</span>{" "}
            {reviewedNote}
          </p>
        )}
      </div>

      {/* Warranty */}
      {result.warranty && <WarrantyCard warranty={result.warranty} />}

      {/* Red flags */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-navy">
          {realFlags.length > 0
            ? `Red flags we found (${realFlags.length})`
            : "Red flags"}
        </h3>
        {realFlags.length > 0 ? (
          <ul className="space-y-3">
            {realFlags.map((f, i) => (
              <FlagCard key={i} flag={f} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-verdict-green/20 bg-verdict-green/5 p-4 text-sm text-navy/70">
            Nothing in what you entered tripped a red flag. That doesn&apos;t
            guarantee the deal is perfect — it means the numbers you gave us look
            reasonable against our estimates.
          </p>
        )}
      </div>

      {/* Honesty notes about missing data */}
      {infoFlags.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/50">
            To make this check stronger
          </h3>
          <ul className="space-y-2">
            {infoFlags.map((f, i) => (
              <li
                key={i}
                className="rounded-lg border border-navy/10 bg-cream-100 px-4 py-3 text-sm text-navy/65"
              >
                <span className="font-medium text-navy/80">{f.title}.</span>{" "}
                {f.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assumptions — transparency */}
      {result.assumptions.length > 0 && (
        <details className="rounded-xl border border-navy/10 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy/70">
            How we estimated this (assumptions)
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-navy/60">
            {result.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
