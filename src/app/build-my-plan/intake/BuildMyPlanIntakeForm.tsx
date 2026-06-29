"use client";

/**
 * Build My Plan intake — forward-looking, so it's lighter than the Quote Review
 * line-item form. We collect the car the buyer wants + their financing profile,
 * POST to /api/build-my-plan, stash the Target Deal Sheet in sessionStorage, and
 * navigate to /plan/[planId] to render it.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { VehicleSelector, type VehicleValue } from "@/components/vehicle/VehicleSelector";

interface FormState {
  vehicle: VehicleValue;
  mileage: string;
  condition: "new" | "used" | "cpo";
  zip: string;
  buyerState: string;
  creditBand: "excellent" | "good" | "fair" | "poor" | "unknown";
  termMonths: string;
  downPayment: string;
  maxMonthly: string;
  maxOutTheDoor: string;
  hasTrade: boolean;
  tradeEstimatedValue: string;
  tradeLoanPayoff: string;
}

const EMPTY: FormState = {
  vehicle: {},
  mileage: "",
  condition: "used",
  zip: "",
  buyerState: "",
  creditBand: "unknown",
  termMonths: "60",
  downPayment: "",
  maxMonthly: "",
  maxOutTheDoor: "",
  hasTrade: false,
  tradeEstimatedValue: "",
  tradeLoanPayoff: "",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy/80">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-1 w-full rounded-xl border border-edge bg-white px-3 py-2.5 text-navy shadow-sm outline-none ring-blue/30 transition focus:border-blue/50 focus:ring-2"
      />
      {hint && <span className="mt-1 block text-xs text-navy/50">{hint}</span>}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy/80">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-edge bg-white px-3 py-2.5 text-navy shadow-sm outline-none ring-blue/30 transition focus:border-blue/50 focus:ring-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function BuildMyPlanIntakeForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: v }));

  async function onSubmit() {
    setError(null);
    if (!form.vehicle.make && !form.vehicle.model) {
      setError("Tell us the vehicle you're targeting (make and model).");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        vehicle: {
          year: form.vehicle.year || undefined,
          make: form.vehicle.make || undefined,
          model: form.vehicle.model || undefined,
          trim: form.vehicle.trim || undefined,
          mileage: form.mileage || undefined,
        },
        condition: form.condition,
        zip: form.zip || undefined,
        buyerState: form.buyerState || undefined,
        creditBand: form.creditBand,
        termMonths: form.termMonths || undefined,
        downPayment: form.downPayment || undefined,
        maxMonthly: form.maxMonthly || undefined,
        maxOutTheDoor: form.maxOutTheDoor || undefined,
        trade: form.hasTrade
          ? {
              estimatedValue: form.tradeEstimatedValue || undefined,
              loanPayoff: form.tradeLoanPayoff || undefined,
            }
          : null,
      };
      const res = await fetch("/api/build-my-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      try {
        sessionStorage.setItem(`target-plan:${data.planId}`, JSON.stringify(data.result));
      } catch {
        // storage blocked — the page will show a friendly "not found here" state
      }
      router.push(`/plan/${data.planId}`);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-edge bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-blue">The car you want</h2>
        <div className="mt-3 space-y-3">
          <VehicleSelector value={form.vehicle} onChange={(v) => set("vehicle", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target mileage" value={form.mileage} onChange={(v) => set("mileage", v)} placeholder="e.g. 30000" inputMode="numeric" />
            <Select
              label="Condition"
              value={form.condition}
              onChange={(v) => set("condition", v as FormState["condition"])}
              options={[
                { value: "used", label: "Used" },
                { value: "cpo", label: "Certified pre-owned" },
                { value: "new", label: "New" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ZIP code" value={form.zip} onChange={(v) => set("zip", v)} placeholder="for local pricing" inputMode="numeric" />
            <Field label="State" value={form.buyerState} onChange={(v) => set("buyerState", v)} placeholder="e.g. MD" hint="2-letter — sets fee rules" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-edge bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-blue">Financing</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Select
            label="Credit range"
            value={form.creditBand}
            onChange={(v) => set("creditBand", v as FormState["creditBand"])}
            options={[
              { value: "excellent", label: "Excellent (720+)" },
              { value: "good", label: "Good (660–719)" },
              { value: "fair", label: "Fair (600–659)" },
              { value: "poor", label: "Poor (<600)" },
              { value: "unknown", label: "Not sure" },
            ]}
          />
          <Select
            label="Loan term"
            value={form.termMonths}
            onChange={(v) => set("termMonths", v)}
            options={[
              { value: "36", label: "36 months" },
              { value: "48", label: "48 months" },
              { value: "60", label: "60 months" },
              { value: "72", label: "72 months" },
              { value: "84", label: "84 months" },
            ]}
          />
          <Field label="Down payment" value={form.downPayment} onChange={(v) => set("downPayment", v)} placeholder="$" inputMode="numeric" />
          <Field label="Target payment (optional)" value={form.maxMonthly} onChange={(v) => set("maxMonthly", v)} placeholder="$ / mo" inputMode="numeric" />
        </div>
      </section>

      <section className="rounded-2xl border border-edge bg-white p-5 shadow-card">
        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={form.hasTrade} onChange={(e) => set("hasTrade", e.target.checked)} className="h-4 w-4 rounded border-edge text-blue focus:ring-blue/30" />
          <span className="text-sm font-bold uppercase tracking-wide text-blue">I have a trade-in</span>
        </label>
        {form.hasTrade && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Estimated value" value={form.tradeEstimatedValue} onChange={(v) => set("tradeEstimatedValue", v)} placeholder="$" inputMode="numeric" hint="An instant cash offer is a good benchmark" />
            <Field label="Loan payoff" value={form.tradeLoanPayoff} onChange={(v) => set("tradeLoanPayoff", v)} placeholder="$ still owed" inputMode="numeric" />
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-xl border border-red/30 bg-red-soft px-4 py-3 text-sm font-semibold text-red-dark">{error}</p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-blue w-full justify-center text-base disabled:opacity-60"
      >
        {submitting ? "Building your plan…" : "Build my Target Deal Sheet →"}
      </button>
    </div>
  );
}
