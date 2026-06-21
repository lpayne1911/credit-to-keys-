import { Disclaimer } from "./Disclaimer";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-navy/10 bg-cream-100">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <Disclaimer />
        <p className="text-xs text-navy/45">
          © {new Date().getFullYear()} Driveway Advocate. On the buyer&apos;s
          side, always.
        </p>
      </div>
    </footer>
  );
}
