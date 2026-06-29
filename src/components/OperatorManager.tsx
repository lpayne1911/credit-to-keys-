"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface OperatorRow {
  id: string;
  email: string;
  role: "reviewer" | "admin";
  active: boolean;
  user_id: string | null;
  invited_by: string | null;
  created_at: string;
  linked_at: string | null;
}

/**
 * Admin operator management. Lists operators and lets an admin invite by email,
 * change role, and deactivate/reactivate. Mutations hit the admin API routes,
 * then router.refresh() re-pulls the server-rendered list.
 */
export function OperatorManager({ initial, meId }: { initial: OperatorRow[]; meId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"reviewer" | "admin">("reviewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const ok = await post("/api/console/operators", { email, role });
    if (ok) {
      setEmail("");
      setRole("reviewer");
    }
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="font-serif text-lg font-semibold text-navy">Invite an operator</h2>
        <p className="mt-1 text-sm text-navy/60">
          They can sign in with this email (password or Google/Apple). Access
          starts immediately; their account links on first sign-in.
        </p>
        <form onSubmit={invite} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            className="field-input flex-1"
            placeholder="operator@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="field-input sm:w-40"
            value={role}
            onChange={(e) => setRole(e.target.value as "reviewer" | "admin")}
          >
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn-primary sm:w-32" disabled={busy}>
            {busy ? "Adding…" : "Invite"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-verdict-red">{error}</p>}
      </section>

      <section className="card">
        <h2 className="font-serif text-lg font-semibold text-navy">
          Operators ({initial.length})
        </h2>
        <div className="mt-3 divide-y divide-navy/10">
          {initial.length === 0 && (
            <p className="py-3 text-sm text-navy/60">No operators yet.</p>
          )}
          {initial.map((op) => {
            const isMe = op.id === meId;
            return (
              <div key={op.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-navy">
                    {op.email}
                    {isMe && <span className="ml-2 text-xs text-navy/50">(you)</span>}
                  </p>
                  <p className="text-xs text-navy/50">
                    {op.role}
                    {" · "}
                    {op.active ? "active" : "deactivated"}
                    {" · "}
                    {op.user_id ? "signed in" : "invited, not yet signed in"}
                  </p>
                </div>

                {/* Role toggle — disabled for your own row. */}
                <button
                  type="button"
                  className="btn-secondary px-3 py-1 text-xs"
                  disabled={busy || isMe}
                  onClick={() =>
                    post(`/api/console/operators/${op.id}`, {
                      role: op.role === "admin" ? "reviewer" : "admin",
                    })
                  }
                >
                  {op.role === "admin" ? "Make reviewer" : "Make admin"}
                </button>

                {/* Active toggle — disabled for your own row. */}
                <button
                  type="button"
                  className="btn-secondary px-3 py-1 text-xs"
                  disabled={busy || isMe}
                  onClick={() =>
                    post(`/api/console/operators/${op.id}`, { active: !op.active })
                  }
                >
                  {op.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
