"use client";

import { useState } from "react";
import { VEHICLE_MAKES, modelsForMake } from "@/lib/vehicles/vehicle-catalog";

export interface VehicleValue {
  year?: number | "";
  make?: string;
  model?: string;
  trim?: string;
}

/**
 * Reusable, mobile-friendly vehicle picker used everywhere vehicle identity is
 * needed. Tap, don't type:
 *  - Make is a dropdown (with an explicit "I don't know" choice).
 *  - Model is a dependent dropdown, disabled until a make is chosen, reset when
 *    the make changes, with a "Model not listed → type it" fallback.
 *  - Trim is optional. Year optional (shown when `showYear`).
 * Controlled: owns no source-of-truth except the "manual model" toggle.
 */
export function VehicleSelector({
  value,
  onChange,
  showYear = false,
  showTrim = true,
}: {
  value: VehicleValue;
  onChange: (next: VehicleValue) => void;
  showYear?: boolean;
  showTrim?: boolean;
}) {
  const make = value.make ?? "";
  const models = modelsForMake(make);
  // Manual mode when the user picked "not listed", or the stored model isn't a
  // known one for this make (e.g. prefilled from an upload).
  const storedIsKnown = !value.model || models.includes(value.model);
  const [manual, setManual] = useState<boolean>(!storedIsKnown);
  const manualModel = manual || (!!value.model && !storedIsKnown);

  const yearNow = new Date().getFullYear();
  const years: number[] = [];
  for (let y = yearNow + 1; y >= 2000; y--) years.push(y);

  return (
    <div className="space-y-3">
      {showYear && (
        <label className="block">
          <span className="field-label">Year</span>
          <select
            className="field-input"
            value={value.year === undefined ? "" : String(value.year)}
            onChange={(e) =>
              onChange({ ...value, year: e.target.value === "" ? "" : Number(e.target.value) })
            }
          >
            <option value="">I don&apos;t know</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="field-label">Make</span>
        <select
          className="field-input"
          value={make}
          onChange={(e) => {
            // Changing make always resets the model.
            setManual(false);
            onChange({ ...value, make: e.target.value, model: "" });
          }}
        >
          <option value="">I don&apos;t know / not sure</option>
          {VEHICLE_MAKES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="field-label">
          Model <span className="font-normal text-navy/40">(optional)</span>
        </span>
        {manualModel ? (
          <div className="space-y-1.5">
            <input
              className="field-input"
              autoFocus
              placeholder="Type the model"
              value={value.model ?? ""}
              onChange={(e) => onChange({ ...value, model: e.target.value })}
            />
            {models.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setManual(false);
                  onChange({ ...value, model: "" });
                }}
                className="text-xs font-semibold text-gold-dark hover:underline"
              >
                ← Pick from the list instead
              </button>
            )}
          </div>
        ) : (
          <select
            className="field-input disabled:opacity-50"
            disabled={!make}
            value={value.model && models.includes(value.model) ? value.model : ""}
            onChange={(e) => {
              if (e.target.value === "__other") {
                setManual(true);
                onChange({ ...value, model: "" });
              } else {
                onChange({ ...value, model: e.target.value });
              }
            }}
          >
            <option value="">{make ? "Select model (or skip)" : "Choose a make first"}</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            {make && <option value="__other">Model not listed…</option>}
          </select>
        )}
      </label>

      {showTrim && (
        <label className="block">
          <span className="field-label">
            Trim <span className="font-normal text-navy/40">(optional)</span>
          </span>
          <input
            className="field-input"
            placeholder="e.g. SE, XLT, EX-L"
            value={value.trim ?? ""}
            onChange={(e) => onChange({ ...value, trim: e.target.value })}
          />
        </label>
      )}
    </div>
  );
}
