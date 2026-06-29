"use client";

/**
 * Post-Sale Triage intake — already signed. We collect the products the buyer
 * was sold + the financing basics, POST to /api/post-sale-triage, stash the
 * result in sessionStorage, and route to /triage/[triageId].
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddOnRow {
  rawLabel: string;
  amount: string;
  financed: boolean;
}

interface FormState {
  buyerState: string;
  daysSinceSigned: string;
  financed: boolean;
  lienholder: string;
  dealerName: string;
  addOns: AddOnRow[];
}

const EMPTY: FormState = {
  buyerState: "",
  daysSinceSigned: "",
  financed: true,
  lienholder: "",
  dealerName: "",
  addOns: [
    { rawLabel: "", amount: "", financed: true },
    { rawLabel: "", amount: "", financed: true },
  ],
};

const COMMON = ["Extended service contract", "GAP", "Tire & wheel", "Paint/fabric protection", "Theft / VIN etch", "Nitrogen", "Prepaid maintenance"];

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
  inputMode?: "text" | "numeric";
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
        className="mt-1 w-full rounded-xl border border-edge bg-white px-3 py-2.5 text-navy shadow-sm outline-none ring-red/30 transition focus:border-red/50 focus:ring-2"
      />
      {hint && <span className="mt-1 block text-xs text-navy/50">{hint}</span>}
    </label>
  );
}

export function PostSaleIntakeForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: v }));

  const setRow = (i: number, patch: Partial<AddOnRow>) =>
    setForm((f) => ({ ...f, addOns: f.addOns.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));

  const addRow = () => setForm((f) => ({ ...f, addOns: [...f.addOns, { rawLabel: "", amount: "", financed: f.financed }] }));
  const removeRow = (i: number) => setForm((f) => ({ ...f, addOns: f.addOns.filter((_, idx) => idx !== i) }));

  async function onSubmit() {
    setError(null);
    const filled = form.addOns.filter((r) => r.rawLabel.trim() !== "");
    if (filled.length === 0) {
      setError("Add at least one product you were sold (e.g. service contract, GAP).");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        buyerState: form.buyerState || undefined,
        daysSinceSigned: form.daysSinceSigned || undefined,
        financed: form.financed,
        lienholder: form.lienholder || undefined,
        dealerName: form.dealerName || undefined,
        addOns: filled.map((r) => ({ rawLabel: r.rawLabel, amount: r.amount || undefined, financed: r.financed })),
      };
      const res = await fetch("/api/post-sale-triage", {
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
        sessionStorage.setItem(`post-sale:${data.triageId}`, JSON.stringify(data.result));
      } catch {
        // storage blocked — page shows a friendly "not found here" state
      }
      router.push(`/triage/${data.triageId}`);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-edge bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-red">Products you were sold</h2>
        <p className="mt-1 text-xs text-navy/50">List the add-ons from your contract — service contract, GAP, protection plans, etc.</p>
        <div className="mt-3 space-y-3">
          {form.addOns.map((row, i) => (
            <div key={i} className="rounded-xl border border-edge bg-cream-100/60 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={row.rawLabel}
                  onChange={(e) => setRow(i, { rawLabel: e.target.value })}
                  placeholder="Product name"
                  list="common-addons"
                  className="min-w-0 flex-1 rounded-lg border border-edge bg-white px-3 py-2 text-navy shadow-sm outline-none ring-red/30 transition focus:border-red/50 focus:ring-2"
                />
                <input
                  value={row.amount}
                  onChange={(e) => setRow(i, { amount: e.target.value })}
                  placeholder="$"
                  inputMode="numeric"
                  className="w-24 rounded-lg border border-edge bg-white px-3 py-2 text-navy shadow-sm outline-none ring-red/30 transition focus:border-red/50 focus:ring-2"
                />
                {form.addOns.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remove" className="rounded-lg p-2 text-navy/40 hover:bg-navy/5 hover:text-red">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                )}
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-navy/60">
                <input type="checkbox" checked={row.financed} onChange={(e) => setRow(i, { financed: e.target.checked })} className="h-3.5 w-3.5 rounded border-edge text-red focus:ring-red/30" />
                Rolled into the loan
              </label>
            </div>
          ))}
          <datalist id="common-addons">
            {COMMON.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button type="button" onClick={addRow} className="text-sm font-semibold text-red-dark hover:underline">
            + Add another product
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-edge bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-red">Your deal</h2>
        <label className="mt-3 flex items-center gap-2.5">
          <input type="checkbox" checked={form.financed} onChange={(e) => set("financed", e.target.checked)} className="h-4 w-4 rounded border-edge text-red focus:ring-red/30" />
          <span className="text-sm font-semibold text-navy/80">I financed the purchase</span>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="State" value={form.buyerState} onChange={(v) => set("buyerState", v)} placeholder="e.g. MD" hint="2-letter" />
          <Field label="Days since signing" value={form.daysSinceSigned} onChange={(v) => set("daysSinceSigned", v)} placeholder="optional" inputMode="numeric" />
          {form.financed && (
            <Field label="Lender (optional)" value={form.lienholder} onChange={(v) => set("lienholder", v)} placeholder="e.g. Ally" />
          )}
          <Field label="Dealer (optional)" value={form.dealerName} onChange={(v) => set("dealerName", v)} placeholder="Dealership name" />
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red/30 bg-red-soft px-4 py-3 text-sm font-semibold text-red-dark">{error}</p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-red w-full justify-center text-base disabled:opacity-60"
      >
        {submitting ? "Building your options…" : "Show my post-sale options →"}
      </button>
    </div>
  );
}
