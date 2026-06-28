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
 *    - We never invent a cap. If a state can't be verified this sprint it is
 *      `needs_research` (scaffolded, low confidence, no fabricated numbers).
 *    - Caps that adjust annually (OH, PA, IL CPI formulas) are marked `formula`
 *      or carry a limitation that the dollar figure updates yearly.
 *    - Where sources conflict (e.g. AZ), we do NOT hide it: the rule is marked
 *      `unknown` and the conflict is recorded in `limitations`.
 *    - Buyer-facing copy is decision-support, never an accusation: no "fraud",
 *      "scam", "illegal", or "lied".
 *
 *  Verified for this sprint on 2026-06-28 (15 jurisdictions). The remaining
 *  states are scaffolded as `needs_research` for the next research pass.
 * ============================================================================
 */

export type DocFeeCapType =
  | "capped" // a fixed statutory dollar cap
  | "uncapped" // no cap; dealer-set
  | "formula" // cap derived from a formula / annual CPI / tier
  | "disclosure_only" // no cap, but the fee's disclosure/advertising is regulated
  | "unknown" // researched, but sources conflict or are inconclusive
  | "needs_research"; // not yet researched this sprint

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
  /** How the fee is treated for tax, when verified. */
  taxableTreatment?: string;
  /** Disclosure obligation, when verified. */
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

/**
 * Aliases for a dealer documentation / processing / administrative fee. These
 * are matched as substrings against a lowercased fee label. We deliberately do
 * NOT include the bare term "service fee" — it's too broad and collides with
 * "service contract" (a warranty product). Only the dealer/doc/admin-qualified
 * "dealer service fee" is included.
 */
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
  // Hard exclusions: warranty/service-contract and government/tax lines that
  // might otherwise brush an alias.
  if (/service\s+contract|vehicle\s+service|warranty|\btax\b|registration|title\b|tag\b|license\b/.test(label)) {
    // Allow only if it ALSO clearly names doc/processing/admin paperwork.
    if (!/\bdoc|document|paperwork|processing|admin/.test(label)) return false;
  }
  return DOC_FEE_ALIASES.some((a) => label.includes(a));
}

/* ---------------------------------------------------------------------------
 *  Source-backed rules (verified 2026-06-28)
 * ------------------------------------------------------------------------- */

const VERIFIED = "2026-06-28";

const SOURCED_RULES: DocFeeRule[] = [
  {
    jurisdiction: "CA",
    stateName: "California",
    capType: "capped",
    maxAmountCents: 17_500,
    feeNames: ["document processing charge", "doc fee", "documentation fee"],
    dealerControlled: true,
    governmentFee: false,
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
      "Two tiers: $175 (DMV business-partner dealers) vs $70 (non-partner). Supersedes the older $85 figure still cited in some sources. Pending bill SB 791 (2025–26) may change the amount; re-verify.",
  },
  {
    jurisdiction: "NY",
    stateName: "New York",
    capType: "capped",
    maxAmountCents: 17_500,
    feeNames: ["documentation fee", "doc fee", "dealer processing fee"],
    dealerControlled: true,
    governmentFee: false,
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
    jurisdiction: "MD",
    stateName: "Maryland",
    capType: "capped",
    maxAmountCents: 80_000,
    feeNames: ["processing charge", "dealer processing fee", "doc fee"],
    dealerControlled: true,
    governmentFee: false,
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
  {
    jurisdiction: "TX",
    stateName: "Texas",
    capType: "formula",
    maxAmountCents: 22_500,
    formulaDescription:
      "A documentary fee of $225 or less is presumed reasonable; a fee above $225 requires the dealer to file a cost analysis with the OCCC and justify the amount.",
    feeNames: ["documentary fee", "doc fee", "dealer documentary fee"],
    dealerControlled: true,
    governmentFee: false,
    buyerExplanation:
      "Texas treats a documentary fee of $225 or less as presumptively reasonable; above that, the dealer must justify it to the state regulator.",
    buyerAction:
      "If the fee is over $225, ask the dealer for the OCCC cost-analysis basis; either way, it is a dealer charge, not a government fee.",
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
    capType: "formula",
    maxAmountCents: 39_800,
    formulaDescription:
      "Cap is the lesser of a CPI-adjusted dollar amount (about $398 for 2026) or 10% of the cash price (excluding tax, title, registration, and negative equity). The dollar figure is re-set annually by the registrar.",
    feeNames: ["documentary service charge", "doc fee", "documentary fee"],
    dealerControlled: true,
    governmentFee: false,
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
      "The dollar ceiling is CPI-adjusted annually; the ~$398 (2026) figure is from secondary reporting on the statute and should be re-verified against the registrar's current published amount.",
  },
  {
    jurisdiction: "PA",
    stateName: "Pennsylvania",
    capType: "formula",
    maxAmountCents: 49_000,
    formulaDescription:
      "CPI-indexed caps that differ by processing method — for 2026, about $490 (online/electronic) and about $409 (manual). Adjusted annually.",
    feeNames: ["documentary fee", "doc fee", "document preparation fee"],
    dealerControlled: true,
    governmentFee: false,
    disclosureRequirement: "Negotiable item; not mandatory between dealer and customer.",
    buyerExplanation:
      "Pennsylvania caps the documentary fee with CPI-indexed limits that differ for online vs manual processing, and the fee is negotiable.",
    buyerAction:
      "Check the charge against the 2026 limits (about $490 online / $409 manual); it is a negotiable dealer charge, not a government fee.",
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
      "2026 figures are from an industry/association source summarizing the PennDOT/PA Code mechanism; confirm against the official PA Bulletin / PennDOT publication.",
  },
  {
    jurisdiction: "IL",
    stateName: "Illinois",
    capType: "capped",
    maxAmountCents: 37_763,
    formulaDescription:
      "Statutory documentary fee, CPI-adjusted annually from a $300 base (2020). The 2026 maximum is about $377.63.",
    feeNames: ["documentary fee", "doc fee", "documentary service fee"],
    dealerControlled: true,
    governmentFee: false,
    buyerExplanation:
      "Illinois caps the documentary fee at a CPI-adjusted amount (about $377.63 for 2026).",
    buyerAction:
      "Check the charge against the current-year cap; it is a dealer charge, not a government fee.",
    sourceTitle: "815 ILCS 375/11.1 — Motor Vehicle Retail Installment Sales Act (documentary fee)",
    sourceUrl: "https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=081503750K11.1",
    sourceType: "statute",
    sourceQuote:
      "The documentary fee maximum is the $300 base (2020) subject to an annual rate adjustment equal to the percentage change in the Bureau of Labor Statistics Consumer Price Index.",
    effectiveDate: "2026-01-01",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "Statute sets the CPI formula; the $377.63 (2026) figure is from industry reporting and should be re-verified against the Illinois AG / Secretary of State annual notice.",
  },
  {
    jurisdiction: "VA",
    stateName: "Virginia",
    capType: "disclosure_only",
    feeNames: ["processing fee", "dealer processing fee", "doc fee"],
    dealerControlled: true,
    governmentFee: false,
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
      "No statutory dollar cap; the Virginia Automobile Dealers Association characterizes the fee as 100% voluntary and negotiable.",
  },
  {
    jurisdiction: "FL",
    stateName: "Florida",
    capType: "disclosure_only",
    feeNames: ["dealer fee", "doc fee", "predelivery service charge", "documentary fee"],
    dealerControlled: true,
    governmentFee: false,
    disclosureRequirement:
      "Non-government charges must be disclosed in writing; documents with a predelivery/dealer-fee line must carry the statutory disclosure that the charge represents costs and profit to the dealer.",
    buyerExplanation:
      "Florida does not cap the dealer fee, but requires it to be disclosed and treated as a dealer charge (costs and profit), not a government fee.",
    buyerAction:
      "Expect a disclosure that this is a dealer charge; negotiate it through the out-the-door price and keep it separate from government fees.",
    sourceTitle: "Florida Statutes § 501.976 — Actionable, unfair, or deceptive acts (vehicle dealers)",
    sourceUrl:
      "https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599%2F0501%2FSections%2F0501.976.html",
    sourceType: "statute",
    sourceQuote:
      "Dealers must disclose that a predelivery/dealer charge 'represents costs and profit to the dealer for items such as inspecting, cleaning, and adjusting vehicles, and preparing documents related to the sale.'",
    lastVerified: VERIFIED,
    confidence: "high",
    limitations:
      "No statutory cap; Florida dealer fees are among the highest nationally. The statute governs disclosure, not amount.",
  },
  {
    jurisdiction: "NC",
    stateName: "North Carolina",
    capType: "disclosure_only",
    feeNames: ["administrative fee", "dealer administrative fee", "doc fee", "documentary fee"],
    dealerControlled: true,
    governmentFee: false,
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
    limitations: "Statute mandates disclosure; it does not set a maximum amount.",
  },
  {
    jurisdiction: "GA",
    stateName: "Georgia",
    capType: "disclosure_only",
    feeNames: ["dealer fee", "doc fee", "administrative fee"],
    dealerControlled: true,
    governmentFee: false,
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
    confidence: "high",
    limitations:
      "No statutory dollar cap; the rule constrains advertising/disclosure rather than the fee amount.",
  },
  {
    jurisdiction: "NJ",
    stateName: "New Jersey",
    capType: "uncapped",
    feeNames: ["documentary service fee", "doc fee", "dealer fee"],
    dealerControlled: true,
    governmentFee: false,
    taxableTreatment:
      "New Jersey treats documentary/dealer service fees as part of the taxable sales price (Division of Taxation guidance).",
    buyerExplanation:
      "New Jersey does not cap dealer documentation fees; they are dealer-set and negotiable, and are taxed as part of the price.",
    buyerAction:
      "Treat it as a negotiable dealer charge — there is nothing in NJ law setting a maximum, so push back on the total out-the-door price.",
    sourceTitle: "NJ Division of Taxation — Taxability of Documentary Fees and Other Charges (motor vehicle dealerships)",
    sourceUrl: "https://www.nj.gov/treasury/taxation/pdf/Noticemotorvehicledealerships.pdf",
    sourceType: "official_state",
    sourceQuote:
      "Documentary service fees charged by motor vehicle dealerships are part of the taxable sales price of the vehicle.",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "The official source confirms taxability; the 'no cap' status is well-supported by consumer references but is not a single statutory citation. Re-verify if a cap is later enacted.",
  },
  {
    jurisdiction: "CO",
    stateName: "Colorado",
    capType: "uncapped",
    feeNames: ["dealer handling fee", "doc fee", "document handling fee", "delivery and handling"],
    dealerControlled: true,
    governmentFee: false,
    buyerExplanation:
      "Colorado does not appear to set a statutory cap on the dealer document/handling fee; it is dealer-set and negotiable.",
    buyerAction:
      "Treat it as a negotiable dealer charge and compare across dealers; it is not a government fee.",
    sourceTitle: "Colorado Auto Industry Division — Motor Vehicle Dealer Board guidance",
    sourceUrl: "https://sbg.colorado.gov/sites/sbg/files/documents/MVDBAdMemo.pdf",
    sourceType: "official_state",
    sourceQuote:
      "Colorado regulates dealer delivery-and-handling/document fees through disclosure guidance; current secondary sources indicate no statutory dollar cap on the fee.",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "No statutory cap found; some older guidance references handling-fee limits. Confirm current status with the Colorado Motor Vehicle Dealer Board before relying on it.",
  },
  {
    jurisdiction: "DC",
    stateName: "District of Columbia",
    capType: "uncapped",
    feeNames: ["processing fee", "doc fee", "dealer fee"],
    dealerControlled: true,
    governmentFee: false,
    buyerExplanation:
      "The District of Columbia does not appear to cap the dealer processing fee; dealers set their own amount.",
    buyerAction:
      "Treat it as a negotiable dealer charge separate from DC DMV title and excise tax, which are billed at the real government amounts.",
    sourceTitle: "DC DMV — Vehicle Title and Excise Tax Fees (government fees only)",
    sourceUrl: "https://dmv.dc.gov/book/dmv-fees/vehicle-title-and-excise-tax-fees",
    sourceType: "official_state",
    sourceQuote:
      "DC publishes title and excise-tax (government) fees; no DC statute capping a dealer processing fee was identified, and secondary sources indicate the fee is dealer-set.",
    lastVerified: VERIFIED,
    confidence: "medium",
    limitations:
      "The official DC source covers government fees; the 'no cap on dealer processing fee' status rests on secondary references and should be confirmed against DC dealer-licensing rules.",
  },
  {
    jurisdiction: "AZ",
    stateName: "Arizona",
    capType: "unknown",
    feeNames: ["documentation fee", "doc fee", "dealer fee"],
    dealerControlled: true,
    governmentFee: false,
    buyerExplanation:
      "Arizona's doc-fee cap status is unresolved: sources conflict on whether a cap exists. The fee is still a dealer charge, not a government fee.",
    buyerAction:
      "Ask the dealer to itemize the fee and cite any statutory basis for the amount; consider human review before relying on a cap figure.",
    sourceTitle: "Arizona doc-fee status (conflicting consumer references)",
    sourceUrl: "https://caredge.com/guides/car-dealer-doc-fee-by-state",
    sourceType: "consumer_reference",
    sourceQuote:
      "Sources conflict: some 2026 references cite an Arizona doc-fee maximum (~$295) while others state Arizona sets no limit on doc fees.",
    lastVerified: VERIFIED,
    confidence: "low",
    limitations:
      "CONFLICT: one source reports a ~$295 cap, another reports no cap. No authoritative Arizona DOT/MVD or statute citation was confirmed this sprint. Treat as unverified pending official research.",
  },
];

/* ---------------------------------------------------------------------------
 *  Assemble the full table: sourced rules + needs_research scaffolds.
 * ------------------------------------------------------------------------- */

function needsResearchRule(code: string, name: string): DocFeeRule {
  return {
    jurisdiction: code,
    stateName: name,
    capType: "needs_research",
    feeNames: ["doc fee", "documentation fee", "processing fee"],
    // Safe to assert in every jurisdiction even before research:
    dealerControlled: true,
    governmentFee: false,
    buyerExplanation:
      "We do not yet have a verified current doc-fee rule for this state. A doc/processing fee is still a dealer charge, not a required government fee.",
    buyerAction:
      "Ask the dealer to itemize the charge separately from government fees, and consider human review before relying on a specific cap.",
    lastVerified: VERIFIED,
    confidence: "low",
    limitations:
      "Scaffold only — no authoritative source reviewed yet this sprint. Slated for the next research pass.",
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

/** Codes that have a real, source-backed rule (not a needs_research scaffold). */
export const SOURCED_JURISDICTIONS: string[] = SOURCED_RULES.map((r) => r.jurisdiction);

/* ---------------------------------------------------------------------------
 *  Lookup + classifier
 * ------------------------------------------------------------------------- */

export function getDocFeeRuleForState(stateCode: string): DocFeeRule | undefined {
  if (!stateCode) return undefined;
  return DOC_FEE_RULES[stateCode.toUpperCase().trim().slice(0, 2)];
}

export type DocFeeFindingStatus =
  | "not_doc_fee" // the fee label isn't a doc/processing/admin fee
  | "state_missing" // no buyer state, can't apply a rule
  | "needs_research" // state rule not yet verified
  | "unknown_rule" // researched but inconclusive / conflicting
  | "within_cap" // capped state, amount at/under the cap
  | "over_cap" // capped state, amount over the cap
  | "uncapped_dealer_controlled" // no cap; dealer-controlled
  | "disclosure_only"; // no cap; disclosure/advertising regulated

export interface DocFeeFinding {
  isDocFee: boolean;
  status: DocFeeFindingStatus;
  ruleKnown: boolean;
  withinCap?: boolean;
  overCap?: boolean;
  humanReviewRecommended: boolean;
  explanation: string;
  action: string;
  confidence: Confidence;
  jurisdiction?: string;
  capAmountCents?: number;
  source?: {
    title?: string;
    url?: string;
    type?: RuleSourceType;
    quote?: string;
  };
  limitations?: string;
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

/**
 * Classify a single fee line against the buyer's state doc-fee rule. Pure and
 * deterministic. Buyer copy is decision-support only — never an accusation.
 */
export function classifyDocFeeAmount(params: {
  stateCode?: string | null;
  feeName: string;
  amountCents: number;
}): DocFeeFinding {
  const { feeName, amountCents } = params;
  const isDocFee = isDocFeeAlias(feeName);

  if (!isDocFee) {
    return {
      isDocFee: false,
      status: "not_doc_fee",
      ruleKnown: false,
      humanReviewRecommended: false,
      explanation:
        "This line does not look like a dealer documentation/processing fee, so the doc-fee rule does not apply to it.",
      action: "No doc-fee action needed for this line.",
      confidence: "high",
    };
  }

  const stateCode = (params.stateCode ?? "").toUpperCase().trim().slice(0, 2);
  if (!stateCode) {
    return {
      isDocFee: true,
      status: "state_missing",
      ruleKnown: false,
      humanReviewRecommended: true,
      explanation:
        "This appears to be a dealer-controlled doc/processing fee, not a required government fee. We need your state to check it against the local rule.",
      action:
        "Add the state where you're buying so we can apply the right doc-fee rule. Either way, ask the dealer to itemize this charge separately from government fees.",
      confidence: "low",
    };
  }

  const rule = getDocFeeRuleForState(stateCode);
  if (!rule || rule.capType === "needs_research") {
    return {
      isDocFee: true,
      status: "needs_research",
      ruleKnown: false,
      humanReviewRecommended: true,
      jurisdiction: stateCode,
      explanation:
        "We do not have a verified current doc-fee rule for this state yet. This is still a dealer-controlled charge, not a required government fee.",
      action:
        "Ask the dealer to itemize the charge and separate it from required government charges, and consider human review before relying on a specific cap.",
      confidence: "low",
      limitations: rule?.limitations,
    };
  }

  const source = ruleSource(rule);

  if (rule.capType === "unknown") {
    return {
      isDocFee: true,
      status: "unknown_rule",
      ruleKnown: false,
      humanReviewRecommended: true,
      jurisdiction: stateCode,
      explanation:
        "We can't verify this state's current doc-fee cap yet — available sources conflict. This is still a dealer-controlled charge, not a required government fee.",
      action:
        "Ask the dealer to identify any statutory basis for the amount and to itemize it separately from government charges. Human review recommended before relying on the fee rule.",
      confidence: "low",
      source,
      limitations: rule.limitations,
    };
  }

  if (rule.capType === "disclosure_only") {
    return {
      isDocFee: true,
      status: "disclosure_only",
      ruleKnown: true,
      humanReviewRecommended: false,
      jurisdiction: stateCode,
      explanation:
        "This state appears to regulate how the processing/doc fee is disclosed rather than setting a fixed cap. It is a dealer-controlled charge, not a required government fee.",
      action:
        "Ask the dealer to clearly itemize the fee and separate it from required government charges, then negotiate the out-the-door total.",
      confidence: rule.confidence,
      source,
      limitations: rule.limitations,
    };
  }

  if (rule.capType === "uncapped") {
    return {
      isDocFee: true,
      status: "uncapped_dealer_controlled",
      ruleKnown: true,
      humanReviewRecommended: false,
      jurisdiction: stateCode,
      explanation:
        "This state does not appear to cap dealer doc/processing fees based on the available source. That does not make it a government charge — it is dealer-controlled.",
      action:
        "Treat it as dealer-controlled and negotiate the total out-the-door price. Keep it separate from required government fees.",
      confidence: rule.confidence,
      source,
      limitations: rule.limitations,
    };
  }

  // capped or formula → compare to the dollar ceiling we have.
  const cap = rule.maxAmountCents;
  if (cap === undefined) {
    // Formula with no headline dollar figure — treat as known-but-uncomputable.
    return {
      isDocFee: true,
      status: "disclosure_only",
      ruleKnown: true,
      humanReviewRecommended: false,
      jurisdiction: stateCode,
      explanation:
        "This state limits the doc/processing fee by a formula rather than a single fixed amount. It remains a dealer-controlled charge, not a government fee.",
      action:
        "Ask the dealer how the fee was computed against the state formula, and itemize it separately from government charges.",
      confidence: rule.confidence,
      source,
      limitations: rule.formulaDescription ?? rule.limitations,
    };
  }

  const overCap = amountCents > cap;
  if (overCap) {
    return {
      isDocFee: true,
      status: "over_cap",
      ruleKnown: true,
      withinCap: false,
      overCap: true,
      humanReviewRecommended: true,
      jurisdiction: stateCode,
      capAmountCents: cap,
      explanation: `Based on the available state rule, this doc/processing fee (${dollars(
        amountCents,
      )}) appears to exceed the listed ${dollars(cap)} cap${
        rule.capType === "formula" ? " (a formula/threshold that can vary)" : ""
      }. It is a dealer-controlled charge, not a required government fee.`,
      action:
        "Ask the dealer to identify the statutory basis for the charge or provide a corrected buyer's order at or below the cap.",
      confidence: rule.confidence,
      source,
      limitations: rule.limitations,
    };
  }

  return {
    isDocFee: true,
    status: "within_cap",
    ruleKnown: true,
    withinCap: true,
    overCap: false,
    humanReviewRecommended: false,
    jurisdiction: stateCode,
    capAmountCents: cap,
    explanation: `This doc/processing fee (${dollars(
      amountCents,
    )}) appears within the listed state cap of ${dollars(
      cap,
    )}, but it is still a dealer-controlled charge rather than a government tax or registration fee.`,
    action: "Confirm it is itemized correctly and separated from government fees.",
    confidence: rule.confidence,
    source,
    limitations: rule.limitations,
  };
}
