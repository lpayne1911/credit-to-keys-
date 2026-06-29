import { describe, expect, it } from "vitest";
import { classifyFee, classifyFees } from "./classifyFees";

describe("classifyFees", () => {
  it("routes a doc fee through the state-aware authority (CA over cap)", () => {
    const f = classifyFee({ rawLabel: "Doc Fee", amount: 500 }, { stateCode: "CA" });
    expect(f.category).toBe("doc_fee");
    expect(f.docFee?.overCap).toBe(true);
    expect(f.assessment).toBe("questionable");
    expect(f.estimatedImpact).not.toBeNull();
  });

  it("treats a within-cap doc fee as likely legitimate", () => {
    const f = classifyFee({ rawLabel: "Documentation Fee", amount: 85 }, { stateCode: "CA" });
    expect(f.category).toBe("doc_fee");
    expect(f.assessment).toBe("likely_legitimate");
  });

  it("marks doc fee state-dependent when no state is given", () => {
    const f = classifyFee({ rawLabel: "Processing Fee", amount: 400 });
    expect(f.category).toBe("doc_fee");
    expect(f.assessment).toBe("state_dependent");
  });

  it("flags nitrogen as likely junk and title/registration as legitimate", () => {
    const nitro = classifyFee({ rawLabel: "Nitrogen", amount: 199 });
    expect(nitro.category).toBe("nitrogen");
    expect(nitro.assessment).toBe("likely_junk");

    const title = classifyFee({ rawLabel: "Title & Registration", amount: 350 });
    expect(title.category).toBe("government");
    expect(title.assessment).toBe("likely_legitimate");
  });

  it("classifies dealer prep / recon as negotiable, VIN etch as junk", () => {
    expect(classifyFee({ rawLabel: "Reconditioning", amount: 600 }).category).toBe("dealer_prep");
    expect(classifyFee({ rawLabel: "VIN Etch", amount: 299 }).assessment).toBe("likely_junk");
  });

  it("returns unknown for an unrecognized label", () => {
    const f = classifyFee({ rawLabel: "Sparkle Surcharge", amount: 120 });
    expect(f.category).toBe("other");
    expect(f.assessment).toBe("unknown");
  });

  it("filters empty lines", () => {
    expect(classifyFees([{ rawLabel: "", amount: 0 }])).toHaveLength(0);
  });
});
