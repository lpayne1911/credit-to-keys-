import type { ReactNode } from "react";

/**
 * One cell of the Driveway Red Flag Matrix™. Hovering (or focusing) lifts the
 * card and reveals an extra "what we look for" line — depth on demand without a
 * click. CSS-only (group-hover/focus-within), so it stays a server component.
 */
export function MatrixCard({
  index,
  title,
  body,
  detail,
  icon,
}: {
  index: number;
  title: string;
  body: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      className="group relative overflow-hidden rounded-2xl border border-navy/10 bg-white/80 p-5 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
    >
      {/* Gradient wash that warms up on hover. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/0 to-gold/0 transition-colors duration-300 group-hover:from-gold/[0.06] group-hover:to-paleblue/40" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/5 text-gold-dark ring-1 ring-navy/10 transition group-hover:bg-gold/10 group-hover:text-gold-dark">
            {icon}
          </span>
          <span className="font-serif text-2xl font-bold text-navy/12 transition group-hover:text-gold/40">
            {String(index).padStart(2, "0")}
          </span>
        </div>
        <h3 className="mt-3 text-base font-bold text-navy">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate">{body}</p>

        {/* Revealed detail row. Animates open on hover/focus. */}
        <div className="grid grid-rows-[0fr] transition-all duration-300 group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <p className="mt-3 border-t border-navy/10 pt-3 text-xs font-medium leading-relaxed text-navy/70">
              <span className="font-bold text-gold-dark">What we look for: </span>
              {detail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
