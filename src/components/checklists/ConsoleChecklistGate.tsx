import Link from "next/link";
import { getConsoleOperator, isConsoleConfigured } from "@/lib/console-auth";
import { ConsoleLogin } from "@/components/ConsoleLogin";
import { LogoutButton } from "@/components/LogoutButton";

/**
 * Operator gate + chrome for the internal analyst checklists. Same auth as the
 * review console (`getConsoleOperator`): a valid Supabase session AND an active
 * operator row. Non-operators see the console login, never the methodology.
 *
 * These pages used to live publicly under /services/*; they were relocated here
 * so internal reviewer logic isn't publicly crawlable.
 */
export async function ConsoleChecklistGate({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const me = await getConsoleOperator();
  if (!me) {
    return (
      <main className="min-h-screen bg-navy/5 px-4 py-16">
        <ConsoleLogin configured={isConsoleConfigured()} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-navy/10 bg-navy text-cream">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-serif text-lg font-semibold">{title}</h1>
            <p className="text-xs text-cream/60">Operator reference · {me.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/console"
              className="text-sm text-cream/80 underline-offset-2 hover:underline"
            >
              ← Console
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>
    </main>
  );
}
