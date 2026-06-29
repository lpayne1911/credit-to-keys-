import { ACCENT_CLASSES, type Accent, type FunnelStep } from "@/lib/funnels";
import { FunnelIcon } from "./icons";

/**
 * Numbered step rail. `variant="rail"` is the full funnel-page treatment
 * (icon tile + title + desc + optional time). `variant="compact"` is the
 * homepage "what happens after you choose a path" column.
 */
export function ProcessTimeline({
  steps,
  accent,
  variant = "rail",
}: {
  steps: FunnelStep[];
  accent: Accent;
  variant?: "rail" | "compact";
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <ol className={variant === "compact" ? "space-y-4" : "space-y-5"}>
      {steps.map((s) => (
        <li key={s.n} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${a.bar}`}
            >
              {s.n}
            </span>
            {s.n < steps.length && <span className="mt-1 w-px flex-1 bg-edge" aria-hidden />}
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              {variant === "rail" && (
                <span className={`${a.softText}`}>
                  <FunnelIcon name={s.icon} className="h-4 w-4" />
                </span>
              )}
              <p className="text-sm font-bold text-ink">{s.title}</p>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-slate">{s.desc}</p>
            {s.time && (
              <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wide ${a.text}`}>{s.time}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
