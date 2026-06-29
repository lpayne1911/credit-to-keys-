"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Console login. Real auth via Supabase: email+password or a social provider.
 * Access also requires being an active operator (enforced server-side); a
 * non-operator who signs in lands back here.
 */
export function ConsoleLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/console/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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

  async function startOAuth(provider: "google" | "apple") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/console/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start sign-in.");
        setBusy(false);
        return;
      }
      // Hand off to the provider; the callback returns to /console.
      window.location.href = data.url;
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="font-serif text-2xl font-semibold text-navy">Review console</h1>
        <p className="mt-1 text-sm text-navy/60">Private operator area. Sign in to continue.</p>

        {!configured && (
          <p className="mt-3 rounded-lg border border-verdict-amber/30 bg-verdict-amber/5 px-3 py-2 text-sm text-navy/70">
            Console auth isn&apos;t configured in this environment.
          </p>
        )}

        <form onSubmit={submitPassword} className="mt-4 space-y-3">
          <input
            type="email"
            className="field-input"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            className="field-input"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-verdict-red">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy || !configured}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-navy/40">
          <span className="h-px flex-1 bg-navy/10" />
          or
          <span className="h-px flex-1 bg-navy/10" />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={busy || !configured}
            onClick={() => startOAuth("google")}
          >
            Continue with Google
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={busy || !configured}
            onClick={() => startOAuth("apple")}
          >
            Continue with Apple
          </button>
        </div>

        <p className="mt-4 text-xs text-navy/45">Access is limited to authorized operators.</p>
      </div>
    </div>
  );
}
