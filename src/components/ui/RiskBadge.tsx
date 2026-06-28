import type { ReactNode } from "react";

export type RiskTone = "warning" | "danger" | "safe" | "info" | "neutral";

const TONES: Record<RiskTone, { wrap: string; dot: string }> = {
  // Orange = caution/junk-fee, Red = serious, Green = safe/fair, gold = info.
  warning: {
    wrap: "bg-flag-orange/12 text-flag-orange ring-flag-orange/30",
    dot: "bg-flag-orange",
  },
  danger: {
    wrap: "bg-flag-red/12 text-flag-red ring-flag-red/30",
    dot: "bg-flag-red",
  },
  safe: {
    wrap: "bg-flag-green/12 text-flag-green ring-flag-green/30",
    dot: "bg-flag-green",
  },
  info: {
    wrap: "bg-gold/12 text-gold-dark ring-gold/30",
    dot: "bg-gold",
  },
  neutral: {
    wrap: "bg-navy/8 text-navy/70 ring-navy/15",
    dot: "bg-navy/60",
  },
};

/**
 * Small status pill used for floating hero tags ("Junk fee detected") and the
 * mockup's risk-flag list. Tone drives color; red/orange/green are reserved for
 * risk semantics exactly as the rest of the product does.
 */
export function RiskBadge({
  children,
  tone = "warning",
  icon,
  className = "",
  pulse = false,
  wrap = false,
}: {
  children: ReactNode;
  tone?: RiskTone;
  icon?: ReactNode;
  className?: string;
  pulse?: boolean;
  /** Allow the label to wrap (for long summary-chip titles); default keeps it on one line. */
  wrap?: boolean;
}) {
  const t = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        wrap ? "text-left" : "whitespace-nowrap"
      } ${t.wrap} ${className}`}
    >
      {icon ?? (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot} ${pulse ? "animate-pulse-ring" : ""}`}
        />
      )}
      {children}
    </span>
  );
}
