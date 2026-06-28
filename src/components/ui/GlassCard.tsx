import type { ReactNode } from "react";

/**
 * Glassmorphism panel. The base surface for the modern card system. Defaults to
 * the light cream surface; pass `tone="dark"` for navy sections.
 */
export function GlassCard({
  children,
  className = "",
  tone = "light",
  hover = false,
  gradientBorder = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
  hover?: boolean;
  gradientBorder?: boolean;
}) {
  const base = tone === "dark" ? "glass-dark text-cream" : "glass text-navy";
  return (
    <div
      className={[
        base,
        hover ? "lift" : "",
        gradientBorder ? "ring-gradient" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
