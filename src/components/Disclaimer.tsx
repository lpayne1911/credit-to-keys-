/**
 * Decision-support (NOT advice) disclaimer.
 *
 * COMPLIANCE: This must appear persistently on the landing page and on every
 * verdict. Driveway Advocate provides decision support, not financial or legal
 * advice, and is strictly buyer-side — it never takes money from or steers
 * buyers toward dealers, lenders, F&I offices, or warranty companies.
 */
export function Disclaimer({ variant = "full" }: { variant?: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <p className="text-xs leading-relaxed text-navy/55">
        Driveway Advocate provides decision support, not financial or legal
        advice. We&apos;re strictly buyer-side — we never take money from dealers,
        lenders, or warranty companies. Estimates are ranges, not exact prices.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-navy/10 bg-cream-100 px-4 py-3">
      <p className="text-xs leading-relaxed text-navy/60">
        <span className="font-semibold text-navy/75">
          Decision support, not advice.
        </span>{" "}
        Driveway Advocate gives you a reference point for car deals and extended
        warranties. It is not financial or legal advice. We are strictly on the
        buyer&apos;s side: we never take money from, or steer you toward, any
        dealer, lender, finance office, or warranty company. Every estimate is a
        range with a confidence level — exact prices vary, and we never invent a
        precise &quot;fair price.&quot;
      </p>
    </div>
  );
}
