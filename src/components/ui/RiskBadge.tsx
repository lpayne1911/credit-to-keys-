import type { ReactNode } from "react";

export type RiskTone =
  | "warning"
  | "danger"
  | "safe"
  | "info"
  | "verify"
  | "neutral";

const TONES: Record<RiskTone, { wrap: string; dot: string }> = {
  // Diagnostic palette only — gold is reserved for brand action, never risk.
  // Amber = caution/push-back, Red = serious, Green = fair, Blue = verify/info.
  warning: {
    wrap: "bg-verdict-amber/12 text-verdict-amber ring-verdict-amber/30",
    dot: "bg-verdict-amber",
  },
  danger: {
    wrap: "bg-verdict-red/12 text-verdict-red ring-verdict-red/30",
    dot: "bg-verdict-red",
  },
  safe: {
    wrap: "bg-verdict-green/12 text-verdict-green ring-verdict-green/30",
    dot: "bg-verdict-green",
  },
  // "Verify first" / informational — blue, NOT gold.
  info: {
    wrap: "bg-verdict-blue/12 text-verdict-blue ring-verdict-blue/30",
    dot: "bg-verdict-blue",
  },
  verify: {
    wrap: "bg-verdict-blue/12 text-verdict-blue ring-verdict-blue/30",
    dot: "bg-verdict-blue",
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
