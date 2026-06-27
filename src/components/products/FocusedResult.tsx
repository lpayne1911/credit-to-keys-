import Link from "next/link";
import type { FairnessResult } from "@/lib/fairness-engine";
import type { Product } from "@/lib/products/product-catalog";
import type { Answers } from "@/lib/products/focused-flows";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WarrantyCard, FlagCard, ConfidenceBadge } from "@/components/VerdictView";
import { NegotiationScriptCard } from "@/components/NegotiationScriptCard";
import { Disclaimer } from "@/components/Disclaimer";

/**
 * Product-specific result framing. The warranty / APR / add-on checks each get
 * their own headline and "what we checked / what's risky / what to ask next"
 * copy — never the generic deal verdict. Shared visual atoms (WarrantyCard,
 * FlagCard, ConfidenceBadge, dealer script) are reused; the copy is not.
 */
export function FocusedResult({
  product,
  result,
  answers,
}: {
  product: Product;
  result: FairnessResult;
  answers: Answers;
}) {
  const focus = product.focus;
  const realFlags = result.flags.filter((f) => f.severity !== "info");
  const infoFlags = result.flags.filter((f) => f.severity === "info");
  const alreadySigned = answers.signed === true;

  // Echo the vehicle the buyer selected (warranty check), so the result shows
  // what it was scored against. APR/add-on flows collect no vehicle → no line.
  const vehicleName = [answers.year, answers.make, answers.model, answers.trim]
    .filter((v) => v !== undefined && v !== "" && v !== "idk")
    .join(" ")
    .trim();

  const heading =
    focus === "warranty"
      ? "Your warranty fairness check"
      : focus === "apr"
        ? "Your rate & payment check"
        : "Your add-ons & fees check";

  const checkedLine =
    focus === "warranty"
      ? "We compared the service-contract price to a fair range for this vehicle and coverage."
      : focus === "apr"
        ? "We compared your rate, term, and payment against what your credit band typically qualifies for."
        : "We sorted each line item into its real category — junk, negotiable, government, or service contract.";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>{product.emoji}</span>
          <ConfidenceBadge level={result.confidence} />
        </div>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-navy">{heading}</h1>
        {vehicleName && (
          <p className="mt-1 text-sm font-semibold text-navy/80">{vehicleName}</p>
        )}
        <p className="mt-1.5 text-sm text-navy/65">{checkedLine}</p>

        {/* What looks risky / okay */}
        <div className="mt-6 space-y-4">
          {focus === "warranty" && result.warranty ? (
            <WarrantyCard warranty={result.warranty} />
          ) : realFlags.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
                What looks risky
              </h2>
              <ul className="space-y-3">
                {realFlags.map((f, i) => (
                  <FlagCard key={i} flag={f} />
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-verdict-green/25 bg-verdict-green/5 p-4 text-sm text-navy/75">
              Nothing here jumped out against our estimates. That doesn&apos;t guarantee
              it&apos;s perfect — confirm the details, and consider a human review if
              you&apos;re unsure.
            </div>
          )}

          {/* Government / legitimate items kept separate (add-on check) */}
          {focus === "addons" && infoFlags.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
                Legitimate / itemize — not junk
              </h2>
              <ul className="space-y-2">
                {infoFlags.map((f, i) => (
                  <li key={i} className="rounded-lg border border-navy/10 bg-cream-100 px-4 py-3 text-sm text-navy/65">
                    <span className="font-medium text-navy/80">{f.title}.</span> {f.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* What to say / ask next */}
        <div className="mt-6">
          <NegotiationScriptCard result={result} offeredApr={focus === "apr" ? (answers.apr === "idk" ? null : Number(answers.apr) || null) : null} />
        </div>

        {/* What would improve confidence */}
        {result.confidenceReasons.length > 0 && (
          <details className="mt-5 rounded-xl border border-navy/10 bg-white px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-navy/70">
              What affects this estimate →
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-navy/60">
              {result.confidenceReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </details>
        )}

        {/* Already-signed escalation (no promises) */}
        {alreadySigned && (
          <div className="mt-5 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-navy/75">
            Already signed? You may still have options to review or cancel some
            products — we can&apos;t promise a cancellation or refund, but{" "}
            <Link href="/deal-rescue" className="font-semibold text-gold-dark hover:underline">
              start a deal rescue
            </Link>{" "}
            and we&apos;ll help you organize it.
          </div>
        )}

        {/* Next steps — route by need, always offer a human */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <NextLink href="/human-review" label="Get human review" />
          {focus !== "warranty" && <NextLink href="/warranty-check" label="Check warranty" />}
          {focus !== "apr" && <NextLink href="/apr-check" label="Check APR" />}
          {focus !== "addons" && <NextLink href="/add-on-check" label="Review add-ons" />}
          <NextLink href="/check" label="Full deal check" />
        </div>

        <div className="mt-6">
          <Disclaimer variant="compact" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function NextLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-navy/15 px-3 py-2.5 text-center text-sm font-semibold text-navy hover:border-navy/40"
    >
      {label}
    </Link>
  );
}
