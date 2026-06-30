"use client";

import Link from "next/link";
import { useState } from "react";
import { ACCENT_CLASSES, type Accent } from "@/lib/funnels";

type Field =
  | { name: string; label: string; type: "text" | "textarea"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "select"; options: string[]; required?: boolean };

/** Lead-capture field sets per funnel intake (keyed by catalog productId). */
const FIELDS: Record<string, Field[]> = {
  "build-my-plan": [
    { name: "vehicle", label: "What vehicle are you targeting?", type: "text", required: true, placeholder: "Year, make, model, trim" },
    { name: "condition", label: "New or used?", type: "select", options: ["New", "Used", "Either"] },
    { name: "zip", label: "ZIP code", type: "text", placeholder: "Where you'll buy" },
    { name: "budget", label: "Budget or target payment", type: "text", placeholder: "e.g. $35k out-the-door or $500/mo" },
    { name: "timeline", label: "When are you hoping to buy?", type: "select", options: ["This week", "This month", "1–3 months", "Just researching"] },
    { name: "contact", label: "Best email to reach you", type: "text", required: true, placeholder: "you@example.com" },
  ],
  concierge: [
    { name: "vehicle", label: "What are you looking for?", type: "text", required: true, placeholder: "Vehicle, trim, must-haves" },
    { name: "budget", label: "Budget range", type: "text", placeholder: "e.g. $40k–$48k" },
    { name: "zip", label: "ZIP code", type: "text", placeholder: "Your area" },
    { name: "timeline", label: "Purchase timeline", type: "select", options: ["ASAP", "2–4 weeks", "1–2 months", "Flexible"] },
    { name: "trade", label: "Trade-in?", type: "select", options: ["Yes", "No", "Not sure"] },
    { name: "notes", label: "Anything else we should know?", type: "textarea", placeholder: "Dealbreakers, preferences, existing quotes…" },
    { name: "contact", label: "Best email to reach you", type: "text", required: true, placeholder: "you@example.com" },
  ],
  "credit-to-keys": [
    { name: "timeline", label: "When are you hoping to buy?", type: "select", options: ["1–3 months", "3–6 months", "6–9 months", "Just planning"] },
    { name: "credit", label: "Where does your credit stand today?", type: "select", options: ["Not sure", "Rebuilding", "Fair", "Good", "Excellent"] },
    { name: "vehicle", label: "What are you hoping to buy?", type: "text", placeholder: "Year, make, model — or just a type" },
    { name: "budget", label: "Target budget or payment", type: "text", placeholder: "e.g. $30k out-the-door or $450/mo" },
    { name: "goal", label: "What's your main goal?", type: "textarea", placeholder: "e.g. reach a prime rate, avoid a subprime trap…" },
    { name: "contact", label: "Best email to reach you", type: "text", required: true, placeholder: "you@example.com" },
  ],
  "deal-rescue": [
    { name: "signed_date", label: "When did you sign?", type: "text", placeholder: "Approximate date" },
    { name: "state", label: "What state did you buy in?", type: "text", placeholder: "e.g. CA" },
    { name: "financed", label: "How did you pay?", type: "select", options: ["Dealer financing", "Outside loan", "Paid cash", "Lease"] },
    { name: "products", label: "What add-ons were included?", type: "textarea", placeholder: "Warranty, GAP, paint, tint…" },
    { name: "concern", label: "What would you like to review or look into?", type: "textarea", required: true, placeholder: "Tell us what's worrying you" },
    { name: "contact", label: "Best email to reach you", type: "text", required: true, placeholder: "you@example.com" },
  ],
};

/**
 * Lead-capture intake for the blue/gold/red funnels. Posts to the existing
 * /api/intake endpoint ({ productId, fields }). No payment, no automated score,
 * no promises of cancellation, refund, or guaranteed savings.
 */
export function FunnelIntake({
  productId,
  accent,
  cta,
  heading = "Tell us what you need",
  blurb,
}: {
  productId: string;
  accent: Accent;
  cta: string;
  heading?: string;
  blurb?: string;
}) {
  const a = ACCENT_CLASSES[accent];
  const fields = FIELDS[productId] ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = fields.filter((f) => f.required && (values[f.name] ?? "").trim().length === 0);
  const ok = missing.length === 0;

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, fields: values }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong submitting your request.");
        setSubmitting(false);
        return;
      }
      setIntakeId(typeof data.id === "string" ? data.id : null);
      setLinked(Boolean(data.linked));
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div id="start" className="scroll-mt-20 rounded-2xl border border-edge bg-white p-6 shadow-card sm:p-8">
      {done ? (
        <div className={`rounded-xl ${a.soft} p-6`}>
          <h3 className="text-lg font-bold text-navy">Request received.</h3>
          <p className="mt-2 text-sm text-slate">
            A buyer-side advocate will follow up by email. This is decision support, not
            legal or financial advice — and there&apos;s no charge today.
          </p>
          {linked ? (
            <>
              <div className="mt-4">
                <Link href="/dashboard" className={`${a.btn} text-sm`}>
                  View it in your dashboard
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate">
                We&apos;ve added this to your dashboard so you can track it.
              </p>
            </>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={
                    intakeId
                      ? `/signup?claimIntakeId=${intakeId}&redirectTo=/dashboard`
                      : "/signup?redirectTo=/dashboard"
                  }
                  className={`${a.btn} text-sm`}
                >
                  Create a free account
                </Link>
                <Link href="/dashboard" className="btn-secondary text-sm">
                  Go to your dashboard
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate">
                Create an account and we&apos;ll add this to your dashboard to track.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <h3 className="text-xl font-bold text-navy">{heading}</h3>
          {blurb && <p className="mt-1 text-sm text-slate">{blurb}</p>}
          <div className="mt-5 space-y-4">
            {fields.map((f) => (
              <label key={f.name} className="block">
                <span className="field-label">
                  {f.label}
                  {f.required ? "" : <span className="font-normal text-navy/40"> (optional)</span>}
                </span>
                {f.type === "textarea" ? (
                  <textarea
                    className="field-input min-h-[80px]"
                    placeholder={"placeholder" in f ? f.placeholder : undefined}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                ) : f.type === "select" ? (
                  <select
                    className="field-input"
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="field-input"
                    placeholder={"placeholder" in f ? f.placeholder : undefined}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                )}
              </label>
            ))}
            {error && (
              <p className="rounded-lg border border-red/30 bg-red-soft px-4 py-3 text-sm text-red-dark">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !ok}
              className={`${a.btn} w-full !py-4`}
            >
              {submitting ? "Submitting…" : cta}
            </button>
            <p className="text-center text-xs text-slate">
              We never take money from dealers, lenders, or warranty companies. No guaranteed
              savings. You make the final decision.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
