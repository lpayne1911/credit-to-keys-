"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Buyer sign-in / sign-up. Email+password or Google.
 *
 * Defaults (no props) keep the dashboard's inline behavior: on success we
 * refresh the server component so it re-renders with the buyer's real deals.
 * The dedicated /login and /signup pages pass `redirectTo` (where to land) and
 * `claimDealId` (an anonymous deal to attach on success) to drive the claim loop.
 */
export function AccountAuth({
  configured,
  initialMode = "signin",
  redirectTo,
  claimDealId,
}: {
  configured: boolean;
  initialMode?: "signin" | "signup";
  redirectTo?: string;
  claimDealId?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Attach an anonymous deal to the just-authenticated buyer (best-effort).
  async function claimIfNeeded() {
    if (!claimDealId) return;
    await fetch("/api/account/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId: claimDealId }),
    }).catch(() => {});
  }

  // Where to go once we're signed in.
  function finish() {
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const url = mode === "signup" ? "/api/account/signup" : "/api/account/login";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, redirectTo, claimDealId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (mode === "signup" && data.needsConfirmation) {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
        return;
      }
      await claimIfNeeded();
      finish();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", redirectTo, claimDealId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start sign-in.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-edge bg-white p-6 shadow-card">
      <h1 className="font-serif text-2xl font-semibold text-navy">
        {mode === "signup" ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-1 text-sm text-slate">
        Save your deal checks and see them all in one place.
      </p>

      {!configured && (
        <p className="mt-3 rounded-lg border border-verdict-amber/30 bg-verdict-amber/5 px-3 py-2 text-sm text-navy/70">
          Accounts aren&apos;t available in this environment.
        </p>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="email"
          className="field-input"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="field-input"
          placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-verdict-red">{error}</p>}
        {notice && <p className="text-sm text-green-dark">{notice}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy || !configured}>
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-navy/40">
        <span className="h-px flex-1 bg-navy/10" />
        or
        <span className="h-px flex-1 bg-navy/10" />
      </div>

      <button
        type="button"
        className="btn-secondary w-full"
        disabled={busy || !configured}
        onClick={google}
      >
        Continue with Google
      </button>

      <p className="mt-4 text-center text-sm text-slate">
        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
        <button
          type="button"
          className="font-semibold text-navy hover:underline"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}
