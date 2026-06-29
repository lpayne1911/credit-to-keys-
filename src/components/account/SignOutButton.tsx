"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Buyer sign-out: clears the Supabase session, then refreshes the dashboard. */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="text-sm font-semibold text-slate hover:text-navy"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/account/logout", { method: "POST" });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
