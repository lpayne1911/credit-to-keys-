import Link from "next/link";
import { FUNNELS, ACCENT_CLASSES, type Funnel } from "@/lib/funnels";
import { FunnelIcon } from "@/components/funnels/icons";

export const metadata = { title: "Services — Driveway Advocate" };

/**
 * Per-service delivery status + dashboard entry point. Kept honest: only Quote
 * Review runs an automated engine today (intake → Deal Review). The others are
 * intake/lead-capture or human-delivered, so they link to their funnel page and
 * say so plainly rather than implying an instant result.
 */
type Delivery = {
  badge: string;
  live: boolean;
  blurb: string;
  href: string;
  cta: string;
};

const DELIVERY: Record<string, Delivery> = {
  "quote-review": {
    badge: "Live",
    live: true,
    blurb:
      "Submit your dealer paperwork and get an automated Deal Review — price benchmark, junk-fee flags, risky-term checks, and a custom pushback script.",
    href: "/quote-review/intake",
    cta: "Start a review",
  },
  "build-my-plan": {
    badge: "Live",
    live: true,
    blurb:
      "Tell us the car you're after and your financing profile. We build a Target Deal Sheet™ — target price, fee checklist, financing benchmark, and a negotiation game plan.",
    href: "/build-my-plan/intake",
    cta: "Build my plan",
  },
  concierge: {
    badge: "By application",
    live: false,
    blurb:
      "A buyer advocate sources, negotiates, and handles the paperwork end-to-end. Scope and flat fee are confirmed on a discovery call.",
    href: "/concierge",
    cta: "Apply",
  },
  "post-sale-triage": {
    badge: "By request",
    live: false,
    blurb:
      "Already signed? We review your contract, flag cancellable add-ons, and map your next steps. Outcomes after signing can't be guaranteed.",
    href: "/post-sale-triage",
    cta: "Start triage",
  },
};

function ServiceCard({ funnel }: { funnel: Funnel }) {
  const a = ACCENT_CLASSES[funnel.accent];
  const d = DELIVERY[funnel.id];
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-edge bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
      <div className={`h-1 w-full ${a.bar}`} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
            <FunnelIcon name={funnel.heroIcon} className="h-5 w-5" />
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              d.live ? `${a.soft} ${a.softText}` : "border border-edge bg-cream-100 text-slate"
            }`}
          >
            {d.live && <span className={`h-1.5 w-1.5 rounded-full ${a.bar}`} />}
            {d.badge}
          </span>
        </div>

        <p className={`mt-4 text-xs font-bold uppercase tracking-wide ${a.text}`}>{funnel.eyebrow}</p>
        <p className="mt-1 text-lg font-extrabold tracking-tight text-navy">{funnel.title}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{d.blurb}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-navy">{funnel.pricing.amount}</span>
          <Link href={d.href} className={`${a.btn} text-sm`}>
            {d.cta} →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Services</h1>
      <p className="mt-1 max-w-2xl text-slate">
        Four ways to get help, depending on where you are in the process. Quote Review runs an
        automated Deal Review now; the others capture your details and a human advocate follows up.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {FUNNELS.map((funnel) => (
          <ServiceCard key={funnel.id} funnel={funnel} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-edge bg-cream-100 px-5 py-4 text-sm text-slate">
        Buyer-side only. No commissions, no kickbacks, no advance fees — you make the final decision.
      </div>
    </div>
  );
}
