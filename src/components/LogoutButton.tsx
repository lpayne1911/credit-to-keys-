"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/console/logout", { method: "POST" });
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-lg border border-cream/25 px-3 py-1.5 text-sm font-medium text-cream/85 hover:bg-cream/10"
    >
      Sign out
    </button>
  );
}
