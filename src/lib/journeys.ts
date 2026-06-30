/**
 * ============================================================================
 *  Journeys — the buyer-state router layer that sits ABOVE the product pages.
 * ============================================================================
 *
 * The homepage asks "Where are you in the car-buying process?" and sends buyers
 * to one of three transition pages. Each journey page leads with the buyer's
 * situation, offers one clear primary next step, and lists secondary escape
 * routes into the pages we already built — so no branch is a dead end and a
 * buyer never has to understand our product names first.
 *
 * This is a hallway layer. It does NOT replace any destination page; every
 * `href` points at an existing route. Color reuses the funnel accents: GREEN
 * deal-in-hand, BLUE still-shopping, RED already-signed.
 */
import type { Accent } from "@/lib/funnels";
import type { FunnelIconName } from "@/components/funnels/icons";

export interface JourneyOption {
  href: string;
  icon: FunnelIconName;
  title: string;
  desc: string;
}

export interface Journey {
  id: string;
  accent: Accent;
  eyebrow: string;
  /** Big hero headline — the buyer's situation, said plainly. */
  headline: string;
  subhead: string;
  /** The one obvious next step. */
  primary: { href: string; label: string; desc: string };
  /** Secondary ways in — focused tools, alternatives, returning-user routes. */
  optionsTitle: string;
  options: JourneyOption[];
  /** Trust bridge for buyers who aren't ready to upload anything. */
  sampleHref?: string;
}

export const JOURNEYS: Journey[] = [
  /* 🟢 Deal in hand */
  {
    id: "deal-in-hand",
    accent: "green",
    eyebrow: "Deal in hand",
    headline: "You have a deal in front of you.",
    subhead:
      "Upload the quote, buyer's order, or payment worksheet. We check the price, fees, financing, add-ons, and trade-in, then hand you a plain-English pushback plan.",
    primary: {
      href: "/quote-review/intake",
      label: "Scan My Deal",
      desc: "Upload your quote or buyer's order and get a full red-flag review with a pushback script.",
    },
    optionsTitle: "Other ways in",
    options: [
      {
        href: "/check",
        icon: "search",
        title: "Free Red-Flag Scan",
        desc: "A fast, tap-first check when you just need a quick read on the numbers.",
      },
      {
        href: "/quote-review",
        icon: "doc",
        title: "How quote review works",
        desc: "See the full review process and exactly what you'll get before you upload.",
      },
      {
        href: "/human-review",
        icon: "user",
        title: "Want a human advocate?",
        desc: "Have a real advocate review your deal for a deeper second set of eyes.",
      },
      {
        href: "/warranty-check",
        icon: "shieldAlert",
        title: "Check just the warranty / VSC",
        desc: "Focused review of an extended warranty or service contract on the deal.",
      },
      {
        href: "/apr-check",
        icon: "chart",
        title: "Check just the APR / payment",
        desc: "Focused review of your rate, term, and monthly payment.",
      },
      {
        href: "/add-on-check",
        icon: "listCheck",
        title: "Check just the fees / add-ons",
        desc: "Focused review of dealer fees and packed-in add-on products.",
      },
    ],
    sampleHref: "/sample",
  },

  /* 🔵 Still shopping */
  {
    id: "still-shopping",
    accent: "blue",
    eyebrow: "Still shopping",
    headline: "You haven't committed yet.",
    subhead:
      "Know your target price, payment, APR, and negotiation plan before you walk in. Start with the market, then build the plan that fits how you're buying.",
    primary: {
      href: "/market-check",
      label: "Run a Market Check",
      desc: "See real local pricing for the car you want — no signup required.",
    },
    optionsTitle: "Where to go next",
    options: [
      {
        href: "/build-my-plan",
        icon: "target",
        title: "Build My Plan",
        desc: "A custom Target Deal Sheet, fee checklist, and negotiation game plan.",
      },
      {
        href: "/credit-to-keys",
        icon: "key",
        title: "Credit to Keys",
        desc: "Buying in 3–9 months? A guided prepare → qualify → buy pathway.",
      },
      {
        href: "/concierge",
        icon: "handshake",
        title: "Have us handle it",
        desc: "Premium done-for-you: we source, negotiate, and handle the paperwork.",
      },
      {
        href: "/services",
        icon: "clipboard",
        title: "See all services",
        desc: "Browse the full catalog of checks and advocate services.",
      },
    ],
    sampleHref: "/sample",
  },

  /* 🔴 Already signed */
  {
    id: "already-signed",
    accent: "red",
    eyebrow: "Already signed",
    headline: "You already signed — don't panic.",
    subhead:
      "Let's map what may be cancellable, disputable, or worth escalating. Results after signing can't be guaranteed, but you don't have to figure out your options alone.",
    primary: {
      href: "/post-sale-triage",
      label: "Review My Options",
      desc: "Upload your signed paperwork and get a post-sale options map and next-step plan.",
    },
    optionsTitle: "Other ways in",
    options: [
      {
        href: "/post-sale-triage/intake",
        icon: "upload",
        title: "Start triage now",
        desc: "Go straight to uploading your contract, add-ons, and finance paperwork.",
      },
      {
        href: "/services",
        icon: "clipboard",
        title: "See all services",
        desc: "Browse the full catalog if you're not sure where to start.",
      },
      {
        href: "/dashboard",
        icon: "summary",
        title: "Return to my dashboard",
        desc: "Already a client? Pick up your case where you left off.",
      },
    ],
    sampleHref: "/sample",
  },
];

export function getJourney(id: string): Journey | undefined {
  return JOURNEYS.find((j) => j.id === id);
}
