import Link from "next/link";
import { NAV_LINKS } from "@/lib/products/product-catalog";
import { MobileNav } from "./MobileNav";

export function SiteHeader() {
  const links = NAV_LINKS.filter((l) => !l.primary);
  const primary = NAV_LINKS.find((l) => l.primary);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 text-white backdrop-blur-xl supports-[backdrop-filter]:bg-navy/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <Logo />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-white">
              Driveway Advocate
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
              Your advocate. Your terms.
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white lg:inline-flex"
          >
            Workspace
          </Link>
          {primary && (
            <Link href={primary.href} className="btn-outline-light hidden lg:inline-flex">
              Review my deal
            </Link>
          )}
          <MobileNav links={links} primary={primary} />
        </div>
      </div>
    </header>
  );
}

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  // Gold shield mark with a soft glow ring — trust without alarm.
  return (
    <span className="relative inline-flex">
      <span className="absolute inset-0 -z-10 rounded-full bg-gold/30 blur-md transition group-hover:bg-gold/45" />
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="shield-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E3BC78" />
            <stop offset="1" stopColor="#C98A12" />
          </linearGradient>
        </defs>
        <path
          d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"
          fill="url(#shield-g)"
        />
        <path
          d="M9 12.5l2 2 4-4.5"
          fill="none"
          stroke="#0B1F3A"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
