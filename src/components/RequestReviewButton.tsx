"use client";

import { useState } from "react";

/**
 * "Request a deeper human review" button shown on every verdict.
 *
 * COMPLIANCE: v1 has NO payment. This only flags the deal for human review.
 * When a paid review is added later, charge ONLY AFTER the review is delivered
 * (CROA/TSR advance-fee rule) — enforced server-side in the review-request /
 * publish flow, never here in the UI.
 */
export function RequestReviewButton({
  dealId,
  alreadyRequested,
}: {
  dealId: string;
  alreadyRequested: boolean;
}) {
  const [state, setState] = useState<"idle" | "open" | "sending" | "done" | "error">(
    alreadyRequested ? "done" : "idle",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (state === "done") {
    return (
      <div className="rounded-xl border border-verdict-green/25 bg-verdict-green/5 p-4 text-sm text-navy/75">
        <p className="font-semibold text-navy">Review requested ✓</p>
        <p className="mt-1">
          A human advocate will take a closer look. There&apos;s no charge for
          this. We&apos;ll reach out if you left contact details.
        </p>
      </div>
    );
  }

  async function submit() {
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/review-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Couldn't submit your request.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "idle" || state === "error") {
    return (
      <div className="space-y-3">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => setState("open")}
        >
          Request a deeper human review
        </button>
        <p className="text-center text-xs text-navy/50">
          Free in this version. A real person double-checks the numbers.
        </p>
        {error && (
          <p className="text-center text-sm text-verdict-red">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <p className="font-semibold text-navy">Request a human review</p>
      <p className="text-sm text-navy/65">
        Optional — leave your details so we can follow up. No charge.
      </p>
      <input
        className="field-input"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="field-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="text-sm text-verdict-red">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={state === "sending"}
          onClick={submit}
        >
          {state === "sending" ? "Sending…" : "Submit request"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setState("idle")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
