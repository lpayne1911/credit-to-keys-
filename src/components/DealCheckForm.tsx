"use client";

/**
 * The Deal Check form. Handles BOTH input paths, which are deliberately NOT
 * conflated:
 *
 *  - Manual entry  → INSTANT verdict. Typed numbers are scored immediately.
 *  - Photo/PDF      → PARSE first, THEN verdict. Uploading is NOT instant: we
 *    show an honest "reading your quote…" state, extract what we can, and ask
 *    the buyer to confirm/fill the rest before scoring. We never promise
 *    instant results on the upload path.
 *
 * Both paths converge on the same editable field set, so the only difference
 * the buyer feels is the parse step.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FairnessResult } from "@/lib/fairness-engine";
import type { DealSubmission } from "@/lib/deal-mapper";
import { VerdictView } from "@/components/VerdictView";

type FeeRow = { label: string; amount: string };

type FormState = {
  // vehicle
  year: string;
  make: string;
  model: string;
  trim: string;
  mileage: string;
  vin: string;
  // deal
  vehiclePrice: string;
  downPayment: string;
  apr: string;
  termMonths: string;
  monthlyPayment: string;
  creditBand: string;
  fees: FeeRow[];
  // warranty
  hasWarranty: boolean;
  warrantyProvider: string;
  warrantyCoverageTier: string;
  warrantyTermMonths: string;
  warrantyTermMiles: string;
  warrantyPrice: string;
  // lead
  name: string;
  email: string;
};

const EMPTY: FormState = {
  year: "",
  make: "",
  model: "",
  trim: "",
  mileage: "",
  vin: "",
  vehiclePrice: "",
  downPayment: "",
  apr: "",
  termMonths: "",
  monthlyPayment: "",
  creditBand: "unknown",
  fees: [{ label: "", amount: "" }],
  hasWarranty: false,
  warrantyProvider: "",
  warrantyCoverageTier: "unknown",
  warrantyTermMonths: "",
  warrantyTermMiles: "",
  warrantyPrice: "",
  name: "",
  email: "",
};

type Tab = "manual" | "upload";

export function DealCheckForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("manual");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineResult, setInlineResult] = useState<FairnessResult | null>(null);

  // Upload path state
  const [parsing, setParsing] = useState(false);
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  // VIN decode state
  const [decodingVin, setDecodingVin] = useState(false);
  const [vinNote, setVinNote] = useState<string | null>(null);

  async function handleDecodeVin() {
    const vin = form.vin.trim();
    if (vin.length < 17) return;
    setDecodingVin(true);
    setVinNote(null);
    try {
      const res = await fetch(`/api/vin/${encodeURIComponent(vin)}`);
      const data = await res.json();
      const v = data.vehicle;
      if (!v || !v.make) {
        setVinNote("Couldn't decode that VIN — please enter the vehicle manually.");
        return;
      }
      setForm((f) => ({
        ...f,
        year: v.year ? String(v.year) : f.year,
        make: v.make ?? f.make,
        model: v.model ?? f.model,
        trim: v.trim ?? f.trim,
      }));
      setVinNote("Decoded ✓ — please confirm the details are right.");
    } catch {
      setVinNote("VIN lookup failed — please enter the vehicle manually.");
    } finally {
      setDecodingVin(false);
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateFee(i: number, key: keyof FeeRow, value: string) {
    setForm((f) => {
      const fees = f.fees.slice();
      fees[i] = { ...fees[i], [key]: value };
      return { ...f, fees };
    });
  }
  function addFee() {
    setForm((f) => ({ ...f, fees: [...f.fees, { label: "", amount: "" }] }));
  }
  function removeFee(i: number) {
    setForm((f) => ({ ...f, fees: f.fees.filter((_, idx) => idx !== i) }));
  }

  function buildSubmission(path: "manual" | "upload"): DealSubmission {
    return {
      lead: { name: form.name, email: form.email },
      vehicle: {
        year: form.year,
        make: form.make,
        model: form.model,
        trim: form.trim,
        mileage: form.mileage,
        vin: form.vin,
      },
      deal: {
        vehiclePrice: form.vehiclePrice,
        downPayment: form.downPayment,
        apr: form.apr,
        termMonths: form.termMonths,
        monthlyPayment: form.monthlyPayment,
        creditBand: form.creditBand,
        fees: form.fees.filter((f) => f.label || f.amount),
      },
      warranty: form.hasWarranty
        ? {
            provider: form.warrantyProvider,
            coverageTier: form.warrantyCoverageTier,
            termMonths: form.warrantyTermMonths,
            termMiles: form.warrantyTermMiles,
            priceQuoted: form.warrantyPrice,
          }
        : undefined,
      inputPath: path,
      uploadedFilePath: uploadedPath ?? undefined,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInlineResult(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSubmission(confirming ? "upload" : tab)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong scoring your deal.");
        return;
      }
      if (data.id) {
        router.push(`/verdict/${data.id}`);
      } else {
        // Supabase not configured — show the verdict inline (no saved link).
        setInlineResult(data.result as FairnessResult);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleParse(file: File) {
    setError(null);
    setParsing(true);
    setParseNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "We couldn't read that file.");
        return;
      }
      // Pre-fill whatever the parser could extract. Buyer confirms the rest.
      const ex = data.extracted ?? {};
      setForm((f) => ({
        ...f,
        year: ex.year ?? f.year,
        make: ex.make ?? f.make,
        model: ex.model ?? f.model,
        trim: ex.trim ?? f.trim,
        mileage: ex.mileage ?? f.mileage,
        vin: ex.vin ?? f.vin,
        vehiclePrice: ex.vehiclePrice ?? f.vehiclePrice,
        apr: ex.apr ?? f.apr,
        termMonths: ex.termMonths ?? f.termMonths,
        monthlyPayment: ex.monthlyPayment ?? f.monthlyPayment,
        warrantyPrice: ex.warrantyPrice ?? f.warrantyPrice,
        hasWarranty: ex.warrantyPrice ? true : f.hasWarranty,
        fees:
          Array.isArray(ex.fees) && ex.fees.length
            ? ex.fees.map((x: { label: string; amount: number }) => ({
                label: x.label ?? "",
                amount: x.amount != null ? String(x.amount) : "",
              }))
            : f.fees,
      }));
      setUploadedPath(data.uploadedFilePath ?? null);
      setParseNote(
        data.note ??
          "We read what we could. Please check each field below and fill anything we missed before getting your verdict.",
      );
      setConfirming(true);
    } catch {
      setError("Network error while reading your file. Please try again.");
    } finally {
      setParsing(false);
    }
  }

  // ----- Inline verdict (only when Supabase isn't configured) --------------
  if (inlineResult) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-navy/70">
          Showing your verdict below. (Saving and shareable links require the
          database to be configured — your result isn&apos;t stored in this
          environment.)
        </div>
        <VerdictView result={inlineResult} />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setInlineResult(null)}
        >
          ← Check another deal
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Path tabs */}
      {!confirming && (
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-cream-100 p-1">
          <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
            Type it in
          </TabButton>
          <TabButton active={tab === "upload"} onClick={() => setTab("upload")}>
            Upload a photo / PDF
          </TabButton>
        </div>
      )}

      {/* Upload panel */}
      {tab === "upload" && !confirming && (
        <UploadPanel parsing={parsing} onFile={handleParse} note={parseNote} />
      )}

      {/* Confirm banner after a parse */}
      {confirming && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-sm font-medium text-navy">
            Confirm your quote
          </p>
          <p className="mt-1 text-sm text-navy/70">
            {parseNote}
          </p>
        </div>
      )}

      {/* The field set — shown for manual, and for upload after parsing. */}
      {(tab === "manual" || confirming) && (
        <>
          <Section title="Vehicle">
            <Grid>
              <Field label="Year">
                <input
                  className="field-input"
                  inputMode="numeric"
                  placeholder="2021"
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                />
              </Field>
              <Field label="Make" required>
                <input
                  className="field-input"
                  placeholder="Toyota"
                  value={form.make}
                  onChange={(e) => set("make", e.target.value)}
                />
              </Field>
              <Field label="Model" required>
                <input
                  className="field-input"
                  placeholder="Camry"
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                />
              </Field>
              <Field label="Trim">
                <input
                  className="field-input"
                  placeholder="XSE"
                  value={form.trim}
                  onChange={(e) => set("trim", e.target.value)}
                />
              </Field>
              <Field label="Mileage">
                <input
                  className="field-input"
                  inputMode="numeric"
                  placeholder="38,000"
                  value={form.mileage}
                  onChange={(e) => set("mileage", e.target.value)}
                />
              </Field>
              <Field label="VIN (optional)">
                <div className="flex gap-2">
                  <input
                    className="field-input"
                    placeholder="Decode year/make/model"
                    value={form.vin}
                    onChange={(e) => set("vin", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleDecodeVin}
                    disabled={decodingVin || form.vin.trim().length < 17}
                    className="btn-secondary shrink-0 px-3 py-2 text-sm"
                  >
                    {decodingVin ? "…" : "Decode"}
                  </button>
                </div>
                {vinNote && (
                  <p className="mt-1 text-xs text-navy/55">{vinNote}</p>
                )}
              </Field>
            </Grid>
          </Section>

          <Section title="The deal">
            <Grid>
              <Field label="Vehicle price">
                <MoneyInput
                  value={form.vehiclePrice}
                  onChange={(v) => set("vehiclePrice", v)}
                  placeholder="28,500"
                />
              </Field>
              <Field label="Down payment">
                <MoneyInput
                  value={form.downPayment}
                  onChange={(v) => set("downPayment", v)}
                  placeholder="2,000"
                />
              </Field>
              <Field label="Loan APR (%)">
                <input
                  className="field-input"
                  inputMode="decimal"
                  placeholder="9.9"
                  value={form.apr}
                  onChange={(e) => set("apr", e.target.value)}
                />
              </Field>
              <Field label="Loan term (months)">
                <input
                  className="field-input"
                  inputMode="numeric"
                  placeholder="72"
                  value={form.termMonths}
                  onChange={(e) => set("termMonths", e.target.value)}
                />
              </Field>
              <Field label="Monthly payment">
                <MoneyInput
                  value={form.monthlyPayment}
                  onChange={(v) => set("monthlyPayment", v)}
                  placeholder="540"
                />
              </Field>
              <Field label="Your credit (so we can spot rate markup)">
                <select
                  className="field-input"
                  value={form.creditBand}
                  onChange={(e) => set("creditBand", e.target.value)}
                >
                  <option value="unknown">Not sure</option>
                  <option value="excellent">Excellent (720+)</option>
                  <option value="good">Good (660–719)</option>
                  <option value="fair">Fair (600–659)</option>
                  <option value="poor">Poor (under 600)</option>
                </select>
              </Field>
            </Grid>

            {/* Itemized fees */}
            <div className="mt-4">
              <p className="field-label">
                Dealer fees &amp; add-ons (itemize what you can)
              </p>
              <div className="space-y-2">
                {form.fees.map((fee, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="field-input flex-1"
                      placeholder="e.g. Nitrogen tires, Doc fee"
                      value={fee.label}
                      onChange={(e) => updateFee(i, "label", e.target.value)}
                    />
                    <div className="w-32">
                      <MoneyInput
                        value={fee.amount}
                        onChange={(v) => updateFee(i, "amount", v)}
                        placeholder="299"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFee(i)}
                      className="px-2 text-navy/40 hover:text-verdict-red"
                      aria-label="Remove fee"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addFee}
                className="mt-2 text-sm font-medium text-gold-dark hover:underline"
              >
                + Add another fee
              </button>
            </div>
          </Section>

          {/* Warranty */}
          <Section title="Extended warranty / VSC (optional)">
            <label className="flex items-center gap-2 text-sm text-navy/75">
              <input
                type="checkbox"
                checked={form.hasWarranty}
                onChange={(e) => set("hasWarranty", e.target.checked)}
                className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
              />
              The dealer offered an extended warranty or service contract
            </label>
            {form.hasWarranty && (
              <Grid className="mt-4">
                <Field label="Provider">
                  <input
                    className="field-input"
                    placeholder="e.g. dealer brand, Endurance"
                    value={form.warrantyProvider}
                    onChange={(e) => set("warrantyProvider", e.target.value)}
                  />
                </Field>
                <Field label="Coverage tier">
                  <select
                    className="field-input"
                    value={form.warrantyCoverageTier}
                    onChange={(e) =>
                      set("warrantyCoverageTier", e.target.value)
                    }
                  >
                    <option value="unknown">Not sure</option>
                    <option value="powertrain">Powertrain</option>
                    <option value="named_component">Named component</option>
                    <option value="stated_component">Stated component</option>
                    <option value="exclusionary">
                      Bumper-to-bumper (exclusionary)
                    </option>
                  </select>
                </Field>
                <Field label="Term (months)">
                  <input
                    className="field-input"
                    inputMode="numeric"
                    placeholder="60"
                    value={form.warrantyTermMonths}
                    onChange={(e) => set("warrantyTermMonths", e.target.value)}
                  />
                </Field>
                <Field label="Term (miles)">
                  <input
                    className="field-input"
                    inputMode="numeric"
                    placeholder="75,000"
                    value={form.warrantyTermMiles}
                    onChange={(e) => set("warrantyTermMiles", e.target.value)}
                  />
                </Field>
                <Field label="Price quoted">
                  <MoneyInput
                    value={form.warrantyPrice}
                    onChange={(v) => set("warrantyPrice", v)}
                    placeholder="3,200"
                  />
                </Field>
              </Grid>
            )}
          </Section>

          {/* Optional contact for human review */}
          <Section title="Want a human to review it too? (optional)">
            <p className="-mt-2 mb-3 text-sm text-navy/60">
              Leave your details if you&apos;d like the option of a deeper human
              review. We&apos;ll never share them with a dealer.
            </p>
            <Grid>
              <Field label="Name">
                <input
                  className="field-input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  className="field-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
            </Grid>
          </Section>

          {error && (
            <p className="rounded-lg border border-verdict-red/30 bg-verdict-red/5 px-4 py-3 text-sm text-verdict-red">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={submitting}
            >
              {submitting ? "Checking…" : "Get my verdict"}
            </button>
            {confirming && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setConfirming(false);
                  setTab("upload");
                }}
              >
                ← Back to upload
              </button>
            )}
          </div>
          <p className="text-center text-xs text-navy/45">
            Decision support, not financial or legal advice. Estimates are
            ranges, not exact prices.
          </p>
        </>
      )}
    </form>
  );
}

/* ---------- small presentational helpers ---------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-white text-navy shadow-sm"
          : "text-navy/55 hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function UploadPanel({
  parsing,
  onFile,
  note,
}: {
  parsing: boolean;
  onFile: (f: File) => void;
  note: string | null;
}) {
  return (
    <div className="card">
      {parsing ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Spinner />
          <p className="font-medium text-navy">Reading your quote…</p>
          <p className="max-w-sm text-sm text-navy/60">
            This isn&apos;t instant — we&apos;re pulling out the numbers we can
            find. You&apos;ll get to confirm everything before we score it.
          </p>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-navy/20 py-10 text-center transition hover:border-gold/50 hover:bg-gold/5">
          <span className="text-3xl">📄</span>
          <span className="font-medium text-navy">
            Upload a photo or PDF of your quote
          </span>
          <span className="max-w-sm text-sm text-navy/55">
            We&apos;ll read what we can, then ask you to confirm the details.
            Heads up: the upload path isn&apos;t instant like typing it in.
          </span>
          <span className="btn-secondary mt-1 px-4 py-2 text-sm">
            Choose file
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </label>
      )}
      {note && !parsing && (
        <p className="mt-3 text-sm text-navy/60">{note}</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold"
      aria-hidden="true"
    />
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="card">
      <legend className="px-1 font-serif text-lg font-semibold text-navy">
        {title}
      </legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

function Grid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required && <span className="text-gold-dark"> *</span>}
      </span>
      {children}
    </label>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40">
        $
      </span>
      <input
        className="field-input pl-7"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
