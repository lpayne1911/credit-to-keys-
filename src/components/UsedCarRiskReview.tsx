"use client";

/**
 * Used-Car Risk Report — PILOT preview flow.
 *
 * A client-side, no-account, no-payment intake that collects a used vehicle's
 * basics, title/history, and the buyer's concerns, then runs them through the
 * deterministic {@link reviewUsedCar} engine to produce a buyer-side RISK
 * PREVIEW. It never collects money, never uploads or stores anything, and never
 * makes a mechanical, title, safety, or legal determination.
 *
 * Mirrors the F&I pilot: local React state, large tappable choice cards, a
 * single safe action button, stale-preview handling, and an on-page result.
 */
import { useId, useState } from "react";
import { VinAutofill } from "@/components/vehicle/VinAutofill";
import type { DecodedVehicle } from "@/lib/vin";
import {
  reviewUsedCar,
  OVERALL_DISPLAY,
  RISK_LEVEL_DISPLAY,
  type UsedCarRiskInput,
  type UsedCarRiskResult,
  type RiskFlag,
  type Severity,
  type SignedStatus,
  type SellerType,
  type TitleStatus,
  type AccidentHistory,
  type UseHistory,
  type NumberOfOwners,
  type OpenRecalls,
  type CpoClaimed,
  type Concern,
} from "@/lib/used-car-risk";

/* ---------------------------------------------------------------------------
 *  Option data
 * ------------------------------------------------------------------------- */

const SIGNED_OPTIONS: { value: SignedStatus; label: string }[] = [
  { value: "not_yet", label: "Not yet" },
  { value: "already_signed", label: "Yes, already signed" },
  { value: "not_sure", label: "I'm not sure" },
];

const SELLER_OPTIONS: { value: SellerType; label: string }[] = [
  { value: "franchise_dealer", label: "Franchise dealer" },
  { value: "independent_dealer", label: "Independent dealer" },
  { value: "private_seller", label: "Private seller" },
  { value: "online_retailer", label: "Online retailer" },
  { value: "auction", label: "Auction" },
  { value: "not_sure", label: "Not sure" },
];

const TITLE_OPTIONS: { value: TitleStatus; label: string }[] = [
  { value: "clean", label: "Clean" },
  { value: "rebuilt", label: "Rebuilt" },
  { value: "salvage", label: "Salvage" },
  { value: "branded", label: "Branded" },
  { value: "lemon_buyback", label: "Lemon buyback" },
  { value: "not_sure", label: "Not sure" },
  { value: "unknown", label: "Don't know" },
];

const ACCIDENT_OPTIONS: { value: AccidentHistory; label: string }[] = [
  { value: "none_reported", label: "None reported" },
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "airbag_deployed", label: "Airbag deployed" },
  { value: "structural_damage", label: "Structural damage" },
  { value: "not_sure", label: "Not sure" },
  { value: "unknown", label: "Don't know" },
];

const USE_OPTIONS: { value: UseHistory; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "rental", label: "Rental" },
  { value: "fleet", label: "Fleet" },
  { value: "commercial", label: "Commercial" },
  { value: "rideshare", label: "Rideshare" },
  { value: "not_sure", label: "Not sure" },
  { value: "unknown", label: "Don't know" },
];

const OWNERS_OPTIONS: { value: NumberOfOwners; label: string }[] = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
  { value: "three_plus", label: "Three or more" },
  { value: "unknown", label: "Don't know" },
];

const RECALLS_OPTIONS: { value: OpenRecalls; label: string }[] = [
  { value: "none_known", label: "None known" },
  { value: "yes", label: "Yes, open recall" },
  { value: "not_checked", label: "Not checked" },
  { value: "unknown", label: "Don't know" },
];

const CPO_OPTIONS: { value: CpoClaimed; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];

const CONCERN_OPTIONS: { value: Concern; label: string }[] = [
  { value: "price_too_good", label: "Price seems too good to be true" },
  { value: "dealer_rushing", label: "Dealer is rushing me" },
  { value: "history_missing", label: "History report is missing" },
  { value: "title_unclear", label: "Title status is unclear" },
  { value: "prev_rental_fleet", label: "Vehicle was previously rental / fleet / commercial" },
  { value: "accident_worry", label: "Accident or damage history worries me" },
  { value: "mileage_inconsistent", label: "Mileage seems inconsistent" },
  { value: "no_full_otd", label: "Dealer won't provide a full out-the-door price" },
  { value: "inspection_not_needed", label: "Dealer says an inspection isn't needed" },
  { value: "already_signed_trapped", label: "I already signed and feel trapped" },
  { value: "need_seller_questions", label: "I need questions to ask the seller" },
  { value: "need_walkaway_triggers", label: "I need walk-away triggers" },
];

/* ---------------------------------------------------------------------------
 *  Form state
 * ------------------------------------------------------------------------- */

interface VehicleForm {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  mileage: string;
  askingPrice: string;
  outTheDoorPrice: string;
  purchaseState: string;
}

const BLANK_VEHICLE: VehicleForm = {
  vin: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  mileage: "",
  askingPrice: "",
  outTheDoorPrice: "",
  purchaseState: "",
};

// Tolerant numeric parse: strips $ , % and ignores negatives; never NaN/stray 0.
function num(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const SEVERITY_STYLES: Record<Severity, { wrap: string; badge: string }> = {
  high: {
    wrap: "border-verdict-red/25 bg-verdict-red/5",
    badge: "bg-verdict-red/15 text-verdict-red",
  },
  medium: {
    wrap: "border-verdict-amber/25 bg-verdict-amber/5",
    badge: "bg-verdict-amber/15 text-verdict-amber",
  },
  low: {
    wrap: "border-navy/15 bg-white",
    badge: "bg-navy-50 text-navy/60",
  },
};

/* ---------------------------------------------------------------------------
 *  Component
 * ------------------------------------------------------------------------- */

export function UsedCarRiskReview() {
  const [signed, setSigned] = useState<SignedStatus>("not_yet");
  const [sellerType, setSellerType] = useState<SellerType>("not_sure");
  const [veh, setVeh] = useState<VehicleForm>(BLANK_VEHICLE);
  const [titleStatus, setTitleStatus] = useState<TitleStatus>("unknown");
  const [accidentHistory, setAccidentHistory] = useState<AccidentHistory>("unknown");
  const [useHistory, setUseHistory] = useState<UseHistory>("unknown");
  const [numberOfOwners, setNumberOfOwners] = useState<NumberOfOwners>("unknown");
  const [openRecalls, setOpenRecalls] = useState<OpenRecalls>("unknown");
  const [cpoClaimed, setCpoClaimed] = useState<CpoClaimed>("not_sure");
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [result, setResult] = useState<UsedCarRiskResult | null>(null);
  const [stale, setStale] = useState(false);

  function flagStale() {
    setStale(true);
  }
  // Wrap each setter so any change after a preview marks it out of date.
  function wrap<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      flagStale();
    };
  }
  function setVehField(patch: Partial<VehicleForm>) {
    setVeh((v) => ({ ...v, ...patch }));
    flagStale();
  }
  // Prefill only the fields the buyer hasn't typed — never clobber their input.
  function applyVin(d: DecodedVehicle) {
    setVeh((v) => ({
      ...v,
      year: v.year || (d.year ? String(d.year) : ""),
      make: v.make || (d.make ?? ""),
      model: v.model || (d.model ?? ""),
      trim: v.trim || (d.trim ?? ""),
    }));
    flagStale();
  }
  function toggleConcern(c: Concern) {
    setConcerns((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
    flagStale();
  }
  function clearPreview() {
    setResult(null);
    setStale(false);
  }

  function generate() {
    const input: UsedCarRiskInput = {
      signed,
      vehicle: {
        year: num(veh.year),
        make: veh.make.trim() || null,
        model: veh.model.trim() || null,
        trim: veh.trim.trim() || null,
        mileage: num(veh.mileage),
        askingPrice: num(veh.askingPrice),
        outTheDoorPrice: num(veh.outTheDoorPrice),
        purchaseState: veh.purchaseState.trim() || null,
        sellerType,
      },
      status: {
        titleStatus,
        accidentHistory,
        useHistory,
        numberOfOwners,
        openRecalls,
        cpoClaimed,
      },
      concerns,
    };
    setResult(reviewUsedCar(input));
    setStale(false);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("risk-preview")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Pilot banner */}
      <div className="rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-3">
        <p className="text-sm leading-relaxed text-navy/75">
          <span className="font-semibold text-gold-dark">Pilot preview.</span>{" "}
          This is a free, buyer-side decision-support tool — not a paid report,
          not a mechanical, title, safety, or legal determination, and not legal,
          financial, tax, or insurance advice. It collects no payment, and nothing
          you enter is uploaded or saved — everything runs in your browser.
        </p>
      </div>

      {/* 1. Buyer status */}
      <SectionCard step={1} title="Your status">
        <CardChoice
          label="Have you already signed?"
          value={signed}
          options={SIGNED_OPTIONS}
          columns="grid-cols-1 sm:grid-cols-3"
          onChange={wrap(setSigned)}
        />
      </SectionCard>

      {/* 2. Vehicle basics */}
      <SectionCard step={2} title="Vehicle basics">
        <div className="mb-4">
          <VinAutofill
            value={veh.vin}
            onChange={(vin) => setVehField({ vin })}
            onDecoded={applyVin}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Year">
            <input className="field-input" inputMode="numeric" value={veh.year}
              onChange={(e) => setVehField({ year: e.target.value })} placeholder="2019" />
          </Field>
          <Field label="Make">
            <input className="field-input" value={veh.make}
              onChange={(e) => setVehField({ make: e.target.value })} placeholder="Toyota" />
          </Field>
          <Field label="Model">
            <input className="field-input" value={veh.model}
              onChange={(e) => setVehField({ model: e.target.value })} placeholder="Camry" />
          </Field>
          <Field label="Trim (optional)">
            <input className="field-input" value={veh.trim}
              onChange={(e) => setVehField({ trim: e.target.value })} placeholder="SE" />
          </Field>
          <Field label="Mileage">
            <input className="field-input" inputMode="numeric" value={veh.mileage}
              onChange={(e) => setVehField({ mileage: e.target.value })} placeholder="48,000" />
          </Field>
          <Field label="Purchase state">
            <input className="field-input" value={veh.purchaseState}
              onChange={(e) => setVehField({ purchaseState: e.target.value })} placeholder="MD" />
          </Field>
          <Field label="Asking price">
            <input className="field-input" inputMode="decimal" value={veh.askingPrice}
              onChange={(e) => setVehField({ askingPrice: e.target.value })} placeholder="$18,500" />
          </Field>
          <Field label="Out-the-door price (if known)">
            <input className="field-input" inputMode="decimal" value={veh.outTheDoorPrice}
              onChange={(e) => setVehField({ outTheDoorPrice: e.target.value })} placeholder="$20,100" />
          </Field>
        </div>
        <div className="mt-5">
          <CardChoice
            label="Who's selling it?"
            value={sellerType}
            options={SELLER_OPTIONS}
            columns="grid-cols-2 sm:grid-cols-3"
            onChange={wrap(setSellerType)}
          />
        </div>
        <p className="mt-3 text-xs text-navy/50">
          Everything here is optional — the more you fill in, the higher the
          confidence level on your preview.
        </p>
      </SectionCard>

      {/* 3. Vehicle history and title */}
      <SectionCard step={3} title="History & title">
        <div className="space-y-5">
          <CardChoice label="Title status" value={titleStatus} options={TITLE_OPTIONS}
            columns="grid-cols-2 sm:grid-cols-3" onChange={wrap(setTitleStatus)} />
          <CardChoice label="Accident / damage history" value={accidentHistory} options={ACCIDENT_OPTIONS}
            columns="grid-cols-2 sm:grid-cols-3" onChange={wrap(setAccidentHistory)} />
          <CardChoice label="How was it used?" value={useHistory} options={USE_OPTIONS}
            columns="grid-cols-2 sm:grid-cols-3" onChange={wrap(setUseHistory)} />
          <CardChoice label="Number of owners" value={numberOfOwners} options={OWNERS_OPTIONS}
            columns="grid-cols-2 sm:grid-cols-4" onChange={wrap(setNumberOfOwners)} />
          <CardChoice label="Open recalls" value={openRecalls} options={RECALLS_OPTIONS}
            columns="grid-cols-2 sm:grid-cols-4" onChange={wrap(setOpenRecalls)} />
          <CardChoice label="Certified pre-owned (CPO) claimed?" value={cpoClaimed} options={CPO_OPTIONS}
            columns="grid-cols-1 sm:grid-cols-3" onChange={wrap(setCpoClaimed)} />
        </div>
      </SectionCard>

      {/* 4. Buyer concerns */}
      <SectionCard step={4} title="What's worrying you?">
        <p className="-mt-1 mb-4 text-sm text-navy/60">
          Check anything that applies. This sharpens the preview and the script.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONCERN_OPTIONS.map((c) => {
            const on = concerns.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggleConcern(c.value)}
                className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 ${
                  on
                    ? "border-gold bg-gold/[0.07] text-navy"
                    : "border-navy/10 bg-white text-navy/75 hover:border-gold/50"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
                    on ? "border-gold bg-gold text-white" : "border-navy/25 text-transparent"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Generate */}
      <button
        type="button"
        onClick={generate}
        className="btn-primary w-full"
      >
        {result ? "Update risk preview" : "Generate risk preview"}
      </button>

      {/* 5. Risk preview */}
      <div id="risk-preview" className="scroll-mt-4 space-y-4">
        {result && stale && (
          <div className="rounded-xl border border-verdict-amber/30 bg-verdict-amber/5 px-4 py-3 text-sm text-navy/75">
            Your inputs changed since this preview was generated.{" "}
            <button type="button" onClick={generate}
              className="font-semibold text-gold-dark underline underline-offset-2">
              Update the preview
            </button>{" "}
            to refresh it.
          </div>
        )}
        {result && <RiskPreview result={result} />}
        {result && (
          <button type="button" onClick={clearPreview}
            className="text-sm font-semibold text-navy/55 underline underline-offset-2 hover:text-navy">
            Clear preview &amp; edit inputs
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 *  Result panel
 * ------------------------------------------------------------------------- */

function RiskPreview({ result }: { result: UsedCarRiskResult }) {
  return (
    <div className="space-y-5">
      {/* Overall card */}
      <div className="overflow-hidden rounded-2xl bg-navy text-cream ring-1 ring-navy/20">
        <div className="p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cream/55">
            Risk preview · buyer-side reference point
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-white">
            {result.overallDisplay}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/80">
            {result.overallSummary}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ConfidencePill level={result.confidence} />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cream/90">
              Risk level: {RISK_LEVEL_DISPLAY[result.riskLevel]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cream/90">
              Risk score: {result.riskScore}
            </span>
          </div>
        </div>
      </div>

      {/* Risk flags */}
      {result.riskFlags.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-navy">Risk flags</h3>
          {result.riskFlags.map((f, i) => (
            <RiskFlagCard key={i} flag={f} />
          ))}
        </div>
      )}

      <Panel title="Inspection priorities">
        <Bullets items={result.inspectionPriorities} />
      </Panel>

      <Panel title="Questions to ask the seller">
        <Bullets items={result.sellerQuestions} />
      </Panel>

      <Panel title="Documents to gather">
        <Bullets items={result.documentChecklist} />
      </Panel>

      <Panel title="Next steps">
        <ol className="space-y-2">
          {result.nextSteps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-navy/75">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold-dark">
                {i + 1}
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </Panel>

      {/* Script */}
      <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
          Script to use
        </p>
        <p className="mt-1.5 font-serif text-[15px] italic leading-relaxed text-navy/80">
          “{result.suggestedScript}”
        </p>
      </div>

      {/* Compliance reminder */}
      <div className="rounded-xl border border-navy/10 bg-cream-100 px-4 py-3">
        <p className="text-xs leading-relaxed text-navy/60">
          <span className="font-semibold text-navy/75">
            This is a buyer-side reference point, not a determination.
          </span>{" "}
          It&apos;s a free pilot preview that collects no payment and is not the
          full paid Used-Car Risk Report. It is decision support — not legal,
          financial, tax, insurance, title, mechanical, or safety advice. It does
          not determine a vehicle&apos;s condition, reliability, or title status,
          and it does not guarantee a refund, savings, or any outcome. Confirm
          everything with the title document, a vehicle history report, an
          independent inspection, your lender or insurer, the DMV, or a qualified
          professional. We&apos;re strictly buyer-side: no commissions, no
          kickbacks, and we never steer you toward any dealer, lender, or seller.
        </p>
      </div>
    </div>
  );
}

function RiskFlagCard({ flag }: { flag: RiskFlag }) {
  const style = SEVERITY_STYLES[flag.severity];
  return (
    <div className={`rounded-2xl border p-5 ${style.wrap}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="min-w-0 break-words font-serif text-base font-semibold text-navy">
          {flag.title}
        </h4>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style.badge}`}>
          {flag.severity}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-navy/75">{flag.explanation}</p>
      <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-navy/75">
        <span className="font-semibold text-navy/80">Ask:</span> {flag.buyerQuestion}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 *  Shared UI primitives
 * ------------------------------------------------------------------------- */

function SectionCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 font-serif text-base font-semibold text-gold-dark">
          {step}
        </span>
        <h2 className="font-serif text-xl font-semibold text-navy">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function CardChoice<T extends string>({
  label,
  value,
  options,
  columns,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  columns?: string;
  onChange: (v: T) => void;
}) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId}>
      <span id={labelId} className="field-label">
        {label}
      </span>
      <div className={`grid gap-2 ${columns ?? "grid-cols-2 sm:grid-cols-3"}`}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`choice justify-between ${on ? "choice--on" : ""}`}
            >
              <span className="text-sm font-semibold text-navy">{o.label}</span>
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  on ? "border-gold bg-gold text-white" : "border-navy/25 text-transparent"
                }`}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfidencePill({ level }: { level: "low" | "medium" | "high" }) {
  const label =
    level === "high"
      ? "High confidence"
      : level === "medium"
        ? "Medium confidence"
        : "Low confidence — add more detail";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cream/90">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          level === "high"
            ? "bg-verdict-green"
            : level === "medium"
              ? "bg-verdict-amber"
              : "bg-cream/50"
        }`}
      />
      {label}
    </span>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-card">
      <h3 className="font-serif text-lg font-semibold text-navy">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy/75">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
