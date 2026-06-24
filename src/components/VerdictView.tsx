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
import { compareTerm } from "@/lib/loan-math";

/** The loan numbers needed to show what financing really costs over the term. */
export interface LoanInputs {
  vehiclePrice?: number | null;
  downPayment?: number | null;
  apr?: number | null;
  termMonths?: number | null;
  fees?: { amount: number }[] | null;
  warrantyPrice?: number | null;
}

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
  black: {
    bg: "bg-navy-900/10",
    text: "text-navy-900",
    ring: "ring-navy-900/40",
    dot: "bg-navy-900",
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

/**
 * KBB-style range gauge: a red→amber→green track with a marker sitting in the
 * verdict's zone. Gives the result the instant, confident "where do I land?"
 * read that a value report does.
 */
export function VerdictGauge({ score }: { score: number }) {
  const pos = Math.max(4, Math.min(96, score));
  return (
    <div className="mt-5">
      <div className="relative">
        <div className="h-3 rounded-full bg-gradient-to-r from-verdict-red via-verdict-amber to-verdict-green" />
        <div
          className="absolute -top-2 h-7 w-7 -translate-x-1/2 rounded-full border-[3px] border-white bg-navy shadow-card"
          style={{ left: `${pos}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-2.5 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-navy/45">
        <span>Walk away</span>
        <span>Caution</span>
        <span>Looks fair</span>
      </div>
    </div>
  );
}

/**
 * A single 0–100 "Deal Score" — the KBB-style headline number. Starts at 100
 * and docks points per real red flag by severity. Presentation-only (kept out
 * of the engine so its tests stay stable); the gauge marker is driven by it.
 */
export function dealScore(result: FairnessResult): number {
  let score = 100;
  for (const f of result.flags) {
    if (f.type === "missing_info" || f.type === "info") continue;
    score -=
      f.severity === "high" ? 22 : f.severity === "medium" ? 11 : f.severity === "low" ? 5 : 0;
  }
  return Math.max(8, Math.min(100, Math.round(score)));
}

/** Sum the dollar impact across all flags that carry an estimate. */
function totalImpact(result: FairnessResult): { low: number; high: number } | null {
  let low = 0;
  let high = 0;
  let any = false;
  for (const f of result.flags) {
    if (f.estimatedImpact) {
      low += f.estimatedImpact.low;
      high += f.estimatedImpact.high;
      any = true;
    }
  }
  return any && high > 0 ? { low, high } : null;
}

/**
 * The big "value-forward" number a KBB-style report leads with: the money we
 * estimate is on the table across every red flag. Honest range, never a promise.
 */
export function SavingsHero({ result }: { result: FairnessResult }) {
  const impact = totalImpact(result);
  if (!impact) {
    return (
      <div className="border-t border-navy/10 bg-white/55 px-6 py-4 text-sm text-navy/65">
        Nothing obvious to claw back — the numbers you entered look reasonable
        against our estimates.
      </div>
    );
  }
  return (
    <div className="border-t border-navy/10 bg-white/60 px-6 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/55">
        Potential savings we spotted
      </p>
      <p className="mt-0.5 font-serif text-3xl font-bold text-gold-dark">
        {money(impact.low)}–{money(impact.high)}
      </p>
      <p className="mt-1 text-sm text-navy/60">
        If you push back on the flags below. An estimate, not a guarantee.
      </p>
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

export function FlagCard({ flag }: { flag: Flag }) {
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

/**
 * "What this loan really costs" — turns the deal's numbers into total interest
 * over the term, and shows the trade-off of a shorter loan. The finance office
 * leads with the monthly payment; this panel leads with the total, where long
 * terms quietly hide their cost. Presentation-only (kept out of the engine so
 * its tests stay stable), driven by the tested `compareTerm` helper.
 */
export function LoanCostPanel({ loan }: { loan: LoanInputs }) {
  const price = loan.vehiclePrice ?? 0;
  const down = loan.downPayment ?? 0;
  const apr = loan.apr ?? 0;
  const term = loan.termMonths ?? 0;
  const feeTotal = (loan.fees ?? []).reduce((s, f) => s + (f.amount || 0), 0);
  const financed = Math.max(0, price - down) + feeTotal + (loan.warrantyPrice ?? 0);

  // Only meaningful with a real interest rate, a term, and something financed.
  if (!(apr > 0) || !(term > 0) || !(financed > 0)) return null;
  const cmp = compareTerm(financed, apr, term);
  if (!cmp) return null;

  const showShorter = cmp.shorter !== null && cmp.interestSaved >= 100;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-navy">
        What this loan really costs
      </h3>
      <p className="mt-1 text-sm text-navy/60">
        The desk leads with the monthly payment. Here&apos;s the total — where a
        longer loan quietly hides its cost.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Est. amount financed" value={money(financed)} />
        <Stat label={`Payment (${term} mo)`} value={`${money(cmp.current.monthlyPayment)}/mo`} />
        <Stat label="Total interest" value={money(cmp.current.totalInterest)} accent />
        <Stat
          label="Total of payments"
          value={money(cmp.current.monthlyPayment * term)}
        />
      </div>

      {showShorter && (
        <div className="mt-4 rounded-xl border border-verdict-green/25 bg-verdict-green/5 p-4">
          <p className="text-sm text-navy/75">
            Paying it off in <span className="font-semibold">{cmp.shorter!.termMonths} months</span>{" "}
            instead would run about{" "}
            <span className="font-semibold">{money(cmp.extraPerMonth)}/mo</span> more, but
            save roughly{" "}
            <span className="font-semibold text-verdict-green">
              {money(cmp.interestSaved)}
            </span>{" "}
            in interest over the life of the loan.
          </p>
        </div>
      )}

      <p className="mt-3 text-xs text-navy/50">
        Estimated from the numbers you entered. Sales tax and any fees you
        didn&apos;t list aren&apos;t included, so your real total may be higher.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-cream-100 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-navy/50">
        {label}
      </p>
      <p
        className={`mt-0.5 font-serif text-lg font-semibold ${
          accent ? "text-gold-dark" : "text-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function VerdictView({
  result,
  reviewedNote,
  vehicle,
  loan,
}: {
  result: FairnessResult;
  reviewedNote?: string | null;
  vehicle?: { year?: number | null; make?: string | null; model?: string | null };
  loan?: LoanInputs | null;
}) {
  const s = VERDICT_STYLES[result.overallVerdict];
  // A "walk away" verdict pins the score to the bottom regardless of how many
  // individual flags fired — the call is categorical, not additive.
  const score = result.overallVerdict === "black" ? 3 : dealScore(result);
  const vehicleName = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
    : "";
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
      {/* Overall verdict — the KBB-style "report" header */}
      <div className={`overflow-hidden rounded-2xl ${s.bg} ring-1 ${s.ring}`}>
        <div className="p-6">
          {vehicleName && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy/45">
              {vehicleName}
            </p>
          )}
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-navy/50">
                Deal score
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`font-serif text-5xl font-bold leading-none ${s.text}`}>
                  {score}
                </span>
                <span className="text-lg font-semibold text-navy/35">/100</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <VerdictBadge verdict={result.overallVerdict} />
              <ConfidenceBadge level={result.confidence} />
            </div>
          </div>
          <VerdictGauge score={score} />
          <h2 className={`mt-5 font-serif text-2xl font-semibold ${s.text}`}>
            {result.headline}
          </h2>
          {reviewedNote && (
            <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-navy/75">
              <span className="font-semibold">Reviewed by a human advocate:</span>{" "}
              {reviewedNote}
            </p>
          )}
        </div>
        <SavingsHero result={result} />
      </div>

      {/* Warranty */}
      {result.warranty && <WarrantyCard warranty={result.warranty} />}

      {/* True cost of the loan */}
      {loan && <LoanCostPanel loan={loan} />}

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
