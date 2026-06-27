import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-navy/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-serif text-lg font-semibold text-navy">
            Driveway Advocate
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/#how-it-works"
            className="hidden text-sm font-semibold text-navy/70 hover:text-navy sm:block"
          >
            How it works
          </Link>
          <Link href="/check" className="btn-primary px-4 py-2 text-sm">
            Check my deal
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  // Simple gold shield mark — trust without alarm.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"
        fill="#C8923A"
      />
      <path
        d="M9 12.5l2 2 4-4.5"
        fill="none"
        stroke="#FCFBF8"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
