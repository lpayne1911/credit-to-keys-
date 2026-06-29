import Link from "next/link";
import { ACCENT_CLASSES, type Funnel } from "@/lib/funnels";
import { FunnelIcon } from "./icons";

/**
 * Homepage path button card. One accent per lane; the CTA color teaches the
 * path. Lives on the navy hero, so the card itself is white.
 */
export function PathCard({ funnel }: { funnel: Funnel }) {
  const a = ACCENT_CLASSES[funnel.accent];
  return (
    <div className="flex h-full flex-col rounded-2xl border border-edge bg-white p-6 text-ink shadow-card">
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
        <FunnelIcon name={funnel.heroIcon} className="h-6 w-6" />
      </span>
      <p className={`mt-4 text-xs font-bold uppercase tracking-wide ${a.text}`}>
        {funnel.homeEyebrow}
      </p>
      <h3 className="mt-1 text-lg font-bold text-navy">{funnel.homeTitle}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate">{funnel.homeCopy}</p>
      <Link href={funnel.route} className={`${a.btn} mt-5 w-full text-sm`}>
        {funnel.homeCta}
      </Link>
    </div>
  );
}
