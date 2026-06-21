"use client";

/**
 * Gamified, tap-first Deal Check.
 *
 * Design goals (from the product brief): "Quick smooth progress. No typing if
 * we can help it." So the whole intake is a short stepper of big tap targets,
 * sliders, and a tappable add-on gallery — almost zero keyboard. A progress bar
 * gives momentum, and the verdict is the reward at the end.
 *
 * It produces the SAME `DealSubmission` the old form did and POSTs to the same
 * `/api/deals` endpoint, so persistence, the verdict page, and the review
 * console all keep working unchanged. The fairness engine scores off fee
 * *keywords*, credit band, APR, term, and coverage tier — every one of which is
 * a chip or a slider here, which is exactly why "no typing" is possible.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FairnessResult } from "@/lib/fairness-engine";
import type { DealSubmission } from "@/lib/deal-mapper";
import { VerdictView } from "@/components/VerdictView";

/* ---------------------------------------------------------------------------
 *  Tap data
 * ------------------------------------------------------------------------- */

const MAKES = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Hyundai",
  "Kia", "Jeep", "Subaru", "Mazda", "GMC", "RAM",
  "BMW", "Mercedes", "Tesla", "Volkswagen",
];

const CREDIT_BANDS = [
  { value: "excellent", label: "Excellent", hint: "720+", emoji: "🟢" },
  { value: "good", label: "Good", hint: "660–719", emoji: "🙂" },
  { value: "fair", label: "Fair", hint: "600–659", emoji: "😐" },
  { value: "poor", label: "Rebuilding", hint: "under 600", emoji: "🌱" },
  { value: "unknown", label: "Not sure", hint: "we'll stay cautious", emoji: "🤷" },
];

const TERMS = [36, 48, 60, 72, 84];

const COVERAGE_TIERS = [
  { value: "powertrain", label: "Powertrain" },
  { value: "named_component", label: "Named parts" },
  { value: "stated_component", label: "Stated parts" },
  { value: "exclusionary", label: "Bumper-to-bumper" },
  { value: "unknown", label: "Not sure" },
];

const WARRANTY_TERMS = [36, 48, 60, 72];

/**
 * The "no typing" centrepiece: a gallery of the add-ons the fairness engine
 * already recognises. Each tile's `label` contains a keyword the engine matches
 * on (e.g. "etch", "nitrogen", "doc"), so tapping it feeds the scorer directly.
 */
type AddOn = {
  key: string;
  label: string; // sent verbatim; must contain an engine keyword
  emoji: string;
  defaultAmount: number;
};
const ADD_ONS: AddOn[] = [
  { key: "nitrogen", label: "Nitrogen tire fill", emoji: "🛞", defaultAmount: 299 },
  { key: "etch", label: "VIN etching", emoji: "🔏", defaultAmount: 299 },
  { key: "paint", label: "Paint & fabric protection", emoji: "✨", defaultAmount: 799 },
  { key: "prep", label: "Dealer prep fee", emoji: "🧽", defaultAmount: 399 },
  { key: "doc", label: "Documentation fee", emoji: "📄", defaultAmount: 499 },
  { key: "market", label: "Market adjustment", emoji: "📈", defaultAmount: 1995 },
  { key: "procurement", label: "Procurement fee", emoji: "🗂️", defaultAmount: 499 },
  { key: "title", label: "Title & registration", emoji: "🏛️", defaultAmount: 699 },
];

/* ---------------------------------------------------------------------------
 *  State
 * ------------------------------------------------------------------------- */

type SelectedAddOn = { amount: number };

type State = {
  make: string;
  makeOther: string;
  year: number;
  mileage: number;
  creditBand: string;
  vehiclePrice: number;
  downPayment: number;
  apr: number;
  termMonths: number;
  addOns: Record<string, SelectedAddOn>; // key -> amount
  hasWarranty: boolean | null;
  warrantyCoverageTier: string;
  warrantyTermMonths: number;
  warrantyPrice: number;
};

const NOW = new Date().getFullYear();

const INITIAL: State = {
  make: "",
  makeOther: "",
  year: NOW - 3,
  mileage: 40_000,
  creditBand: "",
  vehiclePrice: 28_000,
  downPayment: 2_000,
  apr: 9.9,
  termMonths: 72,
  addOns: {},
  hasWarranty: null,
  warrantyCoverageTier: "unknown",
  warrantyTermMonths: 60,
  warrantyPrice: 2_500,
};

type StepKey = "start" | "car" | "credit" | "price" | "financing" | "addons" | "warranty";
const STEPS: StepKey[] = ["start", "car", "credit", "price", "financing", "addons", "warranty"];
// Steps that count toward the progress bar (everything after the start screen).
const PROGRESS_STEPS = STEPS.length - 1;

/* ---------------------------------------------------------------------------
 *  Component
 * ------------------------------------------------------------------------- */

export function GamifiedDealCheck() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [s, setS] = useState<State>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineResult, setInlineResult] = useState<FairnessResult | null>(null);

  // Upload path
  const [parsing, setParsing] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const step = STEPS[stepIdx];
  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const progress =
    stepIdx === 0 ? 0 : Math.round((stepIdx / PROGRESS_STEPS) * 100);

  function next() {
    setError(null);
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  /* ----- submission ----- */

  function buildSubmission(): DealSubmission {
    const fees = Object.entries(s.addOns).map(([key, v]) => {
      const def = ADD_ONS.find((a) => a.key === key);
      return { label: def?.label ?? key, amount: v.amount };
    });
    return {
      vehicle: {
        year: s.year,
        make: s.make === "Other" ? s.makeOther : s.make,
        model: "",
        mileage: s.mileage,
      },
      deal: {
        vehiclePrice: s.vehiclePrice,
        downPayment: s.downPayment,
        apr: s.apr,
        termMonths: s.termMonths,
        creditBand: s.creditBand || "unknown",
        fees,
      },
      warranty: s.hasWarranty
        ? {
            coverageTier: s.warrantyCoverageTier,
            termMonths: s.warrantyTermMonths,
            priceQuoted: s.warrantyPrice,
          }
        : undefined,
      inputPath: uploadedPath ? "upload" : "manual",
      uploadedFilePath: uploadedPath ?? undefined,
    };
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    const started = Date.now();
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSubmission()),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong scoring your deal.");
        setSubmitting(false);
        return;
      }
      // Let the "analyzing" beat land — it's the reward moment.
      const dwell = Math.max(0, 1100 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, dwell));
      if (data.id) {
        router.push(`/verdict/${data.id}`);
      } else {
        setInlineResult(data.result as FairnessResult);
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleParse(file: File) {
    setError(null);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "We couldn't read that file.");
        return;
      }
      const ex = data.extracted ?? {};
      setS((prev) => ({
        ...prev,
        year: numOr(ex.year, prev.year),
        make: matchMake(ex.make) ?? prev.make,
        mileage: numOr(ex.mileage, prev.mileage),
        vehiclePrice: numOr(ex.vehiclePrice, prev.vehiclePrice),
        apr: numOr(ex.apr, prev.apr),
        termMonths: numOr(ex.termMonths, prev.termMonths),
        warrantyPrice: numOr(ex.warrantyPrice, prev.warrantyPrice),
        hasWarranty: ex.warrantyPrice ? true : prev.hasWarranty,
        addOns: Array.isArray(ex.fees) ? feesToAddOns(ex.fees) : prev.addOns,
      }));
      setUploadedPath(data.uploadedFilePath ?? null);
      // Drop them into the stepper to confirm by sliding — fast, no typing.
      setStepIdx(1);
    } catch {
      setError("Network error while reading your file. Please try again.");
    } finally {
      setParsing(false);
    }
  }

  /* ----- inline verdict fallback (no DB configured) ----- */
  if (inlineResult) {
    return (
      <div className="space-y-5">
        <div className="animate-pop rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-navy/70">
          Here&apos;s your verdict. (Saving and shareable links need the database
          configured — this result isn&apos;t stored in this environment.)
        </div>
        <VerdictView result={inlineResult} />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setInlineResult(null);
            setS(INITIAL);
            setStepIdx(0);
          }}
        >
          ← Check another deal
        </button>
      </div>
    );
  }

  /* ----- the "analyzing" reward beat ----- */
  if (submitting) {
    return <Analyzing />;
  }

  /* ----- the stepper ----- */
  return (
    <div>
      {step !== "start" && (
        <ProgressHeader
          percent={progress}
          stepNumber={stepIdx}
          total={PROGRESS_STEPS}
          onBack={back}
        />
      )}

      <div key={step} className="animate-step-in">
        {step === "start" && (
          <StartStep parsing={parsing} onTap={next} onFile={handleParse} />
        )}

        {step === "car" && (
          <StepShell
            title="What are you buying?"
            sub="Tap the brand. Slide the year and miles."
            onNext={next}
            nextEnabled={Boolean(s.make && (s.make !== "Other" || s.makeOther))}
          >
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {MAKES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("make", m)}
                  className={`pill !rounded-xl py-3 ${s.make === m ? "pill--on" : ""}`}
                >
                  {m}
                </button>
              ))}
              <button
                type="button"
                onClick={() => set("make", "Other")}
                className={`pill !rounded-xl py-3 ${s.make === "Other" ? "pill--on" : ""}`}
              >
                Other
              </button>
            </div>
            {s.make === "Other" && (
              <input
                autoFocus
                className="field-input mt-3"
                placeholder="Type the brand"
                value={s.makeOther}
                onChange={(e) => set("makeOther", e.target.value)}
              />
            )}

            <div className="mt-6 space-y-6">
              <Slider
                label="Model year"
                value={s.year}
                min={2005}
                max={NOW + 1}
                step={1}
                onChange={(v) => set("year", v)}
                format={(v) => String(v)}
              />
              <Slider
                label="Mileage"
                value={s.mileage}
                min={0}
                max={200_000}
                step={2_500}
                onChange={(v) => set("mileage", v)}
                format={(v) => `${v.toLocaleString()} mi`}
              />
            </div>
          </StepShell>
        )}

        {step === "credit" && (
          <StepShell
            title="How's your credit right now?"
            sub="No score needed — a ballpark lets us spot rate markup. We never pull your credit."
            hideNext
          >
            <div className="space-y-2.5">
              {CREDIT_BANDS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => {
                    set("creditBand", b.value);
                    next(); // auto-advance: momentum
                  }}
                  className={`choice ${s.creditBand === b.value ? "choice--on" : ""}`}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-semibold text-navy">{b.label}</span>
                    <span className="block text-sm text-navy/55">{b.hint}</span>
                  </span>
                  <Chevron />
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === "price" && (
          <StepShell
            title="The numbers on the car"
            sub="Slide to the sticker price and your cash down."
            onNext={next}
          >
            <div className="space-y-7">
              <Slider
                label="Vehicle price"
                value={s.vehiclePrice}
                min={2_000}
                max={90_000}
                step={500}
                onChange={(v) => set("vehiclePrice", v)}
                format={money}
                big
              />
              <Slider
                label="Down payment"
                value={s.downPayment}
                min={0}
                max={25_000}
                step={250}
                onChange={(v) => set("downPayment", v)}
                format={money}
              />
            </div>
          </StepShell>
        )}

        {step === "financing" && (
          <StepShell
            title="The financing"
            sub="Slide the interest rate; tap the loan length."
            onNext={next}
          >
            <Slider
              label="Loan APR"
              value={s.apr}
              min={0}
              max={29.9}
              step={0.1}
              onChange={(v) => set("apr", Math.round(v * 10) / 10)}
              format={(v) => `${v.toFixed(1)}%`}
              big
            />
            <div className="mt-7">
              <p className="field-label">Loan length</p>
              <div className="flex flex-wrap gap-2">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("termMonths", t)}
                    className={`pill ${s.termMonths === t ? "pill--on" : ""}`}
                  >
                    {t} mo
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-navy/50">
                {(s.termMonths / 12).toFixed(0)} years
                {s.termMonths >= 72 ? " — long terms quietly raise total cost." : ""}
              </p>
            </div>
          </StepShell>
        )}

        {step === "addons" && (
          <StepShell
            title="Any of these on the paperwork?"
            sub="Tap every add-on or fee you see. We'll flag the junk. Tap again to set the amount."
            onNext={next}
            nextLabel="Next"
          >
            <div className="grid grid-cols-2 gap-2.5">
              {ADD_ONS.map((a) => {
                const on = a.key in s.addOns;
                return (
                  <div key={a.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setS((prev) => {
                          const addOns = { ...prev.addOns };
                          if (a.key in addOns) delete addOns[a.key];
                          else addOns[a.key] = { amount: a.defaultAmount };
                          return { ...prev, addOns };
                        });
                      }}
                      className={`choice !gap-3 !px-4 !py-3 ${on ? "choice--on" : ""}`}
                    >
                      <span className="text-xl">{a.emoji}</span>
                      <span className="flex-1 text-sm font-semibold leading-tight text-navy">
                        {a.label}
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                          on ? "border-gold bg-gold text-white" : "border-navy/20 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                    {on && (
                      <AmountStepper
                        value={s.addOns[a.key].amount}
                        onChange={(amount) =>
                          setS((prev) => ({
                            ...prev,
                            addOns: { ...prev.addOns, [a.key]: { amount } },
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-xs text-navy/45">
              See none of these? Just tap Next — we&apos;ll note that fees
              weren&apos;t itemized.
            </p>
          </StepShell>
        )}

        {step === "warranty" && (
          <StepShell
            title="Did they push an extended warranty?"
            sub="The finance office's biggest markup. Let's price-check it."
            hideNext={s.hasWarranty === null}
            onNext={submit}
            nextLabel="See my verdict →"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => set("hasWarranty", false)}
                className={`choice justify-center !py-5 ${s.hasWarranty === false ? "choice--on" : ""}`}
              >
                <span className="font-semibold text-navy">No / skip</span>
              </button>
              <button
                type="button"
                onClick={() => set("hasWarranty", true)}
                className={`choice justify-center !py-5 ${s.hasWarranty === true ? "choice--on" : ""}`}
              >
                <span className="font-semibold text-navy">Yes, they did</span>
              </button>
            </div>

            {s.hasWarranty && (
              <div className="mt-6 space-y-6 animate-step-in">
                <div>
                  <p className="field-label">Coverage</p>
                  <div className="flex flex-wrap gap-2">
                    {COVERAGE_TIERS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => set("warrantyCoverageTier", c.value)}
                        className={`pill ${s.warrantyCoverageTier === c.value ? "pill--on" : ""}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="field-label">Length</p>
                  <div className="flex flex-wrap gap-2">
                    {WARRANTY_TERMS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set("warrantyTermMonths", t)}
                        className={`pill ${s.warrantyTermMonths === t ? "pill--on" : ""}`}
                      >
                        {t} mo
                      </button>
                    ))}
                  </div>
                </div>
                <Slider
                  label="Price they quoted"
                  value={s.warrantyPrice}
                  min={0}
                  max={6_000}
                  step={100}
                  onChange={(v) => set("warrantyPrice", v)}
                  format={money}
                  big
                />
              </div>
            )}
          </StepShell>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-verdict-red/30 bg-verdict-red/5 px-4 py-3 text-sm text-verdict-red">
          {error}
        </p>
      )}
    </div>
  );
}

/* ===========================================================================
 *  Steps & primitives
 * ======================================================================== */

function StartStep({
  parsing,
  onTap,
  onFile,
}: {
  parsing: boolean;
  onTap: () => void;
  onFile: (f: File) => void;
}) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onTap} className="choice !py-5">
        <span className="text-3xl">⚡</span>
        <span className="flex-1">
          <span className="block font-serif text-lg font-semibold text-navy">
            Tap it through
          </span>
          <span className="block text-sm text-navy/55">
            ~6 quick taps, no forms. Best on your phone.
          </span>
        </span>
        <Chevron />
      </button>

      <label
        className={`choice !py-5 ${parsing ? "opacity-70" : "cursor-pointer"}`}
      >
        <span className="text-3xl">{parsing ? "⏳" : "📸"}</span>
        <span className="flex-1">
          <span className="block font-serif text-lg font-semibold text-navy">
            {parsing ? "Reading your quote…" : "Snap the quote"}
          </span>
          <span className="block text-sm text-navy/55">
            {parsing
              ? "Pulling out the numbers — you'll confirm by sliding."
              : "Photo or PDF. We read it, you confirm. Not instant."}
          </span>
        </span>
        {!parsing && <Chevron />}
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          disabled={parsing}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
    </div>
  );
}

function ProgressHeader({
  percent,
  stepNumber,
  total,
  onBack,
}: {
  percent: number;
  stepNumber: number;
  total: number;
  onBack: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-navy/55">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-1 py-0.5 hover:text-navy"
        >
          ← Back
        </button>
        <span>
          Step {stepNumber} of {total}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream-200">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StepShell({
  title,
  sub,
  children,
  onNext,
  nextEnabled = true,
  nextLabel = "Next",
  hideNext = false,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  onNext?: () => void;
  nextEnabled?: boolean;
  nextLabel?: string;
  hideNext?: boolean;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-navy">{title}</h2>
      {sub && <p className="mt-1.5 text-navy/60">{sub}</p>}
      <div className="mt-5">{children}</div>
      {!hideNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={!nextEnabled}
          className="btn-primary mt-7 w-full"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  big = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  big?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="field-label !mb-0">{label}</span>
        <span
          className={`font-serif font-semibold text-navy ${big ? "text-3xl" : "text-xl"}`}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        className="range-gold"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex justify-between text-[11px] text-navy/40">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function AmountStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const bump = (d: number) => onChange(Math.max(0, value + d));
  return (
    <div className="mt-1.5 flex items-center justify-between rounded-xl bg-cream-100 px-2 py-1.5">
      <StepBtn onClick={() => bump(-50)}>−</StepBtn>
      <span className="font-serif text-sm font-semibold text-navy">
        {money(value)}
      </span>
      <StepBtn onClick={() => bump(50)}>+</StepBtn>
    </div>
  );
}

function StepBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-lg font-bold text-navy shadow-sm active:scale-90"
    >
      {children}
    </button>
  );
}

function Analyzing() {
  const lines = [
    "Checking the price & financing…",
    "Scanning fees for junk…",
    "Comparing your rate to your credit…",
    "Pricing the warranty…",
  ];
  return (
    <div className="card flex flex-col items-center gap-5 py-12 text-center animate-pop">
      <span
        className="h-12 w-12 animate-spin rounded-full border-4 border-gold/25 border-t-gold"
        aria-hidden
      />
      <p className="font-serif text-xl font-semibold text-navy">
        Reading your deal…
      </p>
      <ul className="space-y-1.5 text-sm text-navy/55">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-gold-dark"
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 *  helpers
 * ------------------------------------------------------------------------- */

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function numOr(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

/** Snap a parsed make string onto one of our chips when possible. */
function matchMake(raw: unknown): string | null {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  const hit = MAKES.find((m) => m.toLowerCase() === v);
  if (hit) return hit;
  if (v.includes("mercedes")) return "Mercedes";
  if (v.includes("volkswagen") || v === "vw") return "Volkswagen";
  return null;
}

/** Map parsed fee labels onto our known add-on tiles by keyword. */
function feesToAddOns(
  fees: { label?: string; amount?: number | string }[],
): Record<string, SelectedAddOn> {
  const out: Record<string, SelectedAddOn> = {};
  for (const f of fees) {
    const label = String(f.label ?? "").toLowerCase();
    const match = ADD_ONS.find((a) => label.includes(a.key));
    if (match) {
      const amount = numOr(f.amount, match.defaultAmount);
      out[match.key] = { amount };
    }
  }
  return out;
}
