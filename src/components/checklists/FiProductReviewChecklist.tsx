import { Disclaimer } from "@/components/Disclaimer";

/**
 * F&I Product Review — internal analyst checklist content. Operator-only; rendered
 * inside ConsoleChecklistGate. Relocated from the former public page at
 * /services/fi-product-review/analyst-checklist.
 */

const REQUIRED_DOCUMENTS = [
  "Buyer's order / purchase agreement",
  "Retail installment contract or lease agreement",
  "Each F&I product's contract or brochure (coverage, term, mileage, deductible)",
  "Cancellation / refund terms for each product",
  "The finance-office product menu the buyer was shown",
  "Any remaining manufacturer coverage (months / miles)",
  "Down payment, trade payoff, and loan-to-value figures (for GAP)",
];

const REVIEW_SEQUENCE = [
  "Confirm the deal snapshot: vehicle, mileage, condition, signed status, state, and price.",
  "Build the product inventory: list every F&I product with price, term, mileage limit, deductible, and contract status.",
  "Flag completeness: note which fields are missing before judging anything.",
  "Assess each product individually, then roll up to an overall posture.",
  "Draft the challenge list and the cancel-or-keep plan from the per-product findings.",
  "Write the buyer scripts and the document checklist.",
  "Run the final QA pass for safe wording before delivery.",
];

const PRODUCT_CHECKS = [
  {
    product: "Vehicle service contract / extended warranty",
    checks: [
      "Is the price a large add relative to the deal? Note it as a range, not an exact number.",
      "Could coverage overlap with manufacturer protection that may still remain? Confirm where this contract starts.",
      "Are the term, mileage limit, deductible, and exclusions documented in writing?",
    ],
  },
  {
    product: "GAP",
    checks: [
      "Confirm the down payment, any negative equity, and the loan-to-value before weighing value.",
      "Confirm how the GAP waiver interacts with the buyer's insurer and lender terms.",
      "Confirm the cancellation terms; if not visible, mark as needs documents.",
    ],
  },
  {
    product: "Appearance / paint / interior / theft / etch and other add-ons",
    checks: [
      "Treat as optional; check whether it was presented as required and whether it was packed into the payment.",
      "Confirm the term, what it covers, and the cancellation terms in writing.",
      "If presented as required, instruct the buyer to ask for written proof from the lender.",
    ],
  },
];

const RECOMMENDATION_LABELS = [
  {
    label: "Worth considering",
    when: "Price entered and not obviously high, terms reasonably clear, no required claim, no packing.",
  },
  {
    label: "Only if discounted",
    when: "May have value, but the price looks heavy and nothing is misrepresented.",
  },
  {
    label: "Challenge hard",
    when: "Not yet committed, with a pressure or clarity problem — a required hint, packing, unclear coverage, or no price.",
  },
  {
    label: "Cancel if possible",
    when: "Deal is signed or the product is already in the contract and there's a value concern.",
  },
  {
    label: "Dangerous or misrepresented",
    when: "An optional product presented as required, or a large packed charge baked into a signed/contracted deal.",
  },
  {
    label: "Needs documents",
    when: "Too much is missing to make a confident call — gather documents and revisit.",
  },
];

const SAFE_WORDING = [
  "This appears worth challenging.",
  "Ask for written proof from the lender.",
  "Request the cancellation form and written confirmation of any refund, if applicable.",
  "Confirm the terms with the contract or provider.",
  "This is a buyer-side reference point, not a legal determination.",
  "The available documents are not enough to make a high-confidence call.",
];

const FORBIDDEN_WORDING = [
  "This is illegal.",
  "The dealer committed fraud.",
  "You are guaranteed a refund.",
  "You can definitely cancel.",
  "This is the exact fair price.",
  "The lender never requires this.",
  "Stop paying the loan.",
  "This product is always worthless.",
];

const FINAL_QA = [
  "Every estimate is a range with a confidence level — no single exact numbers presented as fact.",
  "No legal or fraud conclusions; observations only.",
  "No guaranteed cancellation, refund, approval, or savings language.",
  "Every cancellation note says request the cancellation form and written confirmation of any refund, if applicable.",
  "Every required-claim note says ask for written proof from the lender.",
  "Buyer-side framing intact: no commissions, no kickbacks, no steering.",
  "Disclaimers present: decision support, not financial, legal, tax, or insurance advice.",
];

export function FiProductReviewChecklist() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-navy/15 bg-navy/[0.04] px-4 py-3">
        <p className="text-sm font-semibold text-navy/80">
          Internal operations reference — not customer advice.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-navy/65">
          This page documents how a human reviewer works the F&amp;I Product Review. It is an
          internal reference, not a deliverable, and not legal, financial, tax, or insurance advice.
        </p>
      </div>

      {/* 1. Reviewer mission */}
      <Block step={1} title="Reviewer mission">
        <Card>
          <p className="text-sm leading-relaxed text-navy/75">
            Give the buyer a clear, buyer-side reference point on the finance-office products on
            their deal: what to challenge, what to ask, and what to gather. Work strictly on the
            buyer&apos;s side — no commissions, no kickbacks, no steering toward any dealer, lender,
            finance office, warranty company, or product provider. Surface observations and
            questions; never issue a legal determination, and never invent a single exact price.
          </p>
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
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-soft text-xs font-semibold text-green">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </Card>
      </Block>

      {/* 4. Product-specific checks */}
      <Block step={4} title="Product-specific checks">
        <div className="space-y-3">
          {PRODUCT_CHECKS.map((p) => (
            <Card key={p.product}>
              <h3 className="font-serif text-base font-semibold text-navy">{p.product}</h3>
              <div className="mt-2">
                <BulletList items={p.checks} />
              </div>
            </Card>
          ))}
        </div>
      </Block>

      {/* 5. Recommendation labels */}
      <Block step={5} title="Recommendation labels">
        <div className="space-y-2.5">
          {RECOMMENDATION_LABELS.map((l) => (
            <div key={l.label} className="rounded-xl border border-navy/10 bg-white p-4 shadow-card">
              <p className="font-serif text-base font-semibold text-navy">{l.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-navy/65">{l.when}</p>
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

      {/* 8. Final QA checklist */}
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
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-soft text-sm font-bold text-green">
          {step}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-green">{title}</h2>
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
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
