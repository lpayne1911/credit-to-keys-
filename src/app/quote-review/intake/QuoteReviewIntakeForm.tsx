"use client";

/**
 * Quote Review intake — the deep, line-item entry that feeds the deal engine.
 *
 * Two modes:
 *  - Upload: pick dealer paperwork (quote, buyer's order, F&I menu, …). Parsing
 *    is stubbed for now, so picking a file flips into the manual form with a
 *    "confirm your figures" banner and marks the deal as document-sourced.
 *  - Manual: type every line of the deal.
 *
 * On submit it POSTs to /api/quote-review. When the DB isn't configured the
 * result comes back un-persisted; we stash it in sessionStorage so the
 * /deal-review/[dealId] page can render it, then navigate there.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { VehicleSelector, type VehicleValue } from "@/components/vehicle/VehicleSelector";

type Mode = "choose" | "upload" | "manual";

interface LineItem {
  label: string;
  amount: string;
  financed?: boolean;
}

interface FormState {
  vehicle: VehicleValue;
  mileage: string;
  vin: string;
  dealerName: string;
  buyerState: string;
  dealerZip: string;
  registrationZip: string;
  vehiclePrice: string;
  msrp: string;
  dealerDiscount: string;
  rebates: string;
  outTheDoor: string;
  downPayment: string;
  fees: LineItem[];
  addOns: LineItem[];
  apr: string;
  termMonths: string;
  monthlyPayment: string;
  amountFinanced: string;
  creditBand: string;
  tradeOffer: string;
  tradeEstimatedValue: string;
  tradeLoanPayoff: string;
  alreadySigned: boolean;
}

const EMPTY: FormState = {
  vehicle: {},
  mileage: "",
  vin: "",
  dealerName: "",
  buyerState: "",
  dealerZip: "",
  registrationZip: "",
  vehiclePrice: "",
  msrp: "",
  dealerDiscount: "",
  rebates: "",
  outTheDoor: "",
  downPayment: "",
  fees: [
    { label: "Doc fee", amount: "" },
    { label: "Title & registration", amount: "" },
  ],
  addOns: [{ label: "", amount: "", financed: true }],
  apr: "",
  termMonths: "",
  monthlyPayment: "",
  amountFinanced: "",
  creditBand: "",
  tradeOffer: "",
  tradeEstimatedValue: "",
  tradeLoanPayoff: "",
  alreadySigned: false,
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "decimal" | "numeric";
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function QuoteReviewIntakeForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function updateLine(
    key: "fees" | "addOns",
    i: number,
    patch: Partial<LineItem>,
  ) {
    setForm((f) => {
      const next = [...f[key]];
      next[i] = { ...next[i], ...patch };
      return { ...f, [key]: next };
    });
  }

  function addLine(key: "fees" | "addOns") {
    setForm((f) => ({
      ...f,
      [key]: [...f[key], { label: "", amount: "", financed: key === "addOns" ? true : undefined }],
    }));
  }

  function removeLine(key: "fees" | "addOns", i: number) {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Parsing is stubbed — capture the name, mark the deal document-sourced, and
    // route into manual confirmation so the buyer verifies the figures.
    setUploadName(file.name);
    setDocumentUploaded(true);
    setMode("manual");
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        vehicle: {
          year: form.vehicle.year === "" ? undefined : form.vehicle.year,
          make: form.vehicle.make,
          model: form.vehicle.model,
          trim: form.vehicle.trim,
          mileage: form.mileage,
          vin: form.vin,
        },
        pricing: {
          vehiclePrice: form.vehiclePrice,
          msrp: form.msrp,
          dealerDiscount: form.dealerDiscount,
          rebates: form.rebates,
          outTheDoor: form.outTheDoor,
          downPayment: form.downPayment,
        },
        fees: form.fees
          .filter((l) => l.label.trim() || l.amount.trim())
          .map((l) => ({ label: l.label, amount: l.amount })),
        addOns: form.addOns
          .filter((l) => l.label.trim() || l.amount.trim())
          .map((l) => ({ label: l.label, amount: l.amount, financed: l.financed ?? false })),
        finance: {
          apr: form.apr,
          termMonths: form.termMonths,
          monthlyPayment: form.monthlyPayment,
          amountFinanced: form.amountFinanced,
          creditBand: form.creditBand,
        },
        trade:
          form.tradeOffer || form.tradeEstimatedValue || form.tradeLoanPayoff
            ? {
                offer: form.tradeOffer,
                estimatedValue: form.tradeEstimatedValue,
                loanPayoff: form.tradeLoanPayoff,
              }
            : undefined,
        dealerName: form.dealerName,
        buyerState: form.buyerState,
        dealerZip: form.dealerZip,
        registrationZip: form.registrationZip,
        alreadySigned: form.alreadySigned,
        source: documentUploaded ? "upload" : "manual",
        documentUploaded,
      };

      const res = await fetch("/api/quote-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Something went wrong. Please check your entries and try again.");
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as {
        dealId: string;
        result: unknown;
        persisted: boolean;
      };
      if (!data.persisted) {
        try {
          sessionStorage.setItem(
            `deal-review:${data.dealId}`,
            JSON.stringify(data.result),
          );
        } catch {
          // storage blocked — the page will show a graceful "not found here" notice
        }
      }
      router.push(`/deal-review/${data.dealId}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  /* ---- Mode chooser ------------------------------------------------------ */
  if (mode === "choose") {
    return (
      <div className="space-y-4">
        <div className="card">
          <h2 className="font-serif text-lg font-semibold text-navy">Upload paperwork</h2>
          <p className="mt-1 text-sm text-navy/60">
            Dealer quote, buyer&apos;s order, payment worksheet, warranty or F&amp;I
            menu, trade appraisal — PDF, screenshot, or photo.
          </p>
          <label className="btn-primary mt-4 inline-flex cursor-pointer">
            Choose a file
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={onPickFile}
            />
          </label>
          <p className="mt-2 text-xs text-navy/45">
            Automatic reading is coming soon — for now you&apos;ll confirm the
            figures on the next screen.
          </p>
        </div>

        <div className="card">
          <h2 className="font-serif text-lg font-semibold text-navy">Enter it manually</h2>
          <p className="mt-1 text-sm text-navy/60">
            Type the numbers off your quote. You can fill in only what you have.
          </p>
          <button type="button" className="btn-secondary mt-4" onClick={() => setMode("manual")}>
            Enter deal details
          </button>
        </div>
      </div>
    );
  }

  /* ---- Manual form ------------------------------------------------------- */
  return (
    <div className="space-y-5">
      {documentUploaded ? (
        <div className="rounded-xl border border-green/30 bg-green-soft px-4 py-3 text-sm text-green-dark">
          Using <span className="font-semibold">{uploadName}</span> as a starting
          point. Confirm or fill in the figures below.
        </div>
      ) : null}

      {/* Vehicle */}
      <section className="card space-y-3">
        <h2 className="font-serif text-lg font-semibold text-navy">Vehicle</h2>
        <VehicleSelector
          value={form.vehicle}
          onChange={(v) => set("vehicle", v)}
          showYear
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mileage" value={form.mileage} inputMode="numeric" onChange={(v) => set("mileage", v)} />
          <Field label="VIN (optional)" value={form.vin} onChange={(v) => set("vin", v)} />
        </div>
      </section>

      {/* Dealer & location */}
      <section className="card space-y-3">
        <h2 className="font-serif text-lg font-semibold text-navy">Dealer &amp; location</h2>
        <Field label="Dealer name (optional)" value={form.dealerName} onChange={(v) => set("dealerName", v)} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="State" value={form.buyerState} placeholder="CA" onChange={(v) => set("buyerState", v)} />
          <Field label="Dealer ZIP" value={form.dealerZip} inputMode="numeric" onChange={(v) => set("dealerZip", v)} />
          <Field label="Your ZIP" value={form.registrationZip} inputMode="numeric" onChange={(v) => set("registrationZip", v)} />
        </div>
      </section>

      {/* Pricing */}
      <section className="card space-y-3">
        <h2 className="font-serif text-lg font-semibold text-navy">Pricing</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Selling price" value={form.vehiclePrice} inputMode="decimal" onChange={(v) => set("vehiclePrice", v)} />
          <Field label="MSRP (optional)" value={form.msrp} inputMode="decimal" onChange={(v) => set("msrp", v)} />
          <Field label="Dealer discount" value={form.dealerDiscount} inputMode="decimal" onChange={(v) => set("dealerDiscount", v)} />
          <Field label="Rebates" value={form.rebates} inputMode="decimal" onChange={(v) => set("rebates", v)} />
          <Field label="Out-the-door price" value={form.outTheDoor} inputMode="decimal" onChange={(v) => set("outTheDoor", v)} />
          <Field label="Down payment" value={form.downPayment} inputMode="decimal" onChange={(v) => set("downPayment", v)} />
        </div>
      </section>

      {/* Fees */}
      <section className="card space-y-3">
        <h2 className="font-serif text-lg font-semibold text-navy">Fees</h2>
        <p className="text-sm text-navy/55">List each fee line from the buyer&apos;s order.</p>
        {form.fees.map((line, i) => (
          <div key={i} className="flex items-end gap-2">
            <label className="block flex-1">
              <span className="field-label">Fee</span>
              <input className="field-input" value={line.label} placeholder="e.g. Processing fee"
                onChange={(e) => updateLine("fees", i, { label: e.target.value })} />
            </label>
            <label className="block w-28">
              <span className="field-label">Amount</span>
              <input className="field-input" value={line.amount} inputMode="decimal"
                onChange={(e) => updateLine("fees", i, { amount: e.target.value })} />
            </label>
            <button type="button" aria-label="Remove fee" className="mb-1 px-2 text-navy/40 hover:text-navy"
              onClick={() => removeLine("fees", i)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn-ghost-light text-sm" onClick={() => addLine("fees")}>
          + Add fee
        </button>
      </section>

      {/* Add-ons */}
      <section className="card space-y-3">
        <h2 className="font-serif text-lg font-semibold text-navy">Add-ons &amp; F&amp;I products</h2>
        <p className="text-sm text-navy/55">Warranty, GAP, tire &amp; wheel, paint, etc.</p>
        {form.addOns.map((line, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-navy/10 p-3">
            <div className="flex items-end gap-2">
              <label className="block flex-1">
                <span className="field-label">Product</span>
                <input className="field-input" value={line.label} placeholder="e.g. Extended warranty"
                  onChange={(e) => updateLine("addOns", i, { label: e.target.value })} />
              </label>
              <label className="block w-28">
                <span className="field-label">Amount</span>
                <input className="field-input" value={line.amount} inputMode="decimal"
                  onChange={(e) => updateLine("addOns", i, { amount: e.target.value })} />
              </label>
              <button type="button" aria-label="Remove add-on" className="mb-1 px-2 text-navy/40 hover:text-navy"
                onClick={() => removeLine("addOns", i)}>✕</button>
            </div>
            <label className="flex items-center gap-2 text-sm text-navy/70">
              <input type="checkbox" checked={line.financed ?? false}
                onChange={(e) => updateLine("addOns", i, { financed: e.target.checked })} />
              Financed into the loan
            </label>
          </div>
        ))}
        <button type="button" className="btn-ghost-light text-sm" onClick={() => addLine("addOns")}>
          + Add product
        </button>
      </section>

      {/* Financing */}
      <section className="card space-y-3">
        <h2 className="font-serif text-lg font-semibold text-navy">Financing</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="APR %" value={form.apr} inputMode="decimal" onChange={(v) => set("apr", v)} />
          <Field label="Term (months)" value={form.termMonths} inputMode="numeric" onChange={(v) => set("termMonths", v)} />
          <Field label="Monthly payment" value={form.monthlyPayment} inputMode="decimal" onChange={(v) => set("monthlyPayment", v)} />
          <Field label="Amount financed" value={form.amountFinanced} inputMode="decimal" onChange={(v) => set("amountFinanced", v)} />
        </div>
        <Field label="Credit band (optional)" value={form.creditBand} placeholder="e.g. Excellent / 720+"
          onChange={(v) => set("creditBand", v)} />
      </section>

      {/* Trade-in */}
      <section className="card space-y-3">
        <h2 className="font-serif text-lg font-semibold text-navy">Trade-in (optional)</h2>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Dealer offer" value={form.tradeOffer} inputMode="decimal" onChange={(v) => set("tradeOffer", v)} />
          <Field label="Your value" value={form.tradeEstimatedValue} inputMode="decimal" onChange={(v) => set("tradeEstimatedValue", v)} />
          <Field label="Loan payoff" value={form.tradeLoanPayoff} inputMode="decimal" onChange={(v) => set("tradeLoanPayoff", v)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-navy/70">
          <input type="checkbox" checked={form.alreadySigned}
            onChange={(e) => set("alreadySigned", e.target.checked)} />
          I&apos;ve already signed
        </label>
      </section>

      {error ? (
        <p className="rounded-lg bg-verdict-red/10 px-3 py-2 text-sm text-verdict-red">{error}</p>
      ) : null}

      <button type="button" className="btn-primary w-full" disabled={submitting} onClick={submit}>
        {submitting ? "Reviewing your deal…" : "Review my quote"}
      </button>
      <p className="text-center text-xs text-navy/45">
        Decision support, not legal or financial advice. You make the final decision.
      </p>
    </div>
  );
}
