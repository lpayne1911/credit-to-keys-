import { Disclaimer } from "@/components/Disclaimer";

/**
 * Used-Car Risk Report — internal analyst checklist content. Operator-only;
 * rendered inside ConsoleChecklistGate. Relocated from the former public page at
 * /services/used-car-risk-report/analyst-checklist.
 */

const MISSION = [
  "Protect buyer clarity — make the risk easy to understand.",
  "Identify risks before the buyer signs.",
  "Separate known facts from unknowns; never fill gaps with assumptions.",
  "Avoid fake precision — use ranges and confidence levels, never a single value.",
  "Avoid title, legal, mechanical, and safety conclusions.",
  "Stay strictly buyer-side: no commissions, no kickbacks, no steering.",
];

const REQUIRED_DOCUMENTS = [
  "Full vehicle history report for the VIN",
  "The dealer listing",
  "Buyer's order or written quote",
  "The full out-the-door quote, itemized",
  "Title disclosure or the title document, if available",
  "Independent pre-purchase inspection report, if available",
  "Open-recall check by VIN",
  "CPO inspection paperwork, if CPO is claimed",
  "Warranty or service-contract documents, if relevant",
  "Retail installment contract, if already signed",
];

const REVIEW_SEQUENCE = [
  "Confirm vehicle identity (year, make, model, trim, VIN).",
  "Extract mileage, seller type, asking price, and out-the-door price.",
  "Review title status against the title document or disclosure.",
  "Review accident / damage history.",
  "Review use history (personal, rental, fleet, commercial, rideshare).",
  "Review owner history.",
  "Check recall, CPO, and warranty clues.",
  "Identify missing documents and mark them explicitly.",
  "Create inspection priorities.",
  "Create seller questions.",
  "Assign the final recommendation label.",
  "Add the compliance language and disclaimers.",
];

const RISK_CHECKS = [
  {
    area: "Title",
    checks: [
      "Clean / rebuilt / salvage / branded / lemon-buyback claims.",
      "Whether the actual title document (not just the listing) was reviewed.",
      "Whether the disclosure matches the listing.",
    ],
  },
  {
    area: "Accident / damage",
    checks: [
      "Severity of any reported accident.",
      "Airbag-deployment clues.",
      "Structural / frame language in the records.",
      "Repair-quality questions, and whether an inspection is needed.",
    ],
  },
  {
    area: "Prior use",
    checks: [
      "Rental / fleet / commercial / rideshare indicators.",
      "Maintenance records and wear-and-tear clues.",
      "Whether the price reflects the use history.",
    ],
  },
  {
    area: "Pricing",
    checks: [
      "Asking price relative to the risk found.",
      "Out-the-door price availability and itemization.",
      "Dealer fees and add-ons.",
      "Too-good-to-be-true concern.",
      "What needs written clarification.",
    ],
  },
  {
    area: "Inspection",
    checks: [
      "Independent pre-purchase inspection by a mechanic the buyer chooses.",
      "Body / frame review.",
      "Mechanical review.",
      "Tire / brake / wear review.",
      "Diagnostic scan, if appropriate.",
    ],
  },
  {
    area: "CPO / recalls",
    checks: [
      "CPO paperwork and the CPO inspection checklist.",
      "Open-recall status by VIN.",
      "Warranty transferability.",
    ],
  },
];

const RECOMMENDATION_LABELS = [
  {
    label: "Low concern",
    when: "Clean title confirmed, no accidents reported, personal use, reasonable mileage, price/OTD provided, history checked, no rushing.",
    notSay: "Don't say the car is problem-free or guaranteed reliable.",
    safe: "Based on the information reviewed, nothing major stands out — still recommend an independent inspection.",
  },
  {
    label: "Inspect first",
    when: "Moderate or unclear accident history, high mileage, missing history, unchecked recalls, CPO to verify, or a too-good price.",
    notSay: "Don't predict the inspection outcome.",
    safe: "This appears worth an independent inspection before moving forward.",
  },
  {
    label: "Slow down",
    when: "Dealer rushing, missing OTD price, unclear title/history, mileage concerns, or rental/fleet/commercial use.",
    notSay: "Don't tell the buyer to sign or not sign.",
    safe: "There's reason to slow down and get the missing details in writing before deciding.",
  },
  {
    label: "Renegotiate or verify",
    when: "Meaningful risk that isn't a walk-away; price may need adjustment; documents or inspection could change the answer.",
    notSay: "Don't promise a specific price or savings.",
    safe: "Verify the title, history, and condition independently — the results may change the price or the decision.",
  },
  {
    label: "Walk away",
    when: "Salvage/lemon title, structural damage, airbag deployment, a rebuilt title without verification, a seller discouraging inspection, or multiple severe flags together.",
    notSay: "Don't call the car unsafe or accuse anyone of wrongdoing.",
    safe: "This is a strong walk-away signal that deserves independent verification before moving forward.",
  },
  {
    label: "Needs documents",
    when: "Too much is missing — title status, accident history, mileage, price, or no documents reviewed.",
    notSay: "Don't make a confident call without the documents.",
    safe: "The available documents are not enough to make a high-confidence call.",
  },
];

const SAFE_WORDING = [
  "This is a buyer-side reference point based on the information reviewed.",
  "This deserves independent verification before moving forward.",
  "Ask for the title document or a written title-status disclosure.",
  "Request the full out-the-door price in writing.",
  "Get an independent inspection before signing.",
  "Confirm recall, CPO, warranty, and title details with the appropriate source.",
  "This is a strong walk-away signal, not a legal conclusion.",
  "The available documents are not enough to make a high-confidence call.",
];

const FORBIDDEN_WORDING = [
  "This car is unsafe.",
  "This title is illegal.",
  "The seller committed fraud.",
  "You are guaranteed a refund.",
  "You can unwind the deal.",
  "This is the exact value.",
  "This vehicle will fail.",
  "Stop paying the loan.",
  "This is a legal finding.",
];

const FINAL_QA = [
  "No safety conclusion.",
  "No title / legal conclusion.",
  "No fraud accusation.",
  "No refund / unwind guarantee.",
  "No exact-value claim.",
  "Known facts are separated from unknowns.",
  "All missing documents are marked.",
  "Inspection priorities are included.",
  "Seller questions are included.",
  "A recommendation label is assigned.",
  "A confidence level is assigned.",
  "The disclaimer is included.",
];

export function UsedCarRiskChecklist() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-navy/15 bg-navy/[0.04] px-4 py-3">
        <p className="text-sm font-semibold text-navy/80">
          Internal operations reference — not customer advice.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-navy/65">
          This documents how a human Driveway Advocate reviewer completes a Used-Car Risk Report. It
          is an internal reference, not a deliverable, and not legal, financial, tax, insurance,
          title, mechanical, or safety advice.
        </p>
      </div>

      {/* 1. Mission */}
      <Block step={1} title="Reviewer mission">
        <Card>
          <BulletList items={MISSION} />
        </Card>
      </Block>

      {/* 2. Required documents */}
      <Block step={2} title="Required documents">
        <Card>
          <BulletList items={REQUIRED_DOCUMENTS} />
        </Card>
      </Block>

      {/* 3. Review sequence */}
      <Block step={3} title="Review sequence">
        <Card>
          <ol className="space-y-2.5">
            {REVIEW_SEQUENCE.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-navy/75">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-soft text-xs font-semibold text-blue">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </Card>
      </Block>

      {/* 4. Risk-specific checks */}
      <Block step={4} title="Risk-specific checks">
        <div className="space-y-3">
          {RISK_CHECKS.map((g) => (
            <Card key={g.area}>
              <h3 className="font-serif text-base font-semibold text-navy">{g.area}</h3>
              <div className="mt-2">
                <BulletList items={g.checks} />
              </div>
            </Card>
          ))}
        </div>
      </Block>

      {/* 5. Recommendation labels */}
      <Block step={5} title="Recommendation labels">
        <div className="space-y-3">
          {RECOMMENDATION_LABELS.map((l) => (
            <div key={l.label} className="rounded-xl border border-navy/10 bg-white p-4 shadow-card">
              <p className="font-serif text-base font-semibold text-navy">{l.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-navy/70">
                <span className="font-semibold text-navy/80">When:</span> {l.when}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-navy/70">
                <span className="font-semibold text-navy/80">What not to say:</span> {l.notSay}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-navy/70">
                <span className="font-semibold text-navy/80">Safe wording:</span> “{l.safe}”
              </p>
            </div>
          ))}
        </div>
      </Block>

      {/* 6. Safe wording library */}
      <Block step={6} title="Safe wording library">
        <div className="rounded-2xl border border-verdict-green/25 bg-verdict-green/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-verdict-green">
            Use wording like this
          </p>
          <ul className="mt-3 space-y-2">
            {SAFE_WORDING.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy/75">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-verdict-green" />
                <span>“{s}”</span>
              </li>
            ))}
          </ul>
        </div>
      </Block>

      {/* 7. Phrases reviewers must not use */}
      <Block step={7} title="Phrases reviewers must not use">
        <div className="rounded-2xl border border-verdict-red/25 bg-verdict-red/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-verdict-red">Do not say</p>
          <p className="mt-2 text-sm text-navy/65">
            These are training warnings. They must never appear in a customer-facing report.
          </p>
          <ul className="mt-3 space-y-2">
            {FORBIDDEN_WORDING.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy/70">
                <span className="mt-0.5 shrink-0 font-bold text-verdict-red" aria-hidden>
                  ✕
                </span>
                <span className="line-through decoration-verdict-red/40">“{s}”</span>
              </li>
            ))}
          </ul>
        </div>
      </Block>

      {/* 8. Final QA */}
      <Block step={8} title="Final QA checklist before delivery">
        <Card>
          <ul className="space-y-2">
            {FINAL_QA.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy/75">
                <span className="mt-0.5 shrink-0 font-bold text-verdict-green" aria-hidden>
                  ✓
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Block>

      <Disclaimer />
    </div>
  );
}

function Block({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-soft text-sm font-bold text-blue">
          {step}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-blue">{title}</h2>
        <span className="h-px flex-1 bg-navy/10" />
      </div>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy/75">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
