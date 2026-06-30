import { describe, it, expect } from "vitest";
import { claimSchema } from "./schemas";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("claimSchema", () => {
  it("accepts exactly one of dealId / intakeId", () => {
    expect(claimSchema.safeParse({ dealId: UUID }).success).toBe(true);
    expect(claimSchema.safeParse({ intakeId: UUID }).success).toBe(true);
  });

  it("rejects neither, both, and non-uuids", () => {
    expect(claimSchema.safeParse({}).success).toBe(false);
    expect(claimSchema.safeParse({ dealId: UUID, intakeId: UUID }).success).toBe(false);
    expect(claimSchema.safeParse({ dealId: "nope" }).success).toBe(false);
  });
});
