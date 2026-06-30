"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/SiteHeader";

type NavItem = { label: string; href: string; icon: keyof typeof ICONS; soon?: boolean };

// `soon: true` marks sections that aren't built yet — the shell stays navigable
// (the section route renders an honest "coming soon" placeholder), but the badge
// sets expectations before the click instead of pretending the section is live.
const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Services", href: "/dashboard/services", icon: "layers" },
  { label: "My Reports", href: "/dashboard/reports", icon: "reports" },
  { label: "Market Check", href: "/dashboard/market-check", icon: "chart" },
  { label: "Billing", href: "/billing", icon: "card" },
  { label: "Account", href: "/account", icon: "user" },
  { label: "Deal Review", href: "/dashboard/deal-review", icon: "doc", soon: true },
  { label: "Game Plan", href: "/dashboard/game-plan", icon: "target", soon: true },
  { label: "Documents", href: "/dashboard/documents", icon: "folder", soon: true },
  { label: "Scripts", href: "/dashboard/scripts", icon: "chat", soon: true },
  { label: "Saved Vehicles", href: "/dashboard/saved-vehicles", icon: "car", soon: true },
  { label: "Alerts", href: "/dashboard/alerts", icon: "bell", soon: true },
  { label: "Settings", href: "/dashboard/settings", icon: "gear", soon: true },
];

const ICONS = {
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5Z" /><path d="M3 12l9 5 9-5M3 16l9 5 9-5" /></>,
  reports: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  chart: <><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16v-7M16 16v-3" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>,
  doc: <><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4M9 12h6M9 15.5h5" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /></>,
  folder: <path d="M4 7a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Z" />,
  chat: <><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /><path d="M8 9.5h8M8 12.5h5" /></>,
  car: <><path d="M4 13l1.6-4.2A2 2 0 0 1 7.5 7.5h9a2 2 0 0 1 1.9 1.3L20 13v4.5h-2.5M4 17.5V13m0 4.5h2.5M4 13h16" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></>,
  bell: <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
};

function NavIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 text-white">
      <Link href="/" className="group flex items-center gap-2.5 px-5 py-5">
        <Logo className="h-8 w-8" />
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight">Driveway Advocate</span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">Your advocate. Your terms.</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active ? "bg-white/10 text-white ring-1 ring-white/10" : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={active ? "text-gold" : "text-white/60"}><NavIcon name={item.icon} /></span>
              <span className="flex-1">{item.label}</span>
              {item.soon && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/55">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold text-white">Need help?</p>
        <p className="mt-0.5 text-xs text-white/60">Have a person review your deal.</p>
        <Link
          href="/human-review"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          Request Human Review
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 top-0 h-full w-64">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-edge bg-white px-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-navy hover:bg-cream-100 lg:hidden" aria-label="Open menu">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-cream-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Demo · sample data
            </span>
          </div>
          <Link href="/" className="text-sm font-semibold text-navy/70 transition hover:text-navy">
            ← Back to site
          </Link>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
