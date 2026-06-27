"use client";

/**
 * VinAutofill — an OPTIONAL, reusable VIN field that prefills the vehicle.
 *
 * It's a convenience accelerator, never a gate: the buyer can always skip it and
 * type the vehicle in. On a valid 17-character VIN it calls the existing
 * `GET /api/vin/[vin]` route (free NHTSA vPIC decode) and hands the decoded
 * vehicle back to the parent, which prefills only its EMPTY fields. There is no
 * trim-confirmation step and no hard dependency — any failure degrades silently.
 */
import { useEffect, useId, useRef, useState } from "react";
import { looksLikeVin, type DecodedVehicle } from "@/lib/vin";

type Status = "idle" | "checking" | "found" | "not-found";

export function VinAutofill({
  value,
  onChange,
  onDecoded,
  label = "VIN (optional)",
  autoCheck = true,
}: {
  value: string;
  onChange: (vin: string) => void;
  onDecoded: (vehicle: DecodedVehicle) => void;
  label?: string;
  autoCheck?: boolean;
}) {
  const inputId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [found, setFound] = useState<DecodedVehicle | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clean = value.trim().toUpperCase();
  const ready = looksLikeVin(clean);

  async function decode() {
    if (!ready) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("checking");
    try {
      const res = await fetch(`/api/vin/${clean}`, { signal: ctrl.signal });
      const data = (await res.json()) as { vehicle: DecodedVehicle | null };
      if (ctrl.signal.aborted) return;
      if (data.vehicle) {
        setFound(data.vehicle);
        setStatus("found");
        onDecoded(data.vehicle);
      } else {
        setFound(null);
        setStatus("not-found");
      }
    } catch {
      // Network/abort — fail quietly; manual entry is always available.
      if (!ctrl.signal.aborted) {
        setFound(null);
        setStatus("not-found");
      }
    }
  }

  // Auto-decode once the VIN reaches a valid 17-char shape; reset otherwise.
  useEffect(() => {
    if (!autoCheck) return;
    if (ready) {
      decode();
    } else {
      abortRef.current?.abort();
      setStatus("idle");
      setFound(null);
    }
    // We intentionally key off the cleaned VIN only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clean, autoCheck]);

  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          className="field-input flex-1 font-mono uppercase tracking-wide"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="17-character VIN"
          maxLength={17}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={`${inputId}-hint`}
        />
        {!autoCheck && (
          <button
            type="button"
            onClick={decode}
            disabled={!ready || status === "checking"}
            className="btn-secondary shrink-0 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Decode
          </button>
        )}
      </div>
      <p id={`${inputId}-hint`} className="mt-1.5 text-xs leading-relaxed" aria-live="polite">
        {status === "checking" && <span className="text-navy/55">Looking up your VIN…</span>}
        {status === "found" && found && (
          <span className="text-verdict-green">
            Found: {[found.year, found.make, found.model, found.trim].filter(Boolean).join(" ")}
            <span className="text-navy/45"> — we filled in what we could.</span>
          </span>
        )}
        {status === "not-found" && (
          <span className="text-navy/55">
            Couldn&apos;t decode that VIN — no problem, just type the vehicle in below.
          </span>
        )}
        {status === "idle" && (
          <span className="text-navy/45">
            Optional — paste the VIN to auto-fill the vehicle, or skip it and type it in.
          </span>
        )}
      </p>
    </div>
  );
}
