import { getFunnel } from "@/lib/funnels";
import { FunnelPage } from "@/components/funnels/FunnelPage";
import { PostSaleOptionsMapSample } from "@/components/funnels/samples";
import { FunnelIntake } from "@/components/funnels/FunnelIntake";

export const metadata = {
  title: "Deal Rescue — Post-Sale Options Review | Driveway Advocate",
  description:
    "Already signed? Deal Rescue helps you understand your options, organize your paperwork, check whether add-ons may be cancellable, and prepare next-step questions. Decision support, not legal advice — results after signing cannot be guaranteed.",
};

const funnel = getFunnel("post-sale-triage")!;

function PostSaleNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-orange/30 bg-orange-soft px-5 py-4">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-orange" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16.2v.1" strokeLinecap="round" />
      </svg>
      <p className="text-sm leading-relaxed text-ink">
        Most auto purchases do not include a &ldquo;buyer&apos;s remorse&rdquo; clause. Options vary
        by contract, state law, lender rules, and product terms. <span className="font-semibold">Results
        after signing cannot be guaranteed.</span> Driveway Advocate helps you organize paperwork,
        identify contract mismatch signals, check whether add-ons may be cancellable, and prepare
        next-step questions. We do not provide legal advice, guarantee refunds, or promise that a
        signed purchase can be reversed.
      </p>
    </div>
  );
}

export default function PostSaleTriagePage() {
  return (
    <FunnelPage
      funnel={funnel}
      notice={<PostSaleNotice />}
      sample={<PostSaleOptionsMapSample />}
      intake={
        <FunnelIntake
          productId="deal-rescue"
          accent="red"
          cta="Review My Post-Sale Options"
          heading="Start your post-sale review"
          blurb="Share what happened and what you'd like to look into. A buyer-side advocate will follow up with your options and next steps."
        />
      }
    />
  );
}
