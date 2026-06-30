import { describe, it, expect } from "vitest";
import { parseAprBenchmark } from "./normalize";

describe("parseAprBenchmark", () => {
  it("builds a band from recent observations (latest first)", () => {
    const b = parseAprBenchmark(
      {
        observations: [
          { date: "2024-04-01", value: "7.9" },
          { date: "2024-01-01", value: "7.4" },
          { date: "2023-10-01", value: "7.1" },
        ],
      },
      60,
    );
    expect(b).not.toBeNull();
    expect(b!.source).toBe("fred");
    expect(b!.term).toBe(60);
    expect(b!.asOf).toBe("2024-04-01");
    // low = recent min (7.1); high = max(recent max 7.9, center+1.5 = 9.4) = 9.4
    expect(b!.low).toBe(7.1);
    expect(b!.high).toBe(9.4);
  });

  it("ignores FRED missing markers ('.') and non-positive values", () => {
    const b = parseAprBenchmark(
      {
        observations: [
          { date: "2024-04-01", value: "." },
          { date: "2024-01-01", value: "8.0" },
        ],
      },
      48,
    );
    expect(b!.asOf).toBe("2024-01-01");
    expect(b!.low).toBe(8);
  });

  it("returns null when there is no usable observation", () => {
    expect(parseAprBenchmark(null, 60)).toBeNull();
    expect(parseAprBenchmark({ observations: [] }, 60)).toBeNull();
    expect(parseAprBenchmark({ observations: [{ date: "2024-01-01", value: "." }] }, 60)).toBeNull();
  });
});
