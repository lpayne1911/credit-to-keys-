/**
 * Review console — operator management. Admin-only: invite operators by email,
 * change roles, and deactivate/reactivate access. Gated by operator auth; a
 * non-admin operator gets a 404 (the page simply doesn't exist for them).
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getConsoleOperator, isConsoleConfigured } from "@/lib/console-auth";
import { listOperators } from "@/lib/operators";
import { ConsoleLogin } from "@/components/ConsoleLogin";
import { LogoutButton } from "@/components/LogoutButton";
import { OperatorManager } from "@/components/OperatorManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operators — Review console" };

export default async function OperatorsPage() {
  const me = await getConsoleOperator();
  if (!me) {
    return (
      <main className="min-h-screen bg-navy/5 px-4 py-16">
        <ConsoleLogin configured={isConsoleConfigured()} />
      </main>
    );
  }
  if (me.role !== "admin") notFound();

  const operators = await listOperators();

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-navy/10 bg-navy text-cream">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-serif text-xl font-semibold">Operators</h1>
            <p className="text-xs text-cream/60">
              Manage who can access the review console.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/console" className="text-sm text-cream/80 underline-offset-2 hover:underline">
              ← Deals
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <OperatorManager initial={operators} meId={me.id} />
      </div>
    </main>
  );
}
