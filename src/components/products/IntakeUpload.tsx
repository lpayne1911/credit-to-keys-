"use client";

import { useState } from "react";

/**
 * Secure document upload for human-service intakes (Deal Rescue, Build My Plan,
 * Concierge, Human Review). Reuses the existing /api/parse storage seam: the
 * file lands in the PRIVATE `deal-uploads` bucket (service-role only, sniffed
 * content, sanitized key) and we hand back the storage path for the intake
 * payload. No auto-scoring happens here — extraction results are ignored; a
 * human advocate opens the file from the operator console via a signed URL.
 */
export function IntakeUpload({
  label,
  hint,
  onUploaded,
  accentClass = "text-navy",
}: {
  label: string;
  hint?: string;
  /** Called with the private-bucket storage path (and original filename). */
  onUploaded: (path: string | null, filename: string | null) => void;
  /** Tailwind text-color class for the funnel's lane color. */
  accentClass?: string;
}) {
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [filename, setFilename] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setState("uploading");
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as {
        uploadedFilePath?: string | null;
        error?: string;
      } | null;
      if (!res.ok) {
        setState("error");
        setMessage(data?.error ?? "We couldn't upload that file. Please try again.");
        onUploaded(null, null);
        return;
      }
      if (data?.uploadedFilePath) {
        setState("done");
        onUploaded(data.uploadedFilePath, file.name);
      } else {
        // Storage isn't configured in this environment — be honest, don't fake it.
        setState("error");
        setMessage(
          "Upload isn't available right now — you can still submit, and we'll request the paperwork by email.",
        );
        onUploaded(null, null);
      }
    } catch {
      setState("error");
      setMessage("Network error while uploading. Please try again.");
      onUploaded(null, null);
    } finally {
      e.target.value = ""; // allow re-picking the same file
    }
  }

  return (
    <div className="rounded-xl border border-edge bg-cream-100/60 p-4">
      <p className="text-sm font-semibold text-navy/80">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-navy/50">{hint}</p>}
      <label
        className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-edge bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:border-navy/30 ${accentClass}`}
      >
        {state === "uploading"
          ? "Uploading…"
          : state === "done"
            ? "Choose a different file"
            : "Choose a file (photo or PDF)"}
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          disabled={state === "uploading"}
          onChange={onPick}
        />
      </label>
      {state === "done" && filename && (
        <p className="mt-2 text-xs font-semibold text-green-dark">
          ✓ {filename} uploaded securely
        </p>
      )}
      {message && <p className="mt-2 text-xs text-navy/60">{message}</p>}
      <p className="mt-2 text-xs text-navy/45">
        Stored privately — only reviewed by your advocate, never shared.
      </p>
    </div>
  );
}
