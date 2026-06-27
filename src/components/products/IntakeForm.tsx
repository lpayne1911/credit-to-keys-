"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductIntro } from "@/components/products/ProductIntro";
import { getProduct } from "@/lib/products/product-catalog";

type Field =
  | { name: string; label: string; type: "text" | "date" | "textarea"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "select"; options: string[]; required?: boolean };

// Field sets per the spec (deal-rescue = already signed; human-review = pre-sign).
const FIELDS: Record<string, Field[]> = {
  "deal-rescue": [
    { name: "signed_date", label: "When did you sign?", type: "date" },
    { name: "state", label: "What state did you buy in?", type: "text", placeholder: "e.g. CA" },
    { name: "took_delivery", label: "Have you taken delivery of the car?", type: "select", options: ["Yes", "No", "Not sure"] },
    { name: "financed", label: "Did you finance through the dealer?", type: "select", options: ["Yes", "No", "Paid cash", "Outside loan"] },
    { name: "has_contract", label: "Do you have a copy of the signed contract?", type: "select", options: ["Yes", "No"] },
    { name: "products", label: "What products were added? (warranty, GAP, add-ons…)", type: "textarea", placeholder: "List anything you remember" },
    { name: "goal", label: "What would you like to cancel or dispute?", type: "textarea", required: true, placeholder: "e.g. cancel the extended warranty and GAP" },
    { name: "contact", label: "Best email to reach you", type: "text", required: true, placeholder: "you@example.com" },
  ],
  "human-review": [
    { name: "stage", label: "Where are you in the process?", type: "select", options: ["Have a quote, not signed", "At the dealership now", "Comparing offers", "Other"] },
    { name: "products", label: "What products/fees are on the deal?", type: "textarea", placeholder: "Warranty, GAP, doc fee, add-ons…" },
    { name: "concern", label: "What's worrying you most?", type: "textarea", required: true, placeholder: "Tell us what to look at" },
    { name: "contact", label: "Best email to reach you", type: "text", required: true, placeholder: "you@example.com" },
  ],
};

function track(event: string) {
  if (typeof window !== "undefined") {
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event });
  }
}

/**
 * Focused intake for non-automated products (human review, deal rescue). Collects
 * the relevant fields and submits as a human-review request — never promises an
 * automated score, a cancellation, or a refund.
 */
export function IntakeForm({ productId }: { productId: string }) {
  const product = getProduct(productId);
  const fields = FIELDS[productId] ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const requiredOk = fields
    .filter((f) => f.required)
    .every((f) => (values[f.name] ?? "").trim().length > 0);

  async function submit() {
    setError(null);
    setSubmitting(true);
    track(productId === "human-review" ? "requested_human_review" : "submitted_product_intake");
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
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <ProductIntro product={product} />

        {done ? (
          <div className="mt-8 rounded-2xl border border-verdict-green/25 bg-verdict-green/5 p-6">
            <h2 className="font-serif text-xl font-semibold text-navy">Request received.</h2>
            <p className="mt-2 text-sm text-navy/70">
              A human advocate will follow up by email. This is decision support, not
              legal or financial advice — and there&apos;s no charge today.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {fields.map((f) => (
              <label key={f.name} className="block">
                <span className="field-label">
                  {f.label}
                  {f.required ? "" : <span className="font-normal text-navy/40"> (optional)</span>}
                </span>
                {f.type === "textarea" ? (
                  <textarea
                    className="field-input min-h-[88px]"
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
                    type={f.type}
                    className="field-input"
                    placeholder={"placeholder" in f ? f.placeholder : undefined}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                )}
              </label>
            ))}

            {error && (
              <p className="rounded-lg border border-verdict-red/30 bg-verdict-red/5 px-4 py-3 text-sm text-verdict-red">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={submitting || !requiredOk}
              className="btn-primary w-full !py-4 text-base"
            >
              {submitting ? "Submitting…" : product.ctaLabel}
            </button>
            <p className="text-center text-xs text-navy/45">
              We never take money from dealers, lenders, or warranty companies. No
              guaranteed savings. Paid review isn&apos;t live yet — no charge today.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
