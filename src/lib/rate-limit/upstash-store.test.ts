import { describe, it, expect, vi, afterEach } from "vitest";
import { createUpstashStore } from "./upstash-store";

function mockFetch(pipelineResult: unknown, ok = true, status = 200) {
  const fn = vi.fn(async () =>
    ({
      ok,
      status,
      json: async () => pipelineResult,
    }) as unknown as Response,
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createUpstashStore", () => {
  it("sends an INCR/PEXPIRE(NX)/PTTL pipeline with auth and parses the result", async () => {
    const fetchFn = mockFetch([{ result: 1 }, { result: 1 }, { result: 60000 }]);
    const store = createUpstashStore("https://example.upstash.io/", "tok_123");

    const hit = await store.hit("deals:1.2.3.4", 60000, 1_000_000);

    expect(hit.count).toBe(1);
    expect(hit.resetAt).toBe(1_000_000 + 60000);

    // Trailing slash trimmed; pipeline endpoint; bearer token; correct commands.
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://example.upstash.io/pipeline");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok_123");
    expect(JSON.parse(init.body as string)).toEqual([
      ["INCR", "deals:1.2.3.4"],
      ["PEXPIRE", "deals:1.2.3.4", "60000", "NX"],
      ["PTTL", "deals:1.2.3.4"],
    ]);
  });

  it("reports the running count for repeat hits in the same window", async () => {
    mockFetch([{ result: 5 }, { result: 0 }, { result: 30000 }]);
    const store = createUpstashStore("https://example.upstash.io", "tok");
    const hit = await store.hit("k", 60000, 0);
    expect(hit.count).toBe(5);
    expect(hit.resetAt).toBe(30000);
  });

  it("falls back to a full window when PTTL has no expiry (-1/-2)", async () => {
    mockFetch([{ result: 1 }, { result: 1 }, { result: -2 }]);
    const store = createUpstashStore("https://example.upstash.io", "tok");
    const hit = await store.hit("k", 60000, 100);
    expect(hit.resetAt).toBe(100 + 60000);
  });

  it("throws on a non-OK HTTP response (so the limiter degrades to memory)", async () => {
    mockFetch(null, false, 500);
    const store = createUpstashStore("https://example.upstash.io", "tok");
    await expect(store.hit("k", 60000, 0)).rejects.toThrow(/500/);
  });

  it("throws when the pipeline reports a command error", async () => {
    mockFetch([{ error: "WRONGTYPE" }, { result: 0 }, { result: 0 }]);
    const store = createUpstashStore("https://example.upstash.io", "tok");
    await expect(store.hit("k", 60000, 0)).rejects.toThrow(/WRONGTYPE/);
  });
});
