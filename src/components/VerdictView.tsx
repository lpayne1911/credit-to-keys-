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
  TYPICAL_TAX_TITLE_PCT,
} from "@/lib/fairness-engine";
import { compareTerm, paymentBreakdown } from "@/lib/loan-math";
import { savingsRange, savingsBreakdown } from "@/lib/verdict-summary";
import { NegotiationScriptCard } from "@/components/NegotiationScriptCard";
import type {
  FeeRiskAssessment,
  FeeRiskSeverity,
  FeeCategory,
} from "@/lib/fee-classifier";
import {
  categorizeDeal,
  partitionVerdictFlags,
  type DealCategory,
  type CategoryLevel,
} from "@/lib/deal-categories";
import { AnimatedScore } from "@/components/ui/AnimatedScore";
import { RiskBadge, type RiskTone } from "@/components/ui/RiskBadge";
import type { DocFeeFinding } from "@/lib/intelligence/docFeeRules";

/** Map a flag severity to a RiskBadge tone for the summary chip row. */
function severityTone(severity: string): RiskTone {
  return severity === "high"
    ? "danger"
    : severity === "medium"
      ? "warning"
      : "neutral";
}

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
    if (f.severity === "info") continue; // info notes (incl. legit gov fees) don't dock
    score -=
      f.severity === "high" ? 22 : f.severity === "medium" ? 11 : f.severity === "low" ? 5 : 0;
  }
  return Math.max(8, Math.min(100, Math.round(score)));
}

/**
 * The big "value-forward" number a KBB-style report leads with: the money we
 * estimate is on the table across every red flag. Honest range, never a promise.
 * Uses {@link savingsRange}, which excludes pre-existing debt (negative equity)
 * so the headline reflects only what the buyer can actually claw back.
 */
export function SavingsHero({ result }: { result: FairnessResult }) {
  const impact = savingsRange(result);
  if (!impact) {
    return (
      <div className="border-t border-navy/10 bg-white/55 px-6 py-4 text-sm text-navy/65">
        Nothing obvious to claw back — the numbers you entered look reasonable
        against our estimates.
      </div>
    );
  }
  const lines = savingsBreakdown(result);
  return (
    <div className="border-t border-navy/10 bg-white/60 px-6 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/55">
        Potential savings we spotted
      </p>
      <p className="mt-0.5 font-serif text-3xl font-bold text-gold-dark">
        {money(impact.low)}–{money(impact.high)}
      </p>
      {lines.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {lines.map((l, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-navy/70">{l.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-navy/80">
                {money(l.low)}–{money(l.high)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-sm text-navy/60">
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
      {flag.docFee && <DocFeeRulePanel finding={flag.docFee} />}
    </li>
  );
}

/**
 * State doc-fee intelligence attached to a documentation/processing-fee flag.
 * Shows the verified state rule status, what it means for the buyer, the action
 * to take, and the cited source — with confidence and limitations.
 */
function DocFeeRulePanel({ finding }: { finding: DocFeeFinding }) {
  const STATUS_LABEL: Record<string, string> = {
    within_cap: "Within known cap",
    over_cap: "Above known cap",
    uncapped_dealer_controlled: "No state cap",
    disclosure_only: "Disclosure-regulated",
    needs_research: "State rule not researched yet",
    unverified_rule: "Possible cap — not verified yet",
    unknown_rule: "State cap unverified (sources conflict)",
    state_missing: "State needed to verify",
    not_doc_fee: "",
  };
  const tone =
    finding.status === "over_cap"
      ? "border-verdict-red/30 bg-verdict-red/5"
      : finding.status === "within_cap"
        ? "border-verdict-green/25 bg-verdict-green/5"
        : "border-navy/15 bg-white";
  return (
    <div className={`mt-3 rounded-lg border ${tone} p-3`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-navy/55">
          State doc-fee rule{finding.jurisdiction ? ` · ${finding.jurisdiction}` : ""}
        </p>
        <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy/60">
          {STATUS_LABEL[finding.status] || finding.status}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-navy/75">
        {finding.explanation}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-navy/75">
        <span className="font-semibold text-gold-dark">What to do: </span>
        {finding.action}
      </p>
      {finding.source?.url && (
        <p className="mt-2 text-xs text-navy/50">
          Source:{" "}
          <a
            href={finding.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gold-dark underline decoration-dotted underline-offset-2"
          >
            {finding.source.title ?? finding.source.url}
          </a>
          {finding.source.type ? ` (${finding.source.type.replace(/_/g, " ")})` : ""}
        </p>
      )}
      <p className="mt-1 text-[11px] text-navy/45">
        Confidence: {finding.confidence} · {finding.verified ? "verified source" : "unverified"}
        {finding.humanReviewRecommended ? " · human review recommended" : ""}
        {finding.limitations ? ` — ${finding.limitations}` : ""}
      </p>
    </div>
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

const FEE_SEVERITY_STYLES: Record<
  FeeRiskSeverity,
  { wrap: string; badge: string; label: string }
> = {
  critical: {
    wrap: "border-verdict-red/25 bg-verdict-red/5",
    badge: "bg-verdict-red/15 text-verdict-red",
    label: "Review",
  },
  warning: {
    wrap: "border-verdict-amber/25 bg-verdict-amber/5",
    badge: "bg-verdict-amber/15 text-verdict-amber",
    label: "Question",
  },
  info: {
    wrap: "border-navy/15 bg-white",
    badge: "bg-navy-50 text-navy/60",
    label: "Check",
  },
};

const FEE_CATEGORY_LABEL: Record<FeeCategory, string> = {
  doc_fee: "Doc fee",
  dealer_addon: "Dealer add-on",
  government_fee: "Government",
  tax: "Tax",
  registration: "Registration",
  title: "Title",
  junk_fee: "Junk fee",
  unknown: "Unclassified",
};

/**
 * Buyer-side fee-risk panel — state-aware classification of the fee lines, with
 * compliance-safe guidance (consumer guidance, not legal advice). Presentation
 * only; it never affects the verdict/score. Mirrors the other detail cards.
 */
const CATEGORY_LEVEL_STYLES: Record<
  CategoryLevel,
  { dot: string; pill: string; label: string }
> = {
  looks_clear: {
    dot: "bg-verdict-green",
    pill: "bg-verdict-green/10 text-verdict-green",
    label: "Looks clear",
  },
  worth_a_look: {
    dot: "bg-verdict-amber",
    pill: "bg-verdict-amber/10 text-verdict-amber",
    label: "Worth a look",
  },
  high_risk: {
    dot: "bg-verdict-red",
    pill: "bg-verdict-red/10 text-verdict-red",
    label: "High risk",
  },
  needs_info: {
    dot: "bg-navy/30",
    pill: "bg-navy-50 text-navy/55",
    label: "Needs info",
  },
};

/**
 * At-a-glance "Deal Score" breakdown — five buyer-facing categories derived
 * (presentation only) from the engine flags + fee-risk channel. It summarizes
 * what's below; it never changes the verdict or score.
 */
export function CategoryScorecard({
  result,
  feeRisk,
}: {
  result: FairnessResult;
  feeRisk?: FeeRiskAssessment | null;
}) {
  const categories: DealCategory[] = categorizeDeal(result, feeRisk);
  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-navy">Deal breakdown</h3>
        <ConfidenceBadge level={result.confidence} />
      </div>
      <p className="mt-1 text-sm text-navy/55">
        Based on what you entered — a buyer-side read, not legal advice.
      </p>
      <ul className="mt-4 divide-y divide-navy/5">
        {categories.map((c) => {
          const st = CATEGORY_LEVEL_STYLES[c.level];
          return (
            <li key={c.key} className="flex items-start gap-3 py-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-navy">{c.label}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${st.pill}`}>
                    {st.label}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-navy/65">{c.note}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FeeSection({
  feeRisk,
  feeFlags,
}: {
  feeRisk?: FeeRiskAssessment | null;
  feeFlags: Flag[];
}) {
  const hasFlags = feeFlags.length > 0;
  // When a flag already carries the engine's SOURCED state doc-fee rule
  // (DocFeeRulePanel), that verified finding supersedes the registry's parallel
  // doc-fee note — so the same cap finding never shows twice.
  const hasSourcedDocFee = feeFlags.some((f) => f.docFee);
  // The engine's fee/add-on flags already say "this looks padded." Keep the
  // state-cap critical and the tax/title sanity note (unique context), but drop
  // the generic "padded fee" warnings when a flag already covers it — so fees
  // live in ONE place without repeating themselves.
  const messages = (feeRisk?.messages ?? []).filter((m) => {
    if (hasSourcedDocFee && /doc fee|processing fee/i.test(m.title)) return false;
    return (
      m.severity === "critical" ||
      m.severity === "info" ||
      (m.severity === "warning" && !hasFlags)
    );
  });
  const lineItems = feeRisk?.lineItems ?? [];
  if (!hasFlags && messages.length === 0 && lineItems.length === 0) return null;

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-navy">Fees &amp; add-ons</h3>
        {feeRisk && <ConfidenceBadge level={feeRisk.ruleConfidence} />}
      </div>
      <p className="mt-1 text-sm text-navy/60">
        Every fee and add-on on your worksheet, in one place
        {feeRisk?.state ? ` — checked against ${feeRisk.state}'s known rules` : ""}. A
        buyer-side read, not legal advice.
      </p>
      {(feeRisk?.ruleStatus === "needs_research" || feeRisk?.ruleStatus === "unknown") && (
        <p className="mt-2 text-xs text-navy/50">
          We haven&apos;t verified this state&apos;s doc-fee cap yet — treat the fees
          here as review items to confirm in writing, not a legal conclusion.
        </p>
      )}

      {lineItems.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {lineItems.map((li, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1 text-xs text-navy/70"
            >
              <span className="font-medium text-navy/80">{li.label}</span>
              <span className="text-navy/45">· {FEE_CATEGORY_LABEL[li.category]}</span>
            </span>
          ))}
        </div>
      )}

      {hasFlags && (
        <ul className="mt-4 space-y-3">
          {feeFlags.map((f, i) => (
            <FlagCard key={i} flag={f} />
          ))}
        </ul>
      )}

      {messages.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {messages.map((m, i) => {
            const st = FEE_SEVERITY_STYLES[m.severity];
            return (
              <li key={i} className={`rounded-xl border p-4 ${st.wrap}`}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-semibold text-navy">{m.title}</h4>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${st.badge}`}
                  >
                    {st.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-navy/70">{m.message}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * "What this loan really costs" — turns the deal's numbers into total interest
 * over the term, and shows the trade-off of a shorter loan. The finance office
 * leads with the monthly payment; this panel leads with the total, where long
 * terms quietly hide their cost. Presentation-only (kept out of the engine so
 * its tests stay stable), driven by the tested `compareTerm` helper.
 *
 * The headline figures finance only what the buyer entered (sale price − down +
 * fees + warranty); taxes aren't in them. Rather than hand-wave that, we
 * quantify it: an estimated tax/title amount and the extra it adds if financed.
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

  // Quantify the tax/title that the headline figures leave out.
  const round25 = (n: number) => Math.round(n / 25) * 25;
  const taxEstimate = round25(price * TYPICAL_TAX_TITLE_PCT);
  const extraIfTaxFinanced =
    taxEstimate > 0
      ? round25(
          paymentBreakdown(financed + taxEstimate, apr, term).totalPaid -
            cmp.current.monthlyPayment * term,
        )
      : 0;

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
        These figures finance the sale price
        {feeTotal > 0 ? " and the fees listed above" : ""} only.
        {taxEstimate > 0 && (
          <>
            {" "}
            If you also finance taxes &amp; registration — roughly{" "}
            {money(taxEstimate)} in many states — expect about{" "}
            <span className="font-medium text-navy/70">
              {money(extraIfTaxFinanced)}
            </span>{" "}
            more over the loan.
          </>
        )}
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
  feeRisk,
  expandDetails = false,
}: {
  result: FairnessResult;
  reviewedNote?: string | null;
  vehicle?: { year?: number | null; make?: string | null; model?: string | null };
  loan?: LoanInputs | null;
  feeRisk?: FeeRiskAssessment | null;
  /** When true, the red-flags / breakdown disclosure renders open (used by the
   *  public sample report so the full evidence is visible without a tap). */
  expandDetails?: boolean;
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
  // Partition by TYPE so fees live in their own "Fees & add-ons" section and the
  // price/payment flags stay in the main list. `missing_info`/`info` types are
  // surfaced separately as non-verdict notes (never shown as red flags).
  const { general: realFlags, fees: feeFlags } = partitionVerdictFlags(sortedFlags);
  const issueCount = realFlags.length + feeFlags.length;
  const infoFlags = sortedFlags.filter(
    (f) => f.type === "missing_info" || f.type === "info",
  );

  return (
    <div className="space-y-6">
      {/* Overall verdict — the premium "Deal report" card, matching the
          landing-page mockup: window chrome, animated score, gauge, risk
          chips, and the value-forward savings number. */}
      <div className="overflow-hidden rounded-2xl glass">
        {/* verdict-color accent line */}
        <div className={`h-1.5 w-full ${s.dot}`} />
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-navy/10 bg-white/50 px-5 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-flag-red/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-verdict-amber/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-flag-green/80" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
            Deal report
          </span>
        </div>

        <div className="p-6">
          {vehicleName && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate">
              {vehicleName}
            </p>
          )}
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                Deal score
              </span>
              <div className="flex items-baseline gap-1">
                <AnimatedScore
                  value={score}
                  className={`font-serif text-6xl font-bold leading-none tabular-nums ${s.text}`}
                />
                <span className="text-xl font-semibold text-navy/35">/100</span>
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

          {/* Risk-flag chips — the at-a-glance summary, with the evidence one
              tap away in the breakdown below. */}
          {realFlags.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                Risk flags
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {realFlags.slice(0, 6).map((f, i) => (
                  <RiskBadge key={i} tone={severityTone(f.severity)} wrap>
                    {f.title}
                  </RiskBadge>
                ))}
              </div>
            </div>
          )}

          {reviewedNote && (
            <p className="mt-4 rounded-lg bg-white/70 px-3 py-2 text-sm text-navy/75">
              <span className="font-semibold">Reviewed by a human advocate:</span>{" "}
              {reviewedNote}
            </p>
          )}
        </div>
        <SavingsHero result={result} />
      </div>

      {/* Primary action — the words to use, right under the verdict. */}
      {/* At-a-glance category breakdown, above the detailed disclosure. */}
      <CategoryScorecard result={result} feeRisk={feeRisk} />

      <NegotiationScriptCard result={result} offeredApr={loan?.apr ?? null} />

      {/* Depth on demand — the detailed red flags, warranty, loan cost, gaps,
          and assumptions all live one tap away so the verdict + script lead.
          The script already enumerates every issue as an action; this is the
          evidence and the math behind it. */}
      <details
        open={expandDetails}
        className="group overflow-hidden rounded-2xl border border-navy/10 bg-white"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-navy hover:bg-cream-100">
          <span>
            {issueCount > 0
              ? `See all ${issueCount} flag${issueCount > 1 ? "s" : ""} & the full breakdown`
              : "See the full breakdown"}
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="text-navy/40 transition-transform group-open:rotate-180"
            aria-hidden
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <div className="space-y-6 border-t border-navy/10 p-5">
          {/* Red flags — the detailed evidence behind each talking point. */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-navy">
              {realFlags.length > 0
                ? `Price & payment flags (${realFlags.length})`
                : "Price & payment"}
            </h3>
            {realFlags.length > 0 ? (
              <ul className="space-y-3">
                {realFlags.map((f, i) => (
                  <FlagCard key={i} flag={f} />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-verdict-green/20 bg-verdict-green/5 p-4 text-sm text-navy/70">
                Nothing in your price, payment, or trade tripped a flag. That
                doesn&apos;t guarantee the deal is perfect — it means those
                numbers look reasonable against our estimates. Fees and add-ons
                are covered below.
              </p>
            )}
          </div>

          <FeeSection feeRisk={feeRisk} feeFlags={feeFlags} />
          {result.warranty && <WarrantyCard warranty={result.warranty} />}
          {loan && <LoanCostPanel loan={loan} />}

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

          {result.confidenceReasons && result.confidenceReasons.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
                Why we&apos;re {result.confidence} confidence
                <ConfidenceBadge level={result.confidence} />
              </h3>
              <ul className="list-disc space-y-1.5 pl-5 text-xs text-navy/65">
                {result.confidenceReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {result.assumptions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
                How we estimated this
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-xs text-navy/60">
                {result.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
