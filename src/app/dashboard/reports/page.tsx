import { ReportsList } from "@/components/workspace/ReportsList";

export const metadata = { title: "My Reports — Driveway Advocate" };

export default function DashboardReportsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">My Reports</h1>
      <p className="mt-1 max-w-2xl text-slate">
        Every Quote Review, Target Deal Sheet, and Post-Sale Triage you run is saved here so you
        can reopen it anytime.
      </p>
      <ReportsList />
    </div>
  );
}
