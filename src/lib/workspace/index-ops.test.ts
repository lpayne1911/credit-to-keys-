import { describe, it, expect } from "vitest";
import { upsert, removeEntry, sortByNewest, sanitize } from "./index-ops";
import type { SavedReport } from "./types";

const entry = (over: Partial<SavedReport> = {}): SavedReport => ({
  id: "1",
  type: "quote-review",
  title: "2021 Toyota Camry",
  createdAt: "2026-01-01T00:00:00.000Z",
  href: "/deal-review/1",
  ...over,
});

describe("workspace index-ops", () => {
  it("upsert adds new entries newest-first", () => {
    let list: SavedReport[] = [];
    list = upsert(list, entry({ id: "a", createdAt: "2026-01-01T00:00:00.000Z" }));
    list = upsert(list, entry({ id: "b", createdAt: "2026-02-01T00:00:00.000Z" }));
    expect(list.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("upsert replaces an existing (type,id) instead of duplicating", () => {
    let list = [entry({ id: "a", title: "old" })];
    list = upsert(list, entry({ id: "a", title: "new" }));
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("new");
  });

  it("treats same id under different types as distinct entries", () => {
    let list = [entry({ id: "x", type: "quote-review" })];
    list = upsert(list, entry({ id: "x", type: "target-plan", href: "/plan/x" }));
    expect(list).toHaveLength(2);
  });

  it("removeEntry removes only the matching (type,id)", () => {
    const list = [entry({ id: "x", type: "quote-review" }), entry({ id: "x", type: "target-plan" })];
    const after = removeEntry(list, "quote-review", "x");
    expect(after).toHaveLength(1);
    expect(after[0].type).toBe("target-plan");
  });

  it("sortByNewest orders by createdAt descending", () => {
    const list = [
      entry({ id: "a", createdAt: "2026-01-01T00:00:00.000Z" }),
      entry({ id: "c", createdAt: "2026-03-01T00:00:00.000Z" }),
      entry({ id: "b", createdAt: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(sortByNewest(list).map((e) => e.id)).toEqual(["c", "b", "a"]);
  });

  it("sanitize drops malformed entries and dedupes", () => {
    const dirty = [
      entry({ id: "a" }),
      { id: "b" }, // missing fields
      null,
      entry({ id: "a" }), // duplicate
      "nope",
    ];
    const clean = sanitize(dirty);
    expect(clean.map((e) => e.id)).toEqual(["a"]);
  });

  it("sanitize returns empty for non-array input", () => {
    expect(sanitize(null)).toEqual([]);
    expect(sanitize({})).toEqual([]);
  });
});
