"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Console login form. V1 STOPGAP — single shared password. Not real auth.
 */
export function ConsoleLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/console/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="font-serif text-2xl font-semibold text-navy">
          Review console
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          Private operator area. Enter the console password.
        </p>
        {!configured && (
          <p className="mt-3 rounded-lg border border-verdict-amber/30 bg-verdict-amber/5 px-3 py-2 text-sm text-navy/70">
            No <code className="text-xs">CONSOLE_PASSWORD</code> is set on the
            server, so the console can&apos;t be opened in this environment.
          </p>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="password"
            className="field-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-verdict-red">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy || !configured}>
            {busy ? "Checking…" : "Enter console"}
          </button>
        </form>
        <p className="mt-4 text-xs text-navy/45">
          v1 stopgap auth — to be replaced with proper authentication before
          launch.
        </p>
      </div>
    </div>
  );
}
