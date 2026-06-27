"use client";

/**
 * F&I Product Review — PILOT preview flow.
 *
 * A client-side, no-account, no-payment intake that collects the finance-office
 * products on a buyer's deal and runs them through the deterministic
 * {@link reviewFiProducts} engine to produce a buyer-side REVIEW PREVIEW. It
 * never collects money, never uploads or stores anything, and never makes a
 * legal determination — the result is a reference point the buyer takes into
 * the finance office.
 *
 * Mirrors the JunkFeeAudit pattern: local React state, a single safe action
 * button, and an on-page result panel. No server round-trip.
 */
import { useState } from "react";
import Link from "next/link";
import {
  reviewFiProducts,
  CATEGORY_DISPLAY,
  type FiReviewInput,
  type FiReviewResult,
  type FiProductResult,
  type ProductCategory,
  type SignedStatus,
  type VehicleCondition,
  type YesNoUnsure,
  type Concern,
  type ConcernLevel,
} from "@/lib/fi-product-review";

/* ---------------------------------------------------------------------------
 *  Option data
 * ------------------------------------------------------------------------- */

const SIGNED_OPTIONS: { value: SignedStatus; label: string }[] = [
  { value: "not_yet", label: "Not yet" },
  { value: "signed", label: "Yes, already signed" },
  { value: "not_sure", label: "I'm not sure" },
];

const CONDITION_OPTIONS: { value: VehicleCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "cpo", label: "Certified pre-owned" },
  { value: "lease", label: "Lease" },
  { value: "not_sure", label: "Not sure" },
];

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_DISPLAY) as ProductCategory[]).map(
  (value) => ({ value, label: CATEGORY_DISPLAY[value] }),
);

const YESNO_OPTIONS: { value: YesNoUnsure; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];

const CONCERN_OPTIONS: { value: Concern; label: string }[] = [
  { value: "overpriced", label: "I think the product is overpriced" },
  { value: "told_required", label: "I was told it was required" },
  { value: "packed_into_payment", label: "It was packed into the monthly payment" },
  { value: "dont_understand", label: "I don't understand what it covers" },
  { value: "already_signed_cancel", label: "I already signed and want to cancel" },
  { value: "duplicates_factory", label: "I'm worried it duplicates factory coverage" },
  { value: "need_script", label: "I need a script for the finance office" },
];

/* ---------------------------------------------------------------------------
 *  Local form state (strings at the input layer; coerced on submit)
 * ------------------------------------------------------------------------- */

interface ProductRow {
  id: number;
  category: ProductCategory;
  name: string;
  price: string;
  termMonths: string;
  mileageLimit: string;
  deductible: string;
  toldRequired: YesNoUnsure;
  cancellationVisible: YesNoUnsure;
  inContract: YesNoUnsure;
}

let nextId = 1;
function blankProduct(): ProductRow {
  return {
    id: nextId++,
    category: "vsc",
    name: "",
    price: "",
    termMonths: "",
    mileageLimit: "",
    deductible: "",
    toldRequired: "not_sure",
    cancellationVisible: "not_sure",
    inContract: "not_sure",
  };
}

function num(s: string): number | null {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) ? n : null;
}

const CONCERN_STYLES: Record<ConcernLevel, { wrap: string; badge: string }> = {
  high: {
    wrap: "border-verdict-red/25 bg-verdict-red/5",
    badge: "bg-verdict-red/15 text-verdict-red",
  },
  medium: {
    wrap: "border-verdict-amber/25 bg-verdict-amber/5",
    badge: "bg-verdict-amber/15 text-verdict-amber",
  },
  low: {
    wrap: "border-verdict-green/25 bg-verdict-green/5",
    badge: "bg-verdict-green/15 text-verdict-green",
  },
};

/* ---------------------------------------------------------------------------
 *  Component
 * ------------------------------------------------------------------------- */

export function FiProductReview() {
  const [signed, setSigned] = useState<SignedStatus>("not_yet");
  const [condition, setCondition] = useState<VehicleCondition>("used");
  const [vehicle, setVehicle] = useState({
    year: "",
    make: "",
    model: "",
    mileage: "",
    purchaseState: "",
    price: "",
    termMonths: "",
    apr: "",
    downPayment: "",
  });
  const [products, setProducts] = useState<ProductRow[]>([blankProduct()]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [result, setResult] = useState<FiReviewResult | null>(null);

  function setVeh(patch: Partial<typeof vehicle>) {
    setVehicle((v) => ({ ...v, ...patch }));
  }
  function updateProduct(id: number, patch: Partial<ProductRow>) {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function addProduct() {
    setProducts((ps) => [...ps, blankProduct()]);
  }
  function removeProduct(id: number) {
    setProducts((ps) => (ps.length > 1 ? ps.filter((p) => p.id !== id) : ps));
  }
  function toggleConcern(c: Concern) {
    setConcerns((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  }

  function generate() {
    const input: FiReviewInput = {
      signed,
      vehicleCondition: condition,
      vehicle: {
        year: num(vehicle.year),
        make: vehicle.make.trim() || null,
        model: vehicle.model.trim() || null,
        mileage: num(vehicle.mileage),
        purchaseState: vehicle.purchaseState.trim() || null,
        price: num(vehicle.price),
        termMonths: num(vehicle.termMonths),
        apr: num(vehicle.apr),
        downPayment: num(vehicle.downPayment),
      },
      products: products.map((p) => ({
        category: p.category,
        name: p.name.trim() || null,
        price: num(p.price),
        termMonths: num(p.termMonths),
        mileageLimit: num(p.mileageLimit),
        deductible: num(p.deductible),
        toldRequired: p.toldRequired,
        cancellationVisible: p.cancellationVisible,
        inContract: p.inContract,
      })),
      concerns,
    };
    setResult(reviewFiProducts(input));
    if (typeof window !== "undefined") {
      // Bring the preview into view on mobile after generating.
      requestAnimationFrame(() => {
        document.getElementById("review-preview")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  const canGenerate = products.length > 0;

  return (
    <div className="space-y-6">
      {/* Pilot banner */}
      <div className="rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-3">
        <p className="text-sm leading-relaxed text-navy/75">
          <span className="font-semibold text-gold-dark">Pilot preview.</span>{" "}
          This is a free, buyer-side decision-support tool — not a paid review,
          not legal advice, and not a final report. Nothing is purchased,
          uploaded, or saved. Everything runs in your browser.
        </p>
      </div>

      {/* 1. Buyer status */}
      <SectionCard step={1} title="Your status">
        <div className="space-y-5">
          <Segmented
            label="Have you already signed?"
            value={signed}
            options={SIGNED_OPTIONS}
            onChange={setSigned}
          />
          <Segmented
            label="Is the vehicle…"
            value={condition}
            options={CONDITION_OPTIONS}
            onChange={setCondition}
          />
        </div>
      </SectionCard>

      {/* 2. Vehicle basics */}
      <SectionCard step={2} title="Vehicle basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Year">
            <input
              className="field-input"
              inputMode="numeric"
              value={vehicle.year}
              onChange={(e) => setVeh({ year: e.target.value })}
              placeholder="2021"
            />
          </Field>
          <Field label="Make">
            <input
              className="field-input"
              value={vehicle.make}
              onChange={(e) => setVeh({ make: e.target.value })}
              placeholder="Toyota"
            />
          </Field>
          <Field label="Model">
            <input
              className="field-input"
              value={vehicle.model}
              onChange={(e) => setVeh({ model: e.target.value })}
              placeholder="Camry"
            />
          </Field>
          <Field label="Mileage">
            <input
              className="field-input"
              inputMode="numeric"
              value={vehicle.mileage}
              onChange={(e) => setVeh({ mileage: e.target.value })}
              placeholder="30,000"
            />
          </Field>
          <Field label="Purchase state">
            <input
              className="field-input"
              value={vehicle.purchaseState}
              onChange={(e) => setVeh({ purchaseState: e.target.value })}
              placeholder="TX"
            />
          </Field>
          <Field label="Selling / vehicle price">
            <input
              className="field-input"
              inputMode="decimal"
              value={vehicle.price}
              onChange={(e) => setVeh({ price: e.target.value })}
              placeholder="$26,000"
            />
          </Field>
          <Field label="Loan term (months, if financed)">
            <input
              className="field-input"
              inputMode="numeric"
              value={vehicle.termMonths}
              onChange={(e) => setVeh({ termMonths: e.target.value })}
              placeholder="60"
            />
          </Field>
          <Field label="APR (if known)">
            <input
              className="field-input"
              inputMode="decimal"
              value={vehicle.apr}
              onChange={(e) => setVeh({ apr: e.target.value })}
              placeholder="7%"
            />
          </Field>
          <Field label="Down payment (if known)">
            <input
              className="field-input"
              inputMode="decimal"
              value={vehicle.downPayment}
              onChange={(e) => setVeh({ downPayment: e.target.value })}
              placeholder="$2,000"
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-navy/50">
          Everything here is optional — the more you fill in, the higher the
          confidence level on your preview.
        </p>
      </SectionCard>

      {/* 3. Products to review */}
      <SectionCard step={3} title="Products to review">
        <p className="-mt-1 mb-4 text-sm text-navy/60">
          Add each finance-office product you were offered or sold. Start with
          one and add more as needed.
        </p>
        <div className="space-y-5">
          {products.map((p, i) => (
            <ProductFields
              key={p.id}
              index={i}
              product={p}
              canRemove={products.length > 1}
              onChange={(patch) => updateProduct(p.id, patch)}
              onRemove={() => removeProduct(p.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addProduct}
          className="mt-4 text-sm font-semibold text-gold-dark hover:underline"
        >
          + Add another product
        </button>
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
                className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition ${
                  on
                    ? "border-gold bg-gold/[0.07] text-navy"
                    : "border-navy/10 bg-white text-navy/75 hover:border-gold/50"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
                    on
                      ? "border-gold bg-gold text-white"
                      : "border-navy/25 text-transparent"
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
        disabled={!canGenerate}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        Generate review preview
      </button>

      {/* 5. Review preview */}
      <div id="review-preview" className="scroll-mt-4">
        {result && <ReviewPreview result={result} />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 *  Per-product field group
 * ------------------------------------------------------------------------- */

function ProductFields({
  index,
  product,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  product: ProductRow;
  canRemove: boolean;
  onChange: (patch: Partial<ProductRow>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-navy/10 bg-cream-100 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy/55">
          Product {index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-navy/45 transition hover:bg-navy-50 hover:text-navy/70"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Product category">
          <select
            className="field-input"
            value={product.category}
            onChange={(e) =>
              onChange({ category: e.target.value as ProductCategory })
            }
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name (if known)">
            <input
              className="field-input"
              value={product.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. SecureGuard VSC"
            />
          </Field>
          <Field label="Price charged or quoted">
            <input
              className="field-input"
              inputMode="decimal"
              value={product.price}
              onChange={(e) => onChange({ price: e.target.value })}
              placeholder="$1,800"
            />
          </Field>
          <Field label="Term length (months, if known)">
            <input
              className="field-input"
              inputMode="numeric"
              value={product.termMonths}
              onChange={(e) => onChange({ termMonths: e.target.value })}
              placeholder="60"
            />
          </Field>
          <Field label="Mileage limit (if known)">
            <input
              className="field-input"
              inputMode="numeric"
              value={product.mileageLimit}
              onChange={(e) => onChange({ mileageLimit: e.target.value })}
              placeholder="75,000"
            />
          </Field>
          <Field label="Deductible (if known)">
            <input
              className="field-input"
              inputMode="decimal"
              value={product.deductible}
              onChange={(e) => onChange({ deductible: e.target.value })}
              placeholder="$100"
            />
          </Field>
        </div>

        <Segmented
          label="Were you told it was required?"
          value={product.toldRequired}
          options={YESNO_OPTIONS}
          onChange={(v) => onChange({ toldRequired: v })}
        />
        <Segmented
          label="Is cancellation language visible?"
          value={product.cancellationVisible}
          options={YESNO_OPTIONS}
          onChange={(v) => onChange({ cancellationVisible: v })}
        />
        <Segmented
          label="Is it already included in the contract?"
          value={product.inContract}
          options={YESNO_OPTIONS}
          onChange={(v) => onChange({ inContract: v })}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 *  Result panel
 * ------------------------------------------------------------------------- */

function ReviewPreview({ result }: { result: FiReviewResult }) {
  return (
    <div className="space-y-5">
      {/* Overall card */}
      <div className="overflow-hidden rounded-2xl bg-navy text-cream ring-1 ring-navy/20">
        <div className="p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cream/55">
            Review preview · buyer-side reference point
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-white">
            {result.overallDisplayLabel}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/80">
            {result.overallSummary}
          </p>
          <div className="mt-4">
            <ConfidencePill level={result.confidence} />
          </div>
        </div>
      </div>

      {/* Product-by-product */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-semibold text-navy">
          Product-by-product
        </h3>
        {result.productResults.map((p, i) => (
          <ProductResultCard key={i} product={p} />
        ))}
      </div>

      {/* Document checklist */}
      <Panel title="Documents to gather">
        <ul className="space-y-2">
          {result.documentChecklist.map((d, i) => (
            <Bullet key={i}>{d}</Bullet>
          ))}
        </ul>
      </Panel>

      {/* Next steps */}
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

      {/* Compliance reminder */}
      <div className="rounded-xl border border-navy/10 bg-cream-100 px-4 py-3">
        <p className="text-xs leading-relaxed text-navy/60">
          <span className="font-semibold text-navy/75">
            This is a reference point, not a legal determination.
          </span>{" "}
          It&apos;s a free pilot preview — decision support, not financial, legal,
          tax, or insurance advice, and not a completed paid review. We&apos;re
          strictly buyer-side: we never take money from, or steer you toward, any
          dealer, lender, finance office, warranty company, or product provider,
          and we earn no commissions. Estimates are ranges with a confidence
          level — we never invent an exact &quot;fair price.&quot;
        </p>
      </div>
    </div>
  );
}

function ProductResultCard({ product }: { product: FiProductResult }) {
  const style = CONCERN_STYLES[product.concernLevel];
  return (
    <div className={`rounded-2xl border p-5 ${style.wrap}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-serif text-lg font-semibold text-navy">
            {product.name ?? product.categoryLabel}
          </h4>
          {product.name && (
            <p className="text-xs text-navy/55">{product.categoryLabel}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}
        >
          {product.displayLabel}
        </span>
      </div>

      {/* Reasons */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
          What to challenge
        </p>
        <ul className="mt-2 space-y-2">
          {product.reasons.map((r, i) => (
            <Bullet key={i}>{r}</Bullet>
          ))}
        </ul>
      </div>

      {/* Questions */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
          Questions to ask
        </p>
        <ul className="mt-2 space-y-2">
          {product.questionsToAsk.map((q, i) => (
            <Bullet key={i}>{q}</Bullet>
          ))}
        </ul>
      </div>

      {/* Script */}
      <div className="mt-4 rounded-xl border border-navy/10 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
          Script to use
        </p>
        <p className="mt-1.5 font-serif text-[15px] italic leading-relaxed text-navy/80">
          “{product.suggestedScript}”
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 *  Small presentational helpers
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                on
                  ? "border-gold bg-gold text-white shadow-sm"
                  : "border-navy/15 bg-white text-navy/75 hover:border-gold/50"
              }`}
            >
              {o.label}
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

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-card">
      <h3 className="font-serif text-lg font-semibold text-navy">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed text-navy/75">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
      <span>{children}</span>
    </li>
  );
}
