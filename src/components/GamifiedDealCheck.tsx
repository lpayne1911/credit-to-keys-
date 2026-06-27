"use client";

/**
 * Gamified, tap-first Deal Check — built to FEEL like an app, not a web form.
 *
 * Layout philosophy: each step is a full-viewport, single-focus screen with a
 * fixed progress bar up top and ONE sticky thumb-reach button at the bottom.
 * No site header, no stacked cards, no disclaimer wall — just one question at a
 * time with lots of air. "Quick smooth progress. No typing if we can help it."
 *
 * It produces the SAME `DealSubmission` and POSTs to the same `/api/deals`
 * endpoint as before, so persistence, the verdict page, and the review console
 * are unchanged. The fairness engine scores off fee *keywords*, credit band,
 * APR, term, and coverage tier — every one a chip or slider here.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FairnessResult } from "@/lib/fairness-engine";
import type { DealSubmission } from "@/lib/deal-mapper";
import {
  continueEnabled,
  stepsForFocus,
  type StepKey,
  type Focus,
} from "@/lib/deal-check-flow";
import { VerdictView } from "@/components/VerdictView";
import { WARRANTY_DISPLAY_GROUPS } from "@/lib/warranty/warranty-catalog";
import { VehicleSelector } from "@/components/vehicle/VehicleSelector";
import { normalizeMake } from "@/lib/vehicles/vehicle-catalog";

/* ---------------------------------------------------------------------------
 *  Tap data
 * ------------------------------------------------------------------------- */

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

/** US states + DC. Used for state-aware copy now and fee caps later. */
const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/**
 * The "no typing" centrepiece: a gallery of the add-ons the fairness engine
 * already recognises. Each tile's `label` contains a keyword the engine matches
 * on (e.g. "etch", "nitrogen", "doc"), so tapping it feeds the scorer directly.
 */
type AddOn = { key: string; label: string; emoji: string; defaultAmount: number };
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

type State = {
  make: string;
  model: string;
  trim: string;
  vin: string;
  buyerState: string;
  year: number;
  mileage: number;
  creditBand: string;
  vehiclePrice: number;
  downPayment: number;
  apr: number;
  termMonths: number;
  hasPayment: boolean;
  monthlyPayment: number;
  addOns: Record<string, { amount: number }>;
  hasWarranty: boolean | null;
  warrantyCoverageTier: string;
  warrantyTermMonths: number;
  warrantyPrice: number;
  hasTrade: boolean | null;
  tradeOffer: number;
  knowsTradeValue: boolean;
  tradeValue: number;
  tradeStillOwe: boolean;
  tradePayoff: number;
  warrantyFromUpload: boolean;
};

const NOW = new Date().getFullYear();

const INITIAL: State = {
  make: "",
  model: "",
  trim: "",
  vin: "",
  buyerState: "",
  year: NOW - 3,
  mileage: 40_000,
  creditBand: "",
  vehiclePrice: 28_000,
  downPayment: 2_000,
  apr: 9.9,
  termMonths: 72,
  hasPayment: false,
  monthlyPayment: 525,
  addOns: {},
  hasWarranty: null,
  warrantyCoverageTier: "unknown",
  warrantyTermMonths: 60,
  warrantyPrice: 2_500,
  hasTrade: null,
  tradeOffer: 8_000,
  knowsTradeValue: false,
  tradeValue: 10_000,
  tradeStillOwe: false,
  tradePayoff: 9_000,
  warrantyFromUpload: false,
};

type Cta = { label: string; onClick: () => void; enabled: boolean };

/* ---------------------------------------------------------------------------
 *  Component
 * ------------------------------------------------------------------------- */

export function GamifiedDealCheck({ focus = "full" }: { focus?: Focus } = {}) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [s, setS] = useState<State>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineResult, setInlineResult] = useState<FairnessResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  // The focused product routes (/warranty-check, /apr-check, /add-on-check)
  // reuse this flow but only walk the steps relevant to their intent.
  const steps = stepsForFocus(focus);
  const step = steps[stepIdx];
  const isLastStep = stepIdx === steps.length - 1;
  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const percent =
    stepIdx <= 0 ? 0 : Math.round((Math.min(stepIdx, steps.length - 1) / (steps.length - 1)) * 100);

  function next() {
    setError(null);
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    setError(null);
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  /* ----- submission -----
     Focus-aware: a focused check only submits the data it actually collected, so
     unselected fields never reach the engine as defaults and produce spurious
     flags (e.g. a warranty-only check must not flag a "marked-up APR"). */
  function buildSubmission(): DealSubmission {
    const fees = Object.entries(s.addOns).map(([key, v]) => {
      const def = ADD_ONS.find((a) => a.key === key);
      return { label: def?.label ?? key, amount: v.amount };
    });
    const vehicle = {
      year: s.year,
      make: s.make,
      model: s.model,
      trim: s.trim,
      vin: s.vin,
      mileage: s.mileage,
    };
    const warranty = s.hasWarranty
      ? {
          coverageTier: s.warrantyCoverageTier,
          termMonths: s.warrantyTermMonths,
          priceQuoted: s.warrantyPrice,
        }
      : undefined;
    const financing = {
      vehiclePrice: s.vehiclePrice,
      downPayment: s.downPayment,
      apr: s.apr,
      termMonths: s.termMonths,
      monthlyPayment: s.hasPayment ? s.monthlyPayment : undefined,
      creditBand: s.creditBand || "unknown",
    };
    const meta = {
      inputPath: (uploadedPath ? "upload" : "manual") as "upload" | "manual",
      uploadedFilePath: uploadedPath ?? undefined,
      buyerState: s.buyerState || undefined,
    };

    if (focus === "warranty") {
      return { vehicle, deal: { creditBand: "unknown", fees: [] }, warranty, ...meta };
    }
    if (focus === "apr") {
      return { vehicle, deal: { ...financing, fees: [] }, ...meta };
    }
    if (focus === "addons") {
      return { vehicle, deal: { creditBand: "unknown", fees }, warranty, ...meta };
    }
    return {
      vehicle,
      deal: { ...financing, fees },
      warranty,
      tradeIn: s.hasTrade
        ? {
            offer: s.tradeOffer,
            estimatedValue: s.knowsTradeValue ? s.tradeValue : undefined,
            loanPayoff: s.tradeStillOwe ? s.tradePayoff : undefined,
          }
        : undefined,
      ...meta,
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
        model: strOr(ex.model, prev.model),
        trim: strOr(ex.trim, prev.trim),
        vin: strOr(ex.vin, prev.vin),
        mileage: numOr(ex.mileage, prev.mileage),
        vehiclePrice: numOr(ex.vehiclePrice, prev.vehiclePrice),
        apr: numOr(ex.apr, prev.apr),
        termMonths: numOr(ex.termMonths, prev.termMonths),
        monthlyPayment: numOr(ex.monthlyPayment, prev.monthlyPayment),
        hasPayment: ex.monthlyPayment ? true : prev.hasPayment,
        warrantyPrice: numOr(ex.warrantyPrice, prev.warrantyPrice),
        hasWarranty: ex.warrantyPrice ? true : prev.hasWarranty,
        warrantyFromUpload: ex.warrantyPrice ? true : prev.warrantyFromUpload,
        addOns: Array.isArray(ex.fees) ? feesToAddOns(ex.fees) : prev.addOns,
      }));
      setUploadedPath(data.uploadedFilePath ?? null);
      setStepIdx(1);
    } catch {
      setError("Network error while reading your file. Please try again.");
    } finally {
      setParsing(false);
    }
  }

  /* ----- the sticky CTA for the current step (null = no footer button) -----
     The `enabled` gate comes from the shared, tested `continueEnabled`; only the
     label/action are UI concerns that stay here. */
  function cta(): Cta | null {
    // On the final step of any (focused or full) flow, the button submits.
    const verdict = (enabled: boolean): Cta => ({
      label: "See my verdict →",
      onClick: submit,
      enabled,
    });
    switch (step) {
      case "brand":
      case "specs":
      case "state":
      case "price":
      case "financing":
        return isLastStep
          ? verdict(continueEnabled(step, s))
          : { label: "Continue", onClick: next, enabled: continueEnabled(step, s) };
      case "addons":
        return isLastStep
          ? {
              label: Object.keys(s.addOns).length ? "See my verdict →" : "None of these — see my verdict →",
              onClick: submit,
              enabled: true,
            }
          : {
              label: Object.keys(s.addOns).length ? "Continue" : "None of these — continue",
              onClick: next,
              enabled: continueEnabled(step, s),
            };
      case "trade":
        return {
          label: s.hasTrade ? "Continue" : "No trade — continue",
          onClick: next,
          enabled: continueEnabled(step, s),
        };
      case "warranty":
        return verdict(continueEnabled(step, s));
      default:
        return null; // start + credit auto-advance on tap
    }
  }

  /* ----- full-screen result (no-DB fallback) ----- */
  if (inlineResult) {
    return (
      <AppShell>
        <TopBar
          showProgress={false}
          percent={100}
          stepIdx={0}
          onBack={() => {
            setInlineResult(null);
            setS(INITIAL);
            setStepIdx(0);
          }}
        />
        <Scroll>
          <div className="animate-pop">
            <VerdictView
              result={inlineResult}
              vehicle={{
                year: s.year,
                make: s.make,
              }}
              loan={{
                vehiclePrice: s.vehiclePrice,
                downPayment: s.downPayment,
                apr: s.apr,
                termMonths: s.termMonths,
                fees: Object.entries(s.addOns).map(([, v]) => ({ amount: v.amount })),
                warrantyPrice: s.hasWarranty ? s.warrantyPrice : 0,
              }}
            />
          </div>
        </Scroll>
      </AppShell>
    );
  }

  /* ----- analyzing reward beat ----- */
  if (submitting) {
    return (
      <AppShell>
        <TopBar showProgress percent={100} stepIdx={steps.length - 1} onBack={() => {}} hideBack />
        <Center>
          <Analyzing />
        </Center>
      </AppShell>
    );
  }

  const c = cta();

  return (
    <AppShell>
      <TopBar
        showProgress={step !== "start"}
        percent={percent}
        stepIdx={stepIdx}
        onBack={back}
        hideBack={stepIdx === 0}
      />

      <Center key={step}>
        <div className="animate-step-in">
          {step === "start" && (
            <StartStep
              parsing={parsing}
              onTap={next}
              onFile={handleParse}
              focus={focus}
            />
          )}

          {step === "brand" && (
            <Step title="What are you buying?" sub="Pick the make, then the model. Not sure? Choose “I don't know” — it's optional.">
              <VehicleSelector
                value={{ make: s.make, model: s.model, trim: s.trim }}
                onChange={(v) => {
                  set("make", v.make ?? "");
                  set("model", v.model ?? "");
                  set("trim", v.trim ?? "");
                }}
              />
              <label className="mt-3 block">
                <span className="field-label">VIN <span className="font-normal text-navy/40">(optional)</span></span>
                <input
                  className="field-input font-mono uppercase"
                  placeholder="17 characters, off the windshield or paperwork"
                  maxLength={17}
                  value={s.vin}
                  onChange={(e) => set("vin", e.target.value.toUpperCase())}
                />
              </label>
            </Step>
          )}

          {step === "specs" && (
            <Step title="Year &amp; miles" sub="A ballpark is fine — slide to the closest. Not sure? Just continue.">
              <div className="space-y-9">
                <Slider label="Model year" value={s.year} min={2005} max={NOW + 1} step={1}
                  onChange={(v) => set("year", v)} format={(v) => String(v)} big />
                <Slider label="Mileage" value={s.mileage} min={0} max={200_000} step={2_500}
                  onChange={(v) => set("mileage", v)} format={(v) => `${v.toLocaleString()} mi`} />
              </div>
            </Step>
          )}

          {step === "state" && (
            <Step title="What state are you buying in?" sub="Fees, taxes, and doc-fee caps vary by state. We use this to tailor what's normal where you are. Not sure yet? Just continue.">
              <label className="block">
                <span className="field-label">State</span>
                <select
                  className="field-input"
                  value={s.buyerState}
                  onChange={(e) => set("buyerState", e.target.value)}
                >
                  <option value="">Select your state (optional)</option>
                  {US_STATES.map((st) => (
                    <option key={st.code} value={st.code}>{st.name}</option>
                  ))}
                </select>
              </label>
              {s.buyerState && (
                <p className="mt-3 text-sm text-navy/55">
                  We&apos;ll flag fees against {US_STATES.find((x) => x.code === s.buyerState)?.name ?? "your state"}
                  &apos;s norms. Government title &amp; registration fees are legitimate — we only push back on
                  dealer-retained padding.
                </p>
              )}
            </Step>
          )}

          {step === "credit" && (
            <Step title="How's your credit?" sub="Just a ballpark — it's how we catch a marked-up rate in your favor. We never pull your credit, and it's never shared.">
              <div className="space-y-2.5">
                {CREDIT_BANDS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => { set("creditBand", b.value); next(); }}
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
            </Step>
          )}

          {step === "price" && (
            <Step title="The numbers on the car" sub="Slide to the sticker price and your cash down.">
              <div className="space-y-9">
                <Slider label="Vehicle price" value={s.vehiclePrice} min={2_000} max={90_000} step={500}
                  onChange={(v) => set("vehiclePrice", v)} format={money} big />
                <Slider label="Down payment" value={s.downPayment} min={0} max={25_000} step={250}
                  onChange={(v) => set("downPayment", v)} format={money} />
              </div>
            </Step>
          )}

          {step === "financing" && (
            <Step title="The financing" sub="Slide the rate; tap the loan length.">
              <Slider label="Loan APR" value={s.apr} min={0} max={29.9} step={0.1}
                onChange={(v) => set("apr", Math.round(v * 10) / 10)}
                format={(v) => `${v.toFixed(1)}%`} big />
              <div className="mt-9">
                <p className="field-label">Loan length</p>
                <div className="flex flex-wrap gap-2">
                  {TERMS.map((t) => (
                    <button key={t} type="button" onClick={() => set("termMonths", t)}
                      className={`pill ${s.termMonths === t ? "pill--on" : ""}`}>
                      {t} mo
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-navy/50">
                  {(s.termMonths / 12).toFixed(0)} years
                  {s.termMonths >= 72 ? " — long terms quietly raise total cost." : ""}
                </p>
              </div>
              <div className="mt-9">
                <p className="field-label">Monthly payment they quoted</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => set("hasPayment", false)}
                    className={`pill ${!s.hasPayment ? "pill--on" : ""}`}>
                    Don&apos;t know
                  </button>
                  <button type="button" onClick={() => set("hasPayment", true)}
                    className={`pill ${s.hasPayment ? "pill--on" : ""}`}>
                    Enter it
                  </button>
                </div>
                {s.hasPayment && (
                  <div className="mt-6 animate-step-in">
                    <Slider label="Monthly payment" value={s.monthlyPayment} min={100} max={1_500} step={10}
                      onChange={(v) => set("monthlyPayment", v)} format={money} big />
                    <p className="mt-2 text-xs text-navy/50">
                      We&apos;ll check this against the price, rate, and term — a payment
                      that&apos;s too high for the numbers is how add-ons get hidden.
                    </p>
                  </div>
                )}
              </div>
            </Step>
          )}

          {step === "addons" && (
            <Step title="See any of these?" sub="Tap any add-on or fee on the paperwork. Don't have the breakdown yet? Skip it — we'll tell you what to ask for.">
              <div className="grid grid-cols-2 gap-2.5">
                {ADD_ONS.map((a) => {
                  const on = a.key in s.addOns;
                  return (
                    <div key={a.key}>
                      <button
                        type="button"
                        onClick={() =>
                          setS((prev) => {
                            const addOns = { ...prev.addOns };
                            if (a.key in addOns) delete addOns[a.key];
                            else addOns[a.key] = { amount: a.defaultAmount };
                            return { ...prev, addOns };
                          })
                        }
                        className={`choice !gap-3 !px-4 !py-3 ${on ? "choice--on" : ""}`}
                      >
                        <span className="text-xl">{a.emoji}</span>
                        <span className="flex-1 text-sm font-semibold leading-tight text-navy">
                          {a.label}
                        </span>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                          on ? "border-gold bg-gold text-white" : "border-navy/20 text-transparent"}`}>
                          ✓
                        </span>
                      </button>
                      {on && (
                        <AmountStepper
                          value={s.addOns[a.key].amount}
                          onChange={(amount) =>
                            setS((prev) => ({ ...prev, addOns: { ...prev.addOns, [a.key]: { amount } } }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Step>
          )}

          {step === "trade" && (
            <Step title="Trading in a car?" sub="Where dealers quietly take back what they gave you. Let's check the trade.">
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => set("hasTrade", false)}
                  className={`choice justify-center !py-5 ${s.hasTrade === false ? "choice--on" : ""}`}>
                  <span className="font-semibold text-navy">No / skip</span>
                </button>
                <button type="button" onClick={() => set("hasTrade", true)}
                  className={`choice justify-center !py-5 ${s.hasTrade === true ? "choice--on" : ""}`}>
                  <span className="font-semibold text-navy">Yes, I have one</span>
                </button>
              </div>
              {s.hasTrade && (
                <div className="mt-7 space-y-7 animate-step-in">
                  <Slider label="Their offer for your trade" value={s.tradeOffer} min={0} max={60_000} step={250}
                    onChange={(v) => set("tradeOffer", v)} format={money} big />
                  <div>
                    <p className="field-label">Know what it&apos;s really worth?</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => set("knowsTradeValue", false)}
                        className={`pill ${!s.knowsTradeValue ? "pill--on" : ""}`}>
                        Not sure
                      </button>
                      <button type="button" onClick={() => set("knowsTradeValue", true)}
                        className={`pill ${s.knowsTradeValue ? "pill--on" : ""}`}>
                        I looked it up
                      </button>
                    </div>
                    {s.knowsTradeValue ? (
                      <div className="mt-5">
                        <Slider label="What it's really worth" value={s.tradeValue} min={0} max={60_000} step={250}
                          onChange={(v) => set("tradeValue", v)} format={money} />
                        <p className="mt-2 text-xs text-navy/50">
                          A ballpark from KBB, Edmunds, or a CarMax/Carvana quote.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-navy/50">
                        No worries — look up its trade-in value later and re-check. We&apos;ll still flag negative equity.
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="field-label">Still owe money on it?</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => set("tradeStillOwe", false)}
                        className={`pill ${!s.tradeStillOwe ? "pill--on" : ""}`}>
                        Paid off
                      </button>
                      <button type="button" onClick={() => set("tradeStillOwe", true)}
                        className={`pill ${s.tradeStillOwe ? "pill--on" : ""}`}>
                        Still owe
                      </button>
                    </div>
                  </div>
                  {s.tradeStillOwe && (
                    <Slider label="Loan payoff amount" value={s.tradePayoff} min={0} max={60_000} step={250}
                      onChange={(v) => set("tradePayoff", v)} format={money} big />
                  )}
                </div>
              )}
            </Step>
          )}

          {step === "warranty" && (
            <Step title="Did they offer a warranty, service contract, protection plan, or mechanical breakdown coverage?" sub="Dealers use many names for this: VSC, extended service plan, vehicle protection plan, mechanical breakdown coverage, Honda Care, Mopar Maximum Care, Zurich, Endurance, CarShield, and more. It's the finance office's biggest markup — let's price-check it.">
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => set("hasWarranty", false)}
                  className={`choice justify-center !py-5 ${s.hasWarranty === false ? "choice--on" : ""}`}>
                  <span className="font-semibold text-navy">No / skip</span>
                </button>
                <button type="button" onClick={() => set("hasWarranty", true)}
                  className={`choice justify-center !py-5 ${s.hasWarranty === true ? "choice--on" : ""}`}>
                  <span className="font-semibold text-navy">Yes, they did</span>
                </button>
              </div>

              {s.warrantyFromUpload && (
                <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3">
                  <p className="text-sm font-semibold text-navy">
                    📄 We spotted a service contract on your quote{s.warrantyPrice ? ` (about ${money(s.warrantyPrice)})` : ""}.
                  </p>
                  <p className="mt-1 text-sm text-navy/65">
                    Please confirm the coverage, length, and price below before we score it — adjust anything we misread.
                  </p>
                </div>
              )}

              <ServiceContractNames />

              {s.hasWarranty && (
                <div className="mt-7 space-y-7 animate-step-in">
                  <div>
                    <p className="field-label">Coverage</p>
                    <div className="flex flex-wrap gap-2">
                      {COVERAGE_TIERS.map((cov) => (
                        <button key={cov.value} type="button" onClick={() => set("warrantyCoverageTier", cov.value)}
                          className={`pill ${s.warrantyCoverageTier === cov.value ? "pill--on" : ""}`}>
                          {cov.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="field-label">Length</p>
                    <div className="flex flex-wrap gap-2">
                      {WARRANTY_TERMS.map((t) => (
                        <button key={t} type="button" onClick={() => set("warrantyTermMonths", t)}
                          className={`pill ${s.warrantyTermMonths === t ? "pill--on" : ""}`}>
                          {t} mo
                        </button>
                      ))}
                    </div>
                  </div>
                  <Slider label="Price they quoted" value={s.warrantyPrice} min={0} max={6_000} step={100}
                    onChange={(v) => set("warrantyPrice", v)} format={money} big />
                </div>
              )}
            </Step>
          )}

          {error && (
            <p className="mt-5 rounded-lg border border-verdict-red/30 bg-verdict-red/5 px-4 py-3 text-sm text-verdict-red">
              {error}
            </p>
          )}
        </div>
      </Center>

      {c && (
        <Footer>
          <button type="button" onClick={c.onClick} disabled={!c.enabled} className="btn-primary w-full">
            {c.label}
          </button>
        </Footer>
      )}
    </AppShell>
  );
}

/* ===========================================================================
 *  App shell
 * ======================================================================== */

function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[100dvh] flex-col bg-cream">{children}</div>;
}

/** Vertically-centered, scrollable content region. */
function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col overflow-y-auto px-5">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center py-8">
        {children}
      </div>
    </main>
  );
}

/** Like Center but top-aligned (for long result content). */
function Scroll({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto px-5 pb-10">
      <div className="mx-auto w-full max-w-md pt-6">{children}</div>
    </main>
  );
}

function TopBar({
  showProgress,
  percent,
  stepIdx,
  onBack,
  hideBack = false,
}: {
  showProgress: boolean;
  percent: number;
  stepIdx: number;
  onBack: () => void;
  hideBack?: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-3">
        {hideBack ? (
          <span className="w-9" />
        ) : (
          <button type="button" onClick={onBack} aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy/70 hover:bg-navy/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <span className="font-serif text-sm font-semibold tracking-tight text-navy/80">
          Driveway Advocate
        </span>
        <Link href="/" aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-navy/50 hover:bg-navy/5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
      <div className="h-1 w-full bg-cream-200">
        {showProgress && (
          <div className="h-full bg-gold transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
        )}
      </div>
    </header>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <footer className="sticky bottom-0 z-10 border-t border-navy/10 bg-cream/90 px-5 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] pt-3.5 backdrop-blur">
      <div className="mx-auto w-full max-w-md">
        {children}
        <p className="mt-2 text-center text-[11px] text-navy/40">
          Decision support, not financial advice. Never shared with a dealer.
        </p>
      </div>
    </footer>
  );
}

/* ===========================================================================
 *  Steps & primitives
 * ======================================================================== */

function Step({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-serif text-[1.7rem] font-semibold leading-tight text-navy">{title}</h1>
      {sub && <p className="mt-2 text-[15px] leading-snug text-navy/60">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

/**
 * Reassurance for the warranty step: dealers sell the same service contract
 * under dozens of names, so we spell them out. The point is that ANY buyer
 * recognizes their product here and knows to price-check it — they shouldn't
 * have to know it's technically a "vehicle service contract."
 */
function ServiceContractNames() {
  return (
    <details className="mt-4 rounded-xl border border-navy/10 bg-white/60 px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-semibold text-gold-dark">
        Not sure if you got one? See the names it goes by →
      </summary>
      <div className="mt-3 space-y-3">
        {WARRANTY_DISPLAY_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/45">
              {g.label}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-navy/70">
              {g.names.join(" · ")}
            </p>
          </div>
        ))}
        <p className="text-xs text-navy/50">
          See any of these on your paperwork (or anything like them)? Tap
          &ldquo;Yes&rdquo; above and enter the price — we&apos;ll price-check it.
        </p>
      </div>
    </details>
  );
}

/** Per-focus intro copy so each product route opens tailored to the intent. */
const START_COPY: Record<Focus, { title: string; sub: string }> = {
  full: {
    title: "Let's check your deal.",
    sub: "One quick question at a time. No forms, about a minute.",
  },
  warranty: {
    title: "Let's price-check your warranty.",
    sub: "Just a few questions about the service contract — not the whole deal. About 30 seconds.",
  },
  apr: {
    title: "Let's check your rate & payment.",
    sub: "A few questions about the financing — not the whole deal. About 30 seconds.",
  },
  addons: {
    title: "Let's review your add-ons & fees.",
    sub: "Tap the dealer fees and F&I add-ons on your paperwork. About 30 seconds.",
  },
};

function StartStep({
  parsing,
  onTap,
  onFile,
  focus = "full",
}: {
  parsing: boolean;
  onTap: () => void;
  onFile: (f: File) => void;
  focus?: Focus;
}) {
  const copy = START_COPY[focus];
  // Upload is the deal-inspector's superpower; the focused checks are quick taps.
  const showUpload = focus === "full";
  return (
    <div>
      <h1 className="font-serif text-[1.9rem] font-semibold leading-tight text-navy">
        {copy.title}
      </h1>
      <p className="mt-2 text-[15px] text-navy/60">{copy.sub}</p>
      <div className="mt-8">
        <button
          type="button"
          onClick={onTap}
          disabled={parsing}
          className="btn-primary w-full !py-4 text-base"
        >
          Start — it&apos;s free →
        </button>
      </div>
      {showUpload && (
        <div className="mt-5 text-center">
          <label
            className={`inline-flex items-center gap-2 text-sm font-semibold ${
              parsing ? "text-navy/40" : "cursor-pointer text-gold-dark hover:underline"
            }`}
          >
            {parsing ? "⏳ Reading your quote…" : "📸 Or snap a photo of the quote"}
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
          <p className="mt-1 text-xs text-navy/45">
            {parsing
              ? "Pulling the numbers — you'll confirm them next."
              : "Photo or PDF — takes a few extra seconds."}
          </p>
        </div>
      )}
    </div>
  );
}

function Slider({
  label, value, min, max, step, onChange, format, big = false,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string; big?: boolean;
}) {
  // Manual numeric fallback: tap the value to type an exact number. The slider
  // is fast but coarse; some buyers know the precise figure off their paperwork.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  function commit() {
    const n = Number(draft.replace(/[^0-9.\-]/g, ""));
    if (Number.isFinite(n) && draft.trim() !== "") {
      onChange(Math.min(max, Math.max(min, n)));
    }
    setEditing(false);
  }
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="field-label !mb-0">{label}</span>
        {editing ? (
          <input
            type="number"
            autoFocus
            inputMode="decimal"
            aria-label={`${label} — type exact value`}
            className={`w-32 rounded-lg border border-gold/50 bg-white px-2 py-1 text-right font-serif font-semibold text-navy ${big ? "text-2xl" : "text-lg"}`}
            defaultValue={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          />
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(String(value)); setEditing(true); }}
            aria-label={`${label} is ${format(value)} — tap to type an exact value`}
            className={`font-serif font-semibold text-navy underline decoration-dotted decoration-navy/30 underline-offset-4 ${big ? "text-3xl" : "text-xl"}`}
          >
            {format(value)}
          </button>
        )}
      </div>
      <input type="range" className="range-gold" min={min} max={max} step={step}
        value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="mt-1 flex items-center justify-between text-[11px] text-navy/40">
        <span>{format(min)}</span>
        <span className="text-navy/35">tap value to type it</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function AmountStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const bump = (d: number) => onChange(Math.max(0, value + d));
  return (
    <div className="mt-1.5 flex items-center justify-between rounded-xl bg-white px-2 py-1.5 shadow-sm">
      <StepBtn onClick={() => bump(-50)}>−</StepBtn>
      <span className="font-serif text-sm font-semibold text-navy">{money(value)}</span>
      <StepBtn onClick={() => bump(50)}>+</StepBtn>
    </div>
  );
}

function StepBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-cream-100 text-lg font-bold text-navy active:scale-90">
      {children}
    </button>
  );
}

function Analyzing() {
  const lines = [
    "Checking the price & financing…",
    "Scanning fees for junk…",
    "Comparing your rate to your credit…",
    "Checking the math behind your payment…",
    "Pricing the warranty…",
  ];
  return (
    <div className="flex flex-col items-center gap-5 py-12 text-center animate-pop">
      <span className="h-12 w-12 animate-spin rounded-full border-4 border-gold/25 border-t-gold" aria-hidden />
      <p className="font-serif text-xl font-semibold text-navy">Reading your deal…</p>
      <ul className="space-y-1.5 text-sm text-navy/55">
        {lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gold-dark" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 *  helpers
 * ------------------------------------------------------------------------- */

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function numOr(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function strOr(v: unknown, fallback: string): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
}

function matchMake(raw: unknown): string | null {
  // Resolve to a CANONICAL make so it renders in the VehicleSelector dropdown
  // (handles Chevy/VW/Mercedes/Range Rover and friends).
  return normalizeMake(typeof raw === "string" ? raw : raw == null ? null : String(raw));
}

function feesToAddOns(fees: { label?: string; amount?: number | string }[]): Record<string, { amount: number }> {
  const out: Record<string, { amount: number }> = {};
  for (const f of fees) {
    const label = String(f.label ?? "").toLowerCase();
    const match = ADD_ONS.find((a) => label.includes(a.key));
    if (match) out[match.key] = { amount: numOr(f.amount, match.defaultAmount) };
  }
  return out;
}
