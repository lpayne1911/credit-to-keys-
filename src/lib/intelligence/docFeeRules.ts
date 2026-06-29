/**
 * ============================================================================
 *  DocFeeRules v1 — state-by-state dealer documentation/processing fee
 *  intelligence for Driveway Advocate.
 * ============================================================================
 *
 *  WHAT THIS IS
 *  A source-backed dataset + classifier that lets the product say, per state,
 *  whether a dealer "doc / processing / admin" fee is capped, uncapped,
 *  formula-based, disclosure-regulated, or unverified — and what the buyer
 *  should do about it. A doc/processing fee is, in every state, a
 *  DEALER-CONTROLLED charge — never a required government fee. That single fact
 *  is safe to state everywhere; the cap details are not, so they are sourced.
 *
 *  VERIFICATION LIFECYCLE (verificationStatus)
 *    - "verified"      : rule confirmed against an official/authoritative source
 *                        in a verification pass; only these earn high confidence
 *                        AND are used for cap-overage comparisons.
 *    - "seeded"        : rule has a source but has not been through the formal
 *                        verification pass; confidence capped at "medium"; the
 *                        classifier does NOT compare a fee to a seeded cap.
 *    - "needs_research": not yet researched; scaffold only, no fabricated data.
 *
 *  SOURCE HIERARCHY (most → least authoritative)
 *    1. official_state   — state DMV/MVA/dealer-board pages
 *    2. statute          — state statutes / administrative code
 *    3. dealer_association— state dealer/notary association guidance
 *    4. consumer_reference— reputable consumer datasets (Edmunds, CarEdge…)
 *    5. secondary_reference — compiled tables / aggregators (lowest)
 *
 *  RULES OF THE ROAD (do not violate)
 *    - Every completed rule carries a real source URL + title + type + a quote
 *      or faithful paraphrase + a lastVerified date + a confidence level.
 *    - We never invent a cap or a source. A state we can't verify stays
 *      `seeded` or `needs_research` — never force-verified.
 *    - Caps that adjust annually (OH, PA, IL CPI formulas) are marked `formula`
 *      or carry a limitation that the dollar figure updates yearly.
 *    - Where sources conflict (e.g. AZ), we do NOT hide it: the rule is marked
 *      `unknown` and the conflict is recorded in `limitations`.
 *    - taxable / mustBeDisclosed are tri-state: `null` means not confirmed.
 *    - Buyer-facing copy is decision-support, never an accusation or a legal
 *      conclusion: no "fraud", "scam", "illegal", "guaranteed", "definitely",
 *      "violates law", etc.
 *
 *  VERIFICATION PASSES
 *    2026-06-28  Seeded MVP (15 jurisdictions).
 *    2026-06-28  Priority verification pass — confirmed against official/statute
 *                sources: CA, NY, TX, OH, FL, VA, MD. Added DE (seeded). DC kept
 *                seeded (no authoritative "no-cap" statement located). All other
 *                seeded/needs_research states left untouched.
 * ============================================================================
 */

export type DocFeeCapType =
  | "capped" // a fixed statutory dollar cap
  | "uncapped" // no cap; dealer-set
  | "formula" // cap derived from a formula / annual CPI / tier
  | "disclosure_only" // no cap, but the fee's disclosure/advertising is regulated
  | "unknown" // researched, but sources conflict or are inconclusive
  | "needs_research"; // not yet researched this sprint

export type VerificationStatus = "verified" | "seeded" | "needs_research";

export type RuleSourceType =
  | "official_state"
  | "statute"
  | "dealer_association"
  | "consumer_reference"
  | "secondary_reference";

export type Confidence = "high" | "medium" | "low";

export interface DocFeeRule {
  /** Two-letter jurisdiction code, e.g. "MD", "DC". */
  jurisdiction: string;
  stateName: string;
  /** Where this rule sits in the verification lifecycle. */
  verificationStatus: VerificationStatus;
  capType: DocFeeCapType;
  /** The cap in CENTS, when a dollar ceiling applies. */
  maxAmountCents?: number;
  /** Human description when the cap is a formula / tiered / annually adjusted. */
  formulaDescription?: string;
  /** Names this fee commonly travels under in this state. */
  feeNames: string[];
  /** A doc/processing fee is dealer-controlled in every state. */
  dealerControlled: boolean;
  /** A doc/processing fee is NOT a government fee. */
  governmentFee: boolean;
  /** Tri-state: true/false when confirmed, null when not confirmed. */
  taxable: boolean | null;
  /** Tri-state: true/false when confirmed, null when not confirmed. */
  mustBeDisclosed: boolean | null;
  /** Free-text taxable detail, when verified. */
  taxableTreatment?: string;
  /** Free-text disclosure detail, when verified. */
  disclosureRequirement?: string;
  /** Separate e-filing / online-systems fee treatment, when verified. */
  electronicFilingTreatment?: string;
  /** State-level, amount-agnostic buyer explanation. */
  buyerExplanation: string;
  /** State-level, amount-agnostic buyer action. */
  buyerAction: string;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceType?: RuleSourceType;
  /** Exact quote or faithful paraphrase from the cited source. */
  sourceQuote?: string;
  effectiveDate?: string;
  /** ISO date of the last verification/review of this entry. */
  lastVerified: string;
  confidence: Confidence;
  limitations?: string;
}

/* ---------------------------------------------------------------------------
 *  Jurisdictions (50 states + DC)
 * ------------------------------------------------------------------------- */

export const US_JURISDICTIONS: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/* ---------------------------------------------------------------------------
 *  Fee-name aliases — what a doc/processing/admin fee travels under.
 * ------------------------------------------------------------------------- */

export const DOC_FEE_ALIASES: string[] = [
  "doc fee",
  "documentation fee",
  "document fee",
  "document processing",
  "documentary fee",
  "documentary service charge",
  "dealer processing fee",
  "processing fee",
  "administrative fee",
  "admin fee",
  "dealer admin fee",
  "paperwork fee",
  "dealer service fee",
];

/**
 * True when a fee label looks like a dealer doc/processing/admin fee. Guards
 * against warranty/tax/government false positives ("service contract",
 * "state registration", "sales tax") by matching only the qualified aliases
 * above — never a bare "service fee".
 */
export function isDocFeeAlias(feeName: string): boolean {
  if (!feeName) return false;
  const label = feeName.toLowerCase().trim();
  if (/service\s+contract|vehicle\s+service|warranty|\btax\b|registration|title\b|tag\b|license\b/.test(label)) {
    if (!/\bdoc|document|paperwork|processing|admin/.test(label)) return false;
  }
  return DOC_FEE_ALIASES.some((a) => label.includes(a));
}

/* ---------------------------------------------------------------------------
 *  Rules with a real source (verified or seeded)
 * ------------------------------------------------------------------------- */

const VERIFIED = "2026-06-28";

const SOURCED_RULES: DocFeeRule[] = [
  // ---- VERIFIED in the priority pass (official/statute sources) ----
  {
    jurisdiction: "CA",
    stateName: "California",
    verificationStatus: "verified",
    capType: "capped",
    maxAmountCents: 17_500,
    feeNames: ["document processing charge", "doc fee", "documentation fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: true,
    disclosureRequirement:
      "The document processing charge may not be represented to the buyer as a governmental fee.",
    electronicFilingTreatment:
      "A dealer may not charge a separate electronic filing fee to the buyer if it uses a registration service for the e-filing.",
    buyerExplanation:
      "California caps the dealer document processing charge and bars dealers from presenting it as a government fee.",
    buyerAction:
      "Confirm the charge is at or below the cap and shown separately from government title/registration fees.",
    sourceTitle: "SB-1249 Vehicle dealers: document processing charge (Veh. Code §11713.1)",
    sourceUrl:
      "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220SB1249",
    sourceType: "statute",
    sourceQuote:
      "Commencing January 1, 2024, the maximum document processing charge a private industry partner dealer may impose is $175 ($70 for a dealer without a partner agreement); the charge shall not be represented as a governmental fee.",
    effectiveDate: "2024-01-01",
    lastVerified: VERIFIED,
    confidence: "high",
    limitations:
      "Two tiers: $175 (DMV business-partner dealers) vs $70 (non-partner); the verified cap used here is the $175 figure. Supersedes the older $85 figure still cited in some sources. Pending bill SB 791 (2025–26) may change the amount; re-verify.",
  },
  {
    jurisdiction: "NY",
    stateName: "New York",
    verificationStatus: "verified",
    capType: "capped",
    maxAmountCents: 17_500,
    feeNames: ["documentation fee", "doc fee", "dealer processing fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: true,
    disclosureRequirement:
      "The optional dealer registration/title application processing fee is not a New York State or DMV fee and excludes the actual DMV registration, title, and inspection fees.",
    buyerExplanation:
      "New York caps the dealer documentation/processing fee, and it is expressly not a state or DMV charge.",
    buyerAction:
      "Confirm the fee is at or below the cap and that DMV title, registration, and inspection are billed separately at the real state amounts.",
    sourceTitle: "15 NYCRR § 78.19 — Dealers who aid in securing registrations, titles, or plates",
    sourceUrl: "https://www.law.cornell.edu/regulations/new-york/15-NYCRR-78.19",
    sourceType: "statute",
    sourceQuote:
      "The fee charged by the dealer … may not exceed $175. Such fee does not include the fee required to be paid to the DMV for registration or certificate of title, nor the inspection fee.",
    effectiveDate: "2021-08-18",
    lastVerified: VERIFIED,
    confidence: "high",
  },
  {
    jurisdiction: "TX",
    stateName: "Texas",
    verificationStatus: "verified",
    capType: "formula",
    maxAmountCents: 22_500,
    formulaDescription:
      "A documentary fee of $225 or less is presumed reasonable; a fee above $225 requires the dealer to file a cost analysis with the OCCC and justify the amount.",
    feeNames: ["documentary fee", "doc fee", "dealer documentary fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: null,
    buyerExplanation:
      "Texas treats a documentary fee of $225 or less as presumptively reasonable; above that, the dealer must justify it to the state regulator.",
    buyerAction:
      "If the fee is above $225, ask the dealer for the OCCC cost-analysis basis in writing; either way, it is a dealer charge, not a government fee.",
    sourceTitle: "7 Tex. Admin. Code § 84.205 — Documentary Fee (OCCC)",
    sourceUrl: "https://www.law.cornell.edu/regulations/texas/7-Tex-Admin-Code-SS-84-205",
    sourceType: "statute",
    sourceQuote:
      "A documentary fee of $225 or less is presumed reasonable … Before charging a documentary fee greater than $225, a seller must provide a notification and a cost analysis to the OCCC.",
    effectiveDate: "2024-07-11",
    lastVerified: VERIFIED,
    confidence: "high",
    limitations:
      "$225 is a 'presumed reasonable' safe-harbor threshold, not an absolute cap; higher fees are allowed if justified to the OCCC.",
  },
  {
    jurisdiction: "OH",
    stateName: "Ohio",
    verificationStatus: "verified",
    capType: "formula",
    maxAmountCents: 39_800,
    formulaDescription:
      "Cap is the lesser of a CPI-adjusted dollar amount (about $398 for 2026) or 10% of the cash price (excluding tax, title, registration, and negative equity). The dollar figure is re-set annually by the registrar.",
    feeNames: ["documentary service charge", "doc fee", "documentary fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: null,
    buyerExplanation:
      "Ohio caps the documentary service charge at the lesser of a yearly CPI-adjusted amount or 10% of the cash price.",
    buyerAction:
      "Check the charge against both limits (about $398 for 2026, or 10% of the price); it is a dealer charge, not a government fee.",
    sourceTitle: "Ohio Revised Code § 4517.261 — Documentary service charge",
    sourceUrl: "https://codes.ohio.gov/ohio-revised-code/section-4517.261",
    sourceType: "statute",
    sourceQuote:
      "A documentary service charge shall be not more than the lesser of (1) the amount allowed [CPI-adjusted from a $250 base since 2006] or (2) ten per cent of the amount the buyer is required to pay, excluding tax, title, and registration fees and any negative equity.",
    effectiveDate: "2024-10-24",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "Statute (verified) sets the formula; the ~$398 (2026) dollar ceiling is CPI-adjusted annually and is drawn from secondary reporting on the statute — confidence kept at medium until pinned to the registrar's current published figure.",
  },
  {
    jurisdiction: "FL",
    stateName: "Florida",
    verificationStatus: "verified",
    capType: "disclosure_only",
    feeNames: ["dealer fee", "doc fee", "predelivery service charge", "documentary fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: true,
    disclosureRequirement:
      "Non-government charges must be disclosed in writing; documents with a predelivery/dealer-fee line must carry the statutory disclosure that the charge represents costs and profit to the dealer.",
    buyerExplanation:
      "Florida does not cap the dealer fee, but requires it to be disclosed and treated as a dealer charge (costs and profit), not a government fee.",
    buyerAction:
      "Expect a written disclosure that this is a dealer charge; negotiate it through the out-the-door price and keep it separate from government fees.",
    sourceTitle: "Florida Statutes § 501.976 — Actionable, unfair, or deceptive acts (vehicle dealers)",
    sourceUrl:
      "https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599%2F0501%2FSections%2F0501.976.html",
    sourceType: "statute",
    sourceQuote:
      "Dealers must disclose that a predelivery/dealer charge 'represents costs and profit to the dealer for items such as inspecting, cleaning, and adjusting vehicles, and preparing documents related to the sale.'",
    lastVerified: VERIFIED,
    confidence: "high",
    limitations:
      "No statutory dollar cap; Florida dealer fees are among the highest nationally. The statute governs disclosure, not amount.",
  },
  {
    jurisdiction: "VA",
    stateName: "Virginia",
    verificationStatus: "verified",
    capType: "disclosure_only",
    feeNames: ["processing fee", "dealer processing fee", "doc fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: true,
    disclosureRequirement:
      "If charged, the fact and amount of the processing fee must be disclosed via a conspicuous sign in the sales area and stated on the buyer's order filed with the dealer's license.",
    buyerExplanation:
      "Virginia does not set a dollar cap on the dealer processing fee; it is voluntary and negotiable, and the law governs how it must be disclosed.",
    buyerAction:
      "Treat it as a negotiable dealer charge: ask for it itemized separately from government title/registration fees and push back on the out-the-door total.",
    sourceTitle: "Code of Virginia § 46.2-1530 — Buyer's order",
    sourceUrl: "https://law.justia.com/codes/virginia/title-46-2/chapter-15/section-46-2-1530/",
    sourceType: "statute",
    sourceQuote:
      "If a processing fee is charged, the fact and amount … shall be disclosed by … a clear and conspicuous sign in the public sales area; processing includes obtaining title and license plates but excludes the online-systems filing fee and manual transaction fee.",
    lastVerified: VERIFIED,
    confidence: "high",
    limitations:
      "No statutory dollar cap; the Virginia Automobile Dealers Association characterizes the fee as voluntary and negotiable.",
  },
  {
    jurisdiction: "MD",
    stateName: "Maryland",
    verificationStatus: "verified",
    capType: "capped",
    maxAmountCents: 80_000,
    feeNames: ["processing charge", "dealer processing fee", "doc fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: true,
    mustBeDisclosed: null,
    taxableTreatment:
      "Included in the taxable 'total purchase price' — the dealer processing charge is subject to Maryland excise tax.",
    buyerExplanation:
      "Maryland caps the dealer processing charge and includes it in the taxable purchase price.",
    buyerAction:
      "Confirm the processing charge is at or below the cap, and remember it is taxed as part of the price — it is still a dealer charge, not a government fee.",
    sourceTitle: "Taxable Price — Vehicle Dealers (Maryland MVA)",
    sourceUrl: "https://mva.maryland.gov/your-mva-guide/businesses/bulletins-businesses/taxable-price",
    sourceType: "official_state",
    sourceQuote:
      "Maryland dealers may charge a processing fee up to $800; 'total purchase price' includes any dealer processing charge, and excise tax is calculated on that total.",
    lastVerified: VERIFIED,
    confidence: "high",
  },

  // ---- SEEDED (sourced, but outside the verification batch / not officially
  //      confirmable as 'no cap'). Confidence capped at medium. ----
  {
    jurisdiction: "DE",
    stateName: "Delaware",
    verificationStatus: "seeded",
    capType: "uncapped",
    feeNames: ["documentation fee", "doc fee", "dealer processing fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: null,
    buyerExplanation:
      "Delaware does not appear to cap the dealer documentation/processing fee. Note that Delaware's state 'vehicle document fee' (5.25% of price, effective Oct 1, 2025) is a separate GOVERNMENT charge — not the dealer's fee.",
    buyerAction:
      "Ask the dealer to separate the state 5.25% document fee (government) from any dealer documentation/processing fee, and confirm the dealer fee in writing.",
    sourceTitle: "Delaware Admin. Code §2266 — Vehicle Document Fees (DE DMV)",
    sourceUrl: "https://regulations.delaware.gov/AdminCode/title2/2000/2200/Vehicle/2266.shtml",
    sourceType: "official_state",
    sourceQuote:
      "Delaware's vehicle document fee is a state charge of 5.25% of purchase price or NADA value (raised from 4.25% effective Oct 1, 2025); it is distinct from any dealer documentation/processing fee.",
    effectiveDate: "2025-10-01",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "The official source covers the state 5.25% GOVERNMENT document fee. The DEALER doc/processing fee being uncapped rests on secondary references and is not officially confirmed — kept 'seeded'. Buyers commonly confuse the two.",
  },
  {
    jurisdiction: "DC",
    stateName: "District of Columbia",
    verificationStatus: "seeded",
    capType: "uncapped",
    feeNames: ["processing fee", "doc fee", "dealer fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: null,
    buyerExplanation:
      "The District of Columbia does not appear to cap the dealer processing fee based on available sources; dealers set their own amount.",
    buyerAction:
      "Treat it as a negotiable dealer charge separate from DC DMV title and excise tax, which are billed at the real government amounts. Confirm the dealer fee in writing.",
    sourceTitle: "DC DMV — Vehicle Title and Excise Tax Fees (government fees only)",
    sourceUrl: "https://dmv.dc.gov/book/dmv-fees/vehicle-title-and-excise-tax-fees",
    sourceType: "official_state",
    sourceQuote:
      "DC publishes title and excise-tax (government) fees; no DC statute capping a dealer processing fee was identified, and secondary sources indicate the fee is dealer-set.",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "The official DC source covers government fees only; the 'no cap on dealer processing fee' status rests on secondary references and is not officially confirmed — kept 'seeded'.",
  },
  {
    jurisdiction: "PA",
    stateName: "Pennsylvania",
    verificationStatus: "seeded",
    capType: "formula",
    maxAmountCents: 49_000,
    formulaDescription:
      "CPI-indexed caps that differ by processing method — for 2026, about $490 (online/electronic) and about $409 (manual). Adjusted annually.",
    feeNames: ["documentary fee", "doc fee", "document preparation fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: null,
    disclosureRequirement: "Negotiable item; not mandatory between dealer and customer.",
    buyerExplanation:
      "Pennsylvania caps the documentary fee with CPI-indexed limits that differ for online vs manual processing, and the fee is negotiable.",
    buyerAction:
      "Check the charge against the 2026 limits (about $490 online / $409 manual) and confirm in writing; it is a negotiable dealer charge, not a government fee.",
    sourceTitle: "Pennsylvania Documentary Fee Increases for 2026 (PA Association of Notaries)",
    sourceUrl:
      "https://www.notary.org/article-pennsylvania-documentary-fee-increases-for-2026-what-dealers-need-to-know",
    sourceType: "dealer_association",
    sourceQuote:
      "Effective January 2026, the documentary fee caps are $490 for online/electronic processing and $409 for manual processing; the fee is CPI-indexed and adjusted annually.",
    effectiveDate: "2026-01-01",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "Outside the current verification batch. 2026 figures are from an industry/association source; confirm against the official PA Bulletin / PennDOT publication before relying on the cap.",
  },
  {
    jurisdiction: "IL",
    stateName: "Illinois",
    verificationStatus: "seeded",
    capType: "capped",
    maxAmountCents: 37_763,
    formulaDescription:
      "Statutory documentary fee, CPI-adjusted annually from a $300 base (2020). The 2026 maximum is about $377.63.",
    feeNames: ["documentary fee", "doc fee", "documentary service fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: null,
    buyerExplanation:
      "Illinois caps the documentary fee at a CPI-adjusted amount (about $377.63 for 2026).",
    buyerAction:
      "Check the charge against the current-year cap and confirm in writing; it is a dealer charge, not a government fee.",
    sourceTitle: "815 ILCS 375/11.1 — Motor Vehicle Retail Installment Sales Act (documentary fee)",
    sourceUrl: "https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=081503750K11.1",
    sourceType: "statute",
    sourceQuote:
      "The documentary fee maximum is the $300 base (2020) subject to an annual rate adjustment equal to the percentage change in the Bureau of Labor Statistics Consumer Price Index.",
    effectiveDate: "2026-01-01",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "Outside the current verification batch. Statute sets the CPI formula; the $377.63 (2026) figure is from industry reporting and should be re-verified against the Illinois AG / Secretary of State annual notice.",
  },
  {
    jurisdiction: "NC",
    stateName: "North Carolina",
    verificationStatus: "verified",
    capType: "disclosure_only",
    feeNames: ["administrative fee", "dealer administrative fee", "doc fee", "documentary fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: true,
    mustBeDisclosed: true,
    taxableTreatment: "Treated as part of the vehicle purchase price for tax purposes.",
    disclosureRequirement:
      "A dealer may not charge an administrative/origination/documentary fee unless it posts a conspicuous notice and separately identifies the fee on the buyer's documents.",
    buyerExplanation:
      "North Carolina does not cap the dealer administrative/doc fee, but requires conspicuous disclosure and separate itemization.",
    buyerAction:
      "Ask for the fee shown separately and disclosed as required; negotiate it as a dealer charge, not a government fee.",
    sourceTitle: "N.C. Gen. Stat. § 20-101.1 — Conspicuous disclosure of dealer administrative fees",
    sourceUrl: "https://www.ncleg.net/EnactedLegislation/Statutes/PDF/BySection/Chapter_20/GS_20-101.1.pdf",
    sourceType: "statute",
    sourceQuote:
      "A motor vehicle dealer shall not charge an administrative, origination, documentary, procurement, or similar fee … unless [it] posts a conspicuous notice and separately identifies the fee on the purchase documents.",
    lastVerified: VERIFIED,
    confidence: "high",
    limitations:
      "Statute mandates conspicuous disclosure and separate itemization; it does not set a maximum amount, so there is no cap to compare against.",
  },
  {
    jurisdiction: "GA",
    stateName: "Georgia",
    verificationStatus: "verified",
    capType: "disclosure_only",
    feeNames: ["dealer fee", "doc fee", "administrative fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: true,
    disclosureRequirement:
      "Only government fees (tax, title, tag, Lemon Law) may be excluded from an advertised price; a dealer fee must be included within the advertised price, not added via a 'plus dealer fee' disclaimer.",
    buyerExplanation:
      "Georgia does not cap the dealer fee, but the Attorney General's position is that it must be built into the advertised price rather than tacked on afterward.",
    buyerAction:
      "Hold the dealer to the advertised price; treat the dealer fee as part of that price and negotiate the out-the-door total.",
    sourceTitle: "Georgia AG Consumer Ed — Dealer fee and advertised price",
    sourceUrl:
      "https://consumered.georgia.gov/ask-ed/2024-10-16/dealer-fee-was-not-included-advertised-vehicle-price",
    sourceType: "official_state",
    sourceQuote:
      "Only government fees such as tax, title, tag and Lemon Law fees may be excluded from advertised vehicle prices; any other amounts the dealer collects — including dealer fees — must be included in the advertised price.",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "Outside the current verification batch. No statutory dollar cap; the rule constrains advertising/disclosure rather than the fee amount. Confidence held at medium pending formal verification.",
  },
  {
    jurisdiction: "NJ",
    stateName: "New Jersey",
    verificationStatus: "verified",
    capType: "uncapped",
    feeNames: ["documentary service fee", "doc fee", "dealer fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: true,
    mustBeDisclosed: null,
    taxableTreatment:
      "New Jersey treats documentary/dealer service fees as part of the taxable sales price (Division of Taxation guidance).",
    buyerExplanation:
      "New Jersey does not appear to cap dealer documentation fees; they are dealer-set and negotiable, and are taxed as part of the price.",
    buyerAction:
      "Treat it as a negotiable dealer charge — there is nothing setting a maximum, so push back on the total out-the-door price.",
    sourceTitle: "NJ Division of Taxation — Taxability of Documentary Fees (motor vehicle dealerships)",
    sourceUrl: "https://www.nj.gov/treasury/taxation/pdf/Noticemotorvehicledealerships.pdf",
    sourceType: "official_state",
    sourceQuote:
      "Documentary service fees charged by motor vehicle dealerships are part of the taxable sales price of the vehicle.",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "The official source confirms the fee is dealer-charged, not state-required, and is part of the taxable price. New Jersey has no statute capping the fee — the 'no cap' status is by absence of a capping law, so confidence is held at medium.",
  },
  {
    jurisdiction: "CO",
    stateName: "Colorado",
    verificationStatus: "verified",
    capType: "uncapped",
    feeNames: ["dealer handling fee", "doc fee", "document handling fee", "delivery and handling"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: true,
    disclosureRequirement:
      "Colorado regulates the delivery-and-handling/document fee through disclosure and uniformity rules — if charged, it must be the same for every retail buyer and disclosed.",
    buyerExplanation:
      "Colorado does not set a statutory dollar cap on the dealer document/handling fee; it is dealer-set, but must be disclosed and charged uniformly to all buyers.",
    buyerAction:
      "Treat it as a negotiable dealer charge and compare across dealers; ask that it be shown separately from government fees.",
    sourceTitle: "Colorado Motor Vehicle Dealer Board — Dealing in Motor Vehicles (CCR rule)",
    sourceUrl: "https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=2129",
    sourceType: "official_state",
    sourceQuote:
      "Colorado's Motor Vehicle Dealer Board regulates the delivery-and-handling/document fee through disclosure and uniform-charging rules; no statutory dollar cap is set.",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "No statutory dollar cap; Colorado regulates the fee through disclosure/uniformity rules rather than a maximum. 'No cap' is by absence of a capping law, so confidence is held at medium.",
  },
  {
    jurisdiction: "AZ",
    stateName: "Arizona",
    verificationStatus: "seeded",
    capType: "unknown",
    feeNames: ["documentation fee", "doc fee", "dealer fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: null,
    buyerExplanation:
      "Arizona's doc-fee cap status is unresolved: sources conflict on whether a cap exists. The fee is still a dealer charge, not a government fee.",
    buyerAction:
      "Ask the dealer to itemize the fee and cite any basis for the amount in writing; consider human review before relying on a cap figure.",
    sourceTitle: "Arizona doc-fee status (conflicting consumer references)",
    sourceUrl: "https://caredge.com/guides/car-dealer-doc-fee-by-state",
    sourceType: "consumer_reference",
    sourceQuote:
      "Sources conflict: some 2026 references cite an Arizona doc-fee maximum (~$295) while others state Arizona sets no limit on doc fees.",
    lastVerified: VERIFIED,
    confidence: "low",
    limitations:
      "CONFLICT: one source reports a ~$295 cap, another reports no cap. No authoritative Arizona DOT/MVD or statute citation was confirmed. Treat as unverified pending official research.",
  },
];

/* ---------------------------------------------------------------------------
 *  Assemble the full table: sourced rules + needs_research scaffolds.
 * ------------------------------------------------------------------------- */

function needsResearchRule(code: string, name: string): DocFeeRule {
  return {
    jurisdiction: code,
    stateName: name,
    verificationStatus: "needs_research",
    capType: "needs_research",
    feeNames: ["doc fee", "documentation fee", "processing fee"],
    dealerControlled: true,
    governmentFee: false,
    taxable: null,
    mustBeDisclosed: null,
    buyerExplanation:
      "We do not yet have a verified current doc-fee rule for this state. A doc/processing fee is still a dealer charge, not a required government fee.",
    buyerAction:
      "Ask the dealer to itemize the charge separately from government fees, and consider human review before relying on a specific cap.",
    lastVerified: VERIFIED,
    confidence: "low",
    limitations:
      "Scaffold only — no authoritative source reviewed yet. Slated for a future research pass.",
  };
}

export const DOC_FEE_RULES: Record<string, DocFeeRule> = (() => {
  const table: Record<string, DocFeeRule> = {};
  for (const [code, name] of Object.entries(US_JURISDICTIONS)) {
    table[code] = needsResearchRule(code, name);
  }
  for (const rule of SOURCED_RULES) {
    table[rule.jurisdiction] = rule;
  }
  return table;
})();

/** Codes that have a real source (verified or seeded — not a scaffold). */
export const SOURCED_JURISDICTIONS: string[] = SOURCED_RULES.map((r) => r.jurisdiction);

/** Codes confirmed against an official/authoritative source in a verification pass. */
export const VERIFIED_JURISDICTIONS: string[] = SOURCED_RULES.filter(
  (r) => r.verificationStatus === "verified",
).map((r) => r.jurisdiction);

/* ---------------------------------------------------------------------------
 *  Lookup + classifier
 * ------------------------------------------------------------------------- */

export function getDocFeeRuleForState(stateCode: string): DocFeeRule | undefined {
  if (!stateCode) return undefined;
  return DOC_FEE_RULES[stateCode.toUpperCase().trim().slice(0, 2)];
}

export type DocFeeComparisonStatus =
  | "within_verified_cap"
  | "above_verified_cap"
  | "verified_uncapped"
  | "verified_disclosure_only"
  | "seeded_rule_no_comparison"
  | "needs_research"
  | "missing_state"
  | "not_doc_fee";

export type DocFeeRuleStatus =
  | "verified"
  | "seeded"
  | "needs_research"
  | "unknown"
  | "missing"
  | "not_doc_fee";

export interface DocFeeFinding {
  /** Two-letter jurisdiction code (and `jurisdiction` alias for back-compat). */
  stateCode?: string;
  jurisdiction?: string;
  feeName: string;
  amountCents: number;
  isDocFee: boolean;
  /** Display-oriented rule state: Verified / Seeded / Needs research / Unknown. */
  ruleStatus: DocFeeRuleStatus;
  /** Lifecycle status of the matched rule, or "none". */
  verificationStatus: VerificationStatus | "none";
  capType?: DocFeeCapType;
  maxAmountCents?: number;
  /** The cap actually used in a comparison (when one ran). */
  capAmountCents?: number;
  comparisonStatus: DocFeeComparisonStatus;
  withinCap?: boolean;
  overCap?: boolean;
  dealerControlled: boolean;
  governmentFee: boolean;
  taxable: boolean | null;
  mustBeDisclosed: boolean | null;
  confidence: Confidence;
  /** True only when the underlying rule is verified. */
  verified: boolean;
  /** True when we have a usable, verified rule conclusion. */
  ruleKnown: boolean;
  buyerSummary: string;
  whyItMatters: string;
  whatToAsk: string;
  scriptLine: string;
  sourceSummary: string;
  limitations?: string;
  humanReviewRecommended: boolean;
  /** Back-compat aliases of buyerSummary / whatToAsk. */
  explanation: string;
  action: string;
  source?: {
    title?: string;
    url?: string;
    type?: RuleSourceType;
    quote?: string;
  };
}

function ruleSource(rule: DocFeeRule): DocFeeFinding["source"] {
  if (!rule.sourceUrl && !rule.sourceTitle) return undefined;
  return {
    title: rule.sourceTitle,
    url: rule.sourceUrl,
    type: rule.sourceType,
    quote: rule.sourceQuote,
  };
}

function dollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

/* ---------------------------------------------------------------------------
 *  Buyer-facing copy builders. Each reads the finding's STRUCTURED fields and
 *  produces conservative, decision-support language — never a legal conclusion.
 * ------------------------------------------------------------------------- */

export function shouldRecommendHumanReviewForDocFee(f: DocFeeFinding): boolean {
  return (
    f.comparisonStatus === "above_verified_cap" ||
    f.comparisonStatus === "seeded_rule_no_comparison" ||
    f.comparisonStatus === "needs_research" ||
    f.comparisonStatus === "missing_state"
  );
}

export function buildDocFeeBuyerSummary(f: DocFeeFinding): string {
  switch (f.comparisonStatus) {
    case "not_doc_fee":
      return "This line does not look like a dealer documentation, processing, or administrative fee, so the state doc-fee rule does not apply to it.";
    case "missing_state":
      return "This appears to be a dealer-controlled doc or processing fee, not a required government fee. We need the state you're buying in to check it against the local rule.";
    case "needs_research":
      return "We don't have a verified doc-fee rule for this state yet. A doc or processing fee is still a dealer-controlled charge — not a required government tax, title, or registration fee.";
    case "within_verified_cap":
      return "This doc/processing fee appears within the verified state cap we have on file. It is still dealer-controlled, not a government tax or registration fee. Confirm it is itemized separately from required state charges.";
    case "above_verified_cap":
      return "Based on the verified state rule we have on file, this doc/processing fee appears above the listed cap. It is a dealer-controlled charge, not a required government fee. This is not a legal determination.";
    case "verified_uncapped":
      return "This state does not appear to cap dealer doc/processing fees based on the verified rule we have on file. That does not make the fee a government charge. Treat it as dealer-controlled and negotiate the total out-the-door price.";
    case "verified_disclosure_only":
      return "This state appears to regulate how the processing fee is disclosed rather than setting a fixed cap. It is a dealer-controlled charge, not a required government fee. Ask the dealer to clearly itemize it.";
    case "seeded_rule_no_comparison":
      if (f.stateCode === "DE") {
        return "Delaware's state 'document fee' is a government titling charge and is different from a dealer doc/processing fee. Any dealer processing or administrative fee is dealer-controlled, and the rule we have for it is seeded (not yet verified).";
      }
      if (f.capType === "unknown") {
        return "We can't confirm this state's doc-fee rule yet — the sources we have conflict. The fee is still a dealer-controlled charge, not a required government fee.";
      }
      if (f.capType === "uncapped") {
        return "Based on a seeded (not yet verified) source, this state does not appear to cap dealer doc/processing fees. Treat the fee as dealer-controlled, not a government charge.";
      }
      if (f.capType === "disclosure_only") {
        return "Based on a seeded (not yet verified) source, this state appears to regulate disclosure of the fee rather than capping it. Treat it as dealer-controlled, not a government charge.";
      }
      return "We have a seeded rule for this state, but it is not verified enough to run a cap comparison. Treat the fee as dealer-controlled and ask for itemization. Human review is recommended before relying on this rule.";
  }
}

export function buildDocFeeWhyItMatters(f: DocFeeFinding): string {
  if (f.comparisonStatus === "not_doc_fee") return "";
  if (f.stateCode === "DE") {
    return "In Delaware this matters because the state's percentage 'document fee' is a real government charge, while a separate dealer processing fee is not — the two are easy to confuse on a buyer's order.";
  }
  if (f.comparisonStatus === "above_verified_cap") {
    return "Doc and processing fees are set by the dealer, not the government. An amount above the cap on file is worth questioning before you sign — the difference is money you may be able to push back on.";
  }
  if (f.comparisonStatus === "within_verified_cap") {
    return "Doc and processing fees are set by the dealer, not the government. Even within the cap, it's a dealer charge you can factor into the out-the-door price.";
  }
  return "Doc, processing, and administrative fees are set by the dealer — not the same as government title, registration, or tax charges. Dealers sometimes present them as if they're mandatory. Knowing the state rule tells you how hard you can push.";
}

export function buildDocFeeWhatToAsk(f: DocFeeFinding): string {
  if (f.stateCode === "DE") {
    return "Ask the dealer to separate Delaware's state document fee from any dealer processing or administrative fee, and confirm the dealer fee in writing.";
  }
  switch (f.comparisonStatus) {
    case "not_doc_fee":
      return "No doc-fee action needed for this line.";
    case "missing_state":
      return "Add the state where you're buying so we can apply the right rule, and ask the dealer to itemize the charge separately from government fees.";
    case "within_verified_cap":
      return "Ask the dealer to confirm the fee is itemized separately from required state title and registration charges.";
    case "above_verified_cap":
      return "Ask the dealer to identify the statutory basis for the charge or provide a corrected buyer's order at or below the cap.";
    case "verified_uncapped":
      return "Ask the dealer to separate government charges from dealer-retained fees, and negotiate the total out-the-door price.";
    case "verified_disclosure_only":
      return "Ask the dealer to clearly itemize the fee and separate it from required government charges.";
    default:
      return "Ask the dealer to itemize the fee and separate it from required taxes, title, and registration charges, and confirm it in writing.";
  }
}

export function buildDocFeeScriptLine(f: DocFeeFinding): string {
  if (f.comparisonStatus === "not_doc_fee") return "";
  if (f.stateCode === "DE") {
    return "“Please separate Delaware's state document fee from your own dealer processing fee on my buyer's order.”";
  }
  switch (f.comparisonStatus) {
    case "within_verified_cap":
      return "“This processing fee is a dealer charge, not a government fee — please show it itemized separately from my title and registration.”";
    case "above_verified_cap":
      return "“Please show me the statutory basis for this processing fee, or provide a corrected buyer's order with the fee adjusted to match the verified cap.”";
    case "verified_uncapped":
      return "“I know this processing fee is set by the dealer, not the state — I'd like it reduced or folded into the out-the-door price.”";
    case "verified_disclosure_only":
      return "“Please itemize this processing fee and keep it separate from my taxes, title, and registration.”";
    default:
      return "“Please itemize this processing fee separately from my taxes, title, and registration so I can see what's a government charge and what's a dealer fee.”";
  }
}

export function buildDocFeeSourceSummary(f: DocFeeFinding): string {
  if (f.comparisonStatus === "not_doc_fee") return "";
  if (!f.source?.title) {
    return "No verified source on file for this state yet.";
  }
  const type = f.source.type ? ` (${f.source.type.replace(/_/g, " ")})` : "";
  const trust = f.verified ? " — verified source on file." : " — seeded (unverified) source.";
  return `${f.source.title}${type}${trust}`;
}

/* ---------------------------------------------------------------------------
 *  Classifier
 * ------------------------------------------------------------------------- */

/** Build a finding from an explicit rule (or null). Exposed for testing and for
 *  callers that already hold a rule. `classifyDocFeeAmount` is the usual entry. */
export function buildDocFeeFinding(input: {
  isDocFee: boolean;
  feeName: string;
  amountCents: number;
  stateCode?: string;
  rule: DocFeeRule | null;
}): DocFeeFinding {
  const { isDocFee, feeName, amountCents, stateCode, rule } = input;

  let comparisonStatus: DocFeeComparisonStatus;
  let ruleStatus: DocFeeRuleStatus;
  let withinCap: boolean | undefined;
  let overCap: boolean | undefined;
  let capAmountCents: number | undefined;

  if (!isDocFee) {
    comparisonStatus = "not_doc_fee";
    ruleStatus = "not_doc_fee";
  } else if (!stateCode) {
    comparisonStatus = "missing_state";
    ruleStatus = "missing";
  } else if (!rule || rule.verificationStatus === "needs_research") {
    comparisonStatus = "needs_research";
    ruleStatus = "needs_research";
  } else if (rule.capType === "unknown") {
    comparisonStatus = "seeded_rule_no_comparison";
    ruleStatus = "unknown";
  } else if (rule.verificationStatus !== "verified") {
    comparisonStatus = "seeded_rule_no_comparison";
    ruleStatus = "seeded";
  } else {
    // verified
    ruleStatus = "verified";
    if (rule.capType === "disclosure_only") {
      comparisonStatus = "verified_disclosure_only";
    } else if (rule.capType === "uncapped") {
      comparisonStatus = "verified_uncapped";
    } else {
      const cap = rule.maxAmountCents;
      if (cap === undefined) {
        comparisonStatus = "seeded_rule_no_comparison";
        ruleStatus = "seeded";
      } else {
        capAmountCents = cap;
        if (amountCents > cap) {
          comparisonStatus = "above_verified_cap";
          overCap = true;
          withinCap = false;
        } else {
          comparisonStatus = "within_verified_cap";
          withinCap = true;
          overCap = false;
        }
      }
    }
  }

  const confidence: Confidence =
    comparisonStatus === "not_doc_fee"
      ? "high"
      : comparisonStatus === "missing_state" || comparisonStatus === "needs_research"
        ? "low"
        : rule?.confidence ?? "low";

  const verified = ruleStatus === "verified";

  const f: DocFeeFinding = {
    stateCode,
    jurisdiction: stateCode,
    feeName,
    amountCents,
    isDocFee,
    ruleStatus,
    verificationStatus: rule?.verificationStatus ?? "none",
    capType: rule?.capType,
    maxAmountCents: rule?.maxAmountCents,
    capAmountCents,
    comparisonStatus,
    withinCap,
    overCap,
    dealerControlled: isDocFee ? rule?.dealerControlled ?? true : false,
    governmentFee: rule?.governmentFee ?? false,
    taxable: rule?.taxable ?? null,
    mustBeDisclosed: rule?.mustBeDisclosed ?? null,
    confidence,
    verified,
    ruleKnown:
      comparisonStatus === "within_verified_cap" ||
      comparisonStatus === "above_verified_cap" ||
      comparisonStatus === "verified_uncapped" ||
      comparisonStatus === "verified_disclosure_only",
    source: rule ? ruleSource(rule) : undefined,
    limitations: rule?.limitations,
    // copy filled below
    humanReviewRecommended: false,
    buyerSummary: "",
    whyItMatters: "",
    whatToAsk: "",
    scriptLine: "",
    sourceSummary: "",
    explanation: "",
    action: "",
  };

  f.humanReviewRecommended = shouldRecommendHumanReviewForDocFee(f);
  f.buyerSummary = buildDocFeeBuyerSummary(f);
  f.whyItMatters = buildDocFeeWhyItMatters(f);
  f.whatToAsk = buildDocFeeWhatToAsk(f);
  f.scriptLine = buildDocFeeScriptLine(f);
  f.sourceSummary = buildDocFeeSourceSummary(f);
  f.explanation = f.buyerSummary;
  f.action = f.whatToAsk;
  return f;
}

/**
 * Classify a single fee line against the buyer's state doc-fee rule. Pure and
 * deterministic. Cap comparisons run ONLY against VERIFIED rules; seeded,
 * unknown, or unresearched states never produce a cap-overage warning. Buyer
 * copy is decision-support only — never an accusation or a legal conclusion.
 */
export function classifyDocFeeAmount(params: {
  stateCode?: string | null;
  feeName: string;
  amountCents: number;
}): DocFeeFinding {
  const isDocFee = isDocFeeAlias(params.feeName);
  const stateCode = (params.stateCode ?? "").toUpperCase().trim().slice(0, 2);
  const rule = stateCode ? getDocFeeRuleForState(stateCode) ?? null : null;
  return buildDocFeeFinding({
    isDocFee,
    feeName: params.feeName,
    amountCents: params.amountCents,
    stateCode: stateCode || undefined,
    rule,
  });
}
