import Link from "next/link";

// Placeholder for dashboard sections not built yet (Deal Review, Game Plan,
// Documents, Scripts, Saved Vehicles, Alerts, Settings). Keeps the shell
// navigable without 404s while those features are sequenced.
export default function DashboardSectionPlaceholder({ params }: { params: { rest: string[] } }) {
  const title = (params.rest?.[0] ?? "section")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-slate">
        This part of your dashboard is coming soon. In the meantime, run a Market Check or
        review a quote.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/dashboard/market-check" className="btn-blue text-sm">Market Check</Link>
        <Link href="/quote-review" className="btn-green text-sm">Review My Quote</Link>
      </div>
    </div>
  );
}
