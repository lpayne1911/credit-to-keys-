import Link from "next/link";
import { redirect } from "next/navigation";
import { getBuyer } from "@/lib/buyer-auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SignOutButton } from "@/components/account/SignOutButton";

export const metadata = { title: "Account — Driveway Advocate" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const buyer = await getBuyer();
  if (!buyer) redirect("/login?redirectTo=/account");

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy">Account</h1>
            <p className="mt-1 text-slate">Manage your sign-in and see how billing works.</p>
          </div>
          <SignOutButton />
        </div>

        {/* Profile */}
        <div className="mt-8 rounded-2xl border border-edge bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-navy">Profile</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate">Email</dt>
              <dd className="mt-1 text-sm font-semibold text-navy">{buyer.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate">Account ID</dt>
              <dd className="mt-1 truncate font-mono text-xs text-slate">{buyer.id}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate">
            Need to change your email or password? Use the sign-in screen&apos;s reset flow, or
            contact support — we&apos;ll never share your data or sell it to a dealer.
          </p>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/billing" className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
            <p className="font-bold text-navy">Billing &amp; payments</p>
            <p className="mt-1 text-sm text-slate">See what&apos;s due and how charges work.</p>
            <p className="mt-3 text-sm font-bold text-blue">Open billing →</p>
          </Link>
          <Link href="/dashboard" className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
            <p className="font-bold text-navy">Your workspace</p>
            <p className="mt-1 text-sm text-slate">Cases, saved deals, and next steps.</p>
            <p className="mt-3 text-sm font-bold text-blue">Open dashboard →</p>
          </Link>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate">
          We work the buyer&apos;s side only — no commissions, no kickbacks. We don&apos;t sell
          cars, loans, or warranties, and nothing here is legal or financial advice.
        </p>
      </div>
    </DashboardShell>
  );
}
