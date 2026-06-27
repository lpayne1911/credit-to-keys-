import type { ReactNode } from "react";

/**
 * A floating "deal artifact" — a small paperwork card / badge that hovers around
 * the hero mockup with a perspective tilt and a slow float. Decorative: hidden
 * from assistive tech and from the layout on small screens (passed via
 * className). Float animation is disabled under prefers-reduced-motion globally.
 */
export function FloatingArtifact({
  children,
  className = "",
  tilt = -8,
  float = "slow",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Y-axis perspective tilt in degrees. */
  tilt?: number;
  float?: "slow" | "slower" | "none";
  /** Animation delay in seconds, to desync the floats. */
  delay?: number;
}) {
  const anim =
    float === "slow"
      ? "animate-float-slow"
      : float === "slower"
        ? "animate-float-slower"
        : "";
  return (
    <div
      aria-hidden
      className={`absolute select-none ${anim} ${className}`}
      style={{ animationDelay: delay ? `${delay}s` : undefined }}
    >
      <div
        className="rounded-2xl border border-white/70 bg-white/85 px-3.5 py-3 shadow-glass backdrop-blur-md"
        style={{
          transform: `perspective(900px) rotateY(${tilt}deg) rotateX(6deg)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
