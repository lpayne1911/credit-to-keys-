"use client";

import { useState } from "react";
import Link from "next/link";
import type { FairnessResult } from "@/lib/fairness-engine";
import {
  getFocusedFlow,
  type Answers,
  type Question,
} from "@/lib/products/focused-flows";
import { getProduct, type ProductFocus } from "@/lib/products/product-catalog";
import { FocusedResult } from "@/components/products/FocusedResult";
import { VehicleSelector } from "@/components/vehicle/VehicleSelector";
import { normalizeMake } from "@/lib/vehicles/vehicle-catalog";

/**
 * Product-specific question runner for the warranty / APR / add-on checks.
 * Renders ONE question per screen from the product's focused-flow spec — only
 * what that product needs, in plain language, with "I don't know" and an
 * "upload instead" option. Produces a product-specific result, never the
 * generic deal-inspector verdict.
 */
export function FocusedCheck({ productId }: { productId: string }) {
  const product = getProduct(productId);
  const focus: ProductFocus = product?.focus ?? "full";
  const flow = getFocusedFlow(focus);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [result, setResult] = useState<FairnessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!product || !flow) return null;
  const questions = flow.questions;
  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  const setAnswer = (id: string, v: Answers[string]) =>
    setAnswers((prev) => ({ ...prev, [id]: v }));

  function back() {
    setError(null);
    setIdx((i) => Math.max(0, i - 1));
  }
  function advance() {
    setError(null);
    if (isLast) void submit();
    else setIdx((i) => i + 1);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flow!.toSubmission(answers, uploadedPath)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 700));
      setResult(data.result as FairnessResult);
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  async function onUpload(file: File) {
    setParsing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setAnswers((prev) => prefillFromExtract(prev, focus, data.extracted ?? {}));
        setUploadedPath(data.uploadedFilePath ?? null);
      }
    } catch {
      /* non-fatal — buyer can still answer manually */
    } finally {
      setParsing(false);
    }
  }

  if (result) {
    return <FocusedResult product={product} result={result} answers={answers} />;
  }

  if (submitting) {
    return (
      <Shell progress={`Checking your ${focusNoun(focus)}…`} percent={100} onBack={null}>
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-gold/25 border-t-gold" aria-hidden />
          <p className="font-serif text-xl font-semibold text-navy">Reading the numbers…</p>
        </div>
      </Shell>
    );
  }

  const percent = Math.round(((idx + 1) / questions.length) * 100);
  // Single-select chips advance on tap; the multi-select add-on picker does not.
  const autoAdvances = q.kind === "chips" && q.id !== "__addons";
  return (
    <Shell
      progress={`Step ${idx + 1} of ${questions.length} · ${flow.progressLabel}`}
      percent={percent}
      onBack={idx === 0 ? null : back}
    >
      <div key={idx} className="animate-step-in">
        <QuestionView
          q={q}
          answers={answers}
          setAnswer={setAnswer}
          onAutoAdvance={advance}
        />

        {idx === 0 && (
          <div className="mt-6 text-center">
            <label
              className={`inline-flex items-center gap-2 text-sm font-semibold ${
                parsing ? "text-navy/40" : "cursor-pointer text-gold-dark hover:underline"
              }`}
            >
              {parsing ? "⏳ Reading your quote…" : "📎 Have the paperwork? Upload it instead"}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                disabled={parsing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                }}
              />
            </label>
            {uploadedPath && (
              <p className="mt-1 text-xs text-verdict-green">
                Got it — we pre-filled what we could. Confirm the answers below.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-lg border border-verdict-red/30 bg-verdict-red/5 px-4 py-3 text-sm text-verdict-red">
            {error}
          </p>
        )}
      </div>

      {/* Single-select chips auto-advance on tap; everything else (incl. the
          multi-select add-on picker) needs an explicit Continue. */}
      {autoAdvances ? (
        <Footer>
          <EscapeHatch />
        </Footer>
      ) : (
        <Footer>
          <button
            type="button"
            onClick={advance}
            disabled={!canContinue(q, answers[q.id])}
            className="btn-primary w-full"
          >
            {isLast ? "See my result →" : "Continue"}
          </button>
          <EscapeHatch />
        </Footer>
      )}
    </Shell>
  );
}

function canContinue(q: Question, v: Answers[string]): boolean {
  if (q.optional || q.idk) return true;
  return v !== undefined && v !== "";
}

function focusNoun(focus: ProductFocus): string {
  return focus === "warranty" ? "warranty" : focus === "apr" ? "rate & payment" : "add-ons";
}

/* ---- one question, rendered by kind ---- */
function QuestionView({
  q,
  answers,
  setAnswer,
  onAutoAdvance,
}: {
  q: Question;
  answers: Answers;
  setAnswer: (id: string, v: Answers[string]) => void;
  onAutoAdvance: () => void;
}) {
  const value = answers[q.id];
  const onChange = (v: Answers[string]) => setAnswer(q.id, v);
  return (
    <div>
      <h1 className="font-serif text-[1.7rem] font-semibold leading-tight text-navy">
        {q.label}
      </h1>
      {q.help && <p className="mt-2 text-[15px] leading-snug text-navy/60">{q.help}</p>}
      <div className="mt-6">
        {q.kind === "vehicle" ? (
          <VehicleSelector
            value={{
              make: (answers.make as string) ?? "",
              model: (answers.model as string) ?? "",
              trim: (answers.trim as string) ?? "",
            }}
            onChange={(v) => {
              setAnswer("make", v.make ?? "");
              setAnswer("model", v.model ?? "");
              setAnswer("trim", v.trim ?? "");
            }}
          />
        ) : q.id === "__addons" ? (
          <AddonPicker q={q} answers={answers} setAnswer={setAnswer} />
        ) : q.kind === "chips" ? (
          <Chips
            q={q}
            value={value}
            onChange={(v) => {
              onChange(v);
              onAutoAdvance();
            }}
          />
        ) : q.kind === "yesno" ? (
          <YesNo q={q} value={value} onChange={onChange} />
        ) : q.kind === "text" ? (
          <TextInput q={q} value={value} onChange={onChange} />
        ) : (
          <NumberInput q={q} value={value} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

function Chips({ q, value, onChange }: { q: Question; value: Answers[string]; onChange: (v: string) => void }) {
  const choices = [...(q.choices ?? [])];
  if (q.idk) choices.push({ value: "idk", label: "I don't know" });
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={`choice !w-auto flex-col !items-start !px-4 !py-3 ${value === c.value ? "choice--on" : ""}`}
        >
          <span className="font-semibold text-navy">{c.label}</span>
          {c.hint && <span className="text-xs text-navy/55">{c.hint}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Multi-select line-item picker (add-on / fees check). Tapping a chip toggles it
 * into the `__addons` comma list; once selected, the buyer can enter the actual
 * amount off their paperwork under `amount_<key>` (optional — blank falls back to
 * a typical estimate in the mapper).
 */
function AddonPicker({
  q,
  answers,
  setAnswer,
}: {
  q: Question;
  answers: Answers;
  setAnswer: (id: string, v: Answers[string]) => void;
}) {
  const selected = new Set(String(answers.__addons ?? "").split(",").filter(Boolean));
  const chosen = (q.choices ?? []).filter((c) => selected.has(c.value));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(q.choices ?? []).map((c) => {
          const on = selected.has(c.value);
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                const next = new Set(selected);
                if (on) next.delete(c.value);
                else next.add(c.value);
                setAnswer("__addons", Array.from(next).join(","));
              }}
              className={`choice !px-4 !py-3 ${on ? "choice--on" : ""}`}
            >
              <span className="flex-1 text-sm font-semibold text-navy">{c.label}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${on ? "border-gold bg-gold text-white" : "border-navy/20 text-transparent"}`}>✓</span>
            </button>
          );
        })}
      </div>

      {chosen.length > 0 && (
        <div className="rounded-xl border border-navy/10 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-navy/70">
            What does each cost on your paperwork?{" "}
            <span className="font-normal text-navy/45">(optional — leave blank and we&apos;ll estimate)</span>
          </p>
          <div className="space-y-2.5">
            {chosen.map((c) => {
              const amt = answers[`amount_${c.value}`];
              return (
                <label key={c.value} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-navy">{c.label}</span>
                  <span className="flex items-center gap-1">
                    <span className="font-serif text-base font-semibold text-navy/55">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="—"
                      className="field-input !w-28 !py-2 text-right"
                      value={amt === undefined || amt === "" ? "" : String(amt)}
                      onChange={(e) =>
                        setAnswer(`amount_${c.value}`, e.target.value === "" ? undefined : Number(e.target.value))
                      }
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function YesNo({ q, value, onChange }: { q: Question; value: Answers[string]; onChange: (v: boolean | undefined) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button type="button" onClick={() => onChange(false)} className={`choice justify-center !py-5 ${value === false ? "choice--on" : ""}`}>
        <span className="font-semibold text-navy">No</span>
      </button>
      <button type="button" onClick={() => onChange(true)} className={`choice justify-center !py-5 ${value === true ? "choice--on" : ""}`}>
        <span className="font-semibold text-navy">Yes</span>
      </button>
    </div>
  );
}

function TextInput({ q, value, onChange }: { q: Question; value: Answers[string]; onChange: (v: string) => void }) {
  return (
    <input
      autoFocus
      className="field-input"
      placeholder={q.placeholder}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function NumberInput({ q, value, onChange }: { q: Question; value: Answers[string]; onChange: (v: number | string | undefined) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {q.prefix && <span className="font-serif text-2xl font-semibold text-navy/60">{q.prefix}</span>}
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          className="field-input !text-xl"
          placeholder={q.placeholder}
          min={q.min}
          max={q.max}
          step={q.step}
          value={value === undefined || value === "idk" ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
        {q.suffix && <span className="font-serif text-lg font-semibold text-navy/60">{q.suffix}</span>}
      </div>
      {q.idk && (
        <button
          type="button"
          onClick={() => onChange("idk")}
          className={`mt-3 text-sm font-semibold ${value === "idk" ? "text-gold-dark underline" : "text-navy/55 hover:text-navy"}`}
        >
          I don&apos;t know
        </button>
      )}
    </div>
  );
}

/* ---- app-like chrome (mirrors the deal-check flow) ---- */
function Shell({
  children,
  progress,
  percent,
  onBack,
}: {
  children: React.ReactNode;
  progress: string;
  percent: number;
  onBack: (() => void) | null;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-cream">
      <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-3">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full text-navy/70 hover:bg-navy/5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : (
            <span className="w-9" />
          )}
          <span className="font-serif text-sm font-semibold tracking-tight text-navy/80">Driveway Advocate</span>
          <Link href="/products" aria-label="All products" className="flex h-9 w-9 items-center justify-center rounded-full text-navy/50 hover:bg-navy/5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </Link>
        </div>
        <div className="h-1 w-full bg-cream-200">
          <div className="h-full bg-gold transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
        </div>
        <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">{progress}</p>
      </header>
      <main className="flex flex-1 flex-col overflow-y-auto px-5">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center py-8">{children}</div>
      </main>
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <footer className="sticky bottom-0 z-10 border-t border-navy/10 bg-cream/90 px-5 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] pt-3.5 backdrop-blur">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </footer>
  );
}

/** Always-available escape to a real person. */
function EscapeHatch() {
  return (
    <p className="mt-2 text-center text-[12px] text-navy/50">
      Stuck or want a person?{" "}
      <Link href="/human-review" className="font-semibold text-gold-dark hover:underline">
        Get human review
      </Link>
    </p>
  );
}

/* ---- upload prefill: map extracted fields to this flow's answers ---- */
function prefillFromExtract(prev: Answers, focus: ProductFocus, ex: Record<string, unknown>): Answers {
  const n = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : Number(String(v).replace(/[^0-9.\-]/g, "")));
  const next = { ...prev };
  if (focus === "warranty") {
    const make = normalizeMake(typeof ex.make === "string" ? ex.make : null);
    if (make) next.make = make;
    if (typeof ex.model === "string" && ex.model) next.model = ex.model;
    if (ex.year) next.year = n(ex.year);
    if (ex.mileage) next.mileage = n(ex.mileage);
    if (ex.warrantyPrice) next.priceQuoted = n(ex.warrantyPrice);
  } else if (focus === "apr") {
    if (ex.vehiclePrice) next.vehiclePrice = n(ex.vehiclePrice);
    if (ex.apr) next.apr = n(ex.apr);
    if (ex.termMonths) next.termMonths = String(n(ex.termMonths));
    if (ex.monthlyPayment) next.monthlyPayment = n(ex.monthlyPayment);
  }
  return next;
}
