/**
 * Pure index operations for the workspace. No storage, no Date — deterministic
 * and unit-testable. The client store (store.ts) layers localStorage on top.
 *
 * Identity is (type, id): the same underlying result is one entry, so re-saving
 * updates in place rather than duplicating.
 */
import type { SavedReport } from "./types";

const sameEntry = (a: { id: string; type: string }, b: { id: string; type: string }) =>
  a.id === b.id && a.type === b.type;

/** Insert or replace an entry, keeping the list newest-first. */
export function upsert(list: SavedReport[], entry: SavedReport): SavedReport[] {
  const without = list.filter((e) => !sameEntry(e, entry));
  return sortByNewest([entry, ...without]);
}

/** Remove the entry matching (type, id). */
export function removeEntry(list: SavedReport[], type: string, id: string): SavedReport[] {
  return list.filter((e) => !sameEntry(e, { type, id }));
}

/** Newest-first by createdAt; stable for equal timestamps. */
export function sortByNewest(list: SavedReport[]): SavedReport[] {
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/** Defensive: keep only well-formed entries (guards corrupt/legacy storage). */
export function sanitize(value: unknown): SavedReport[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: SavedReport[] = [];
  for (const v of value) {
    if (
      v &&
      typeof v === "object" &&
      typeof (v as SavedReport).id === "string" &&
      typeof (v as SavedReport).type === "string" &&
      typeof (v as SavedReport).title === "string" &&
      typeof (v as SavedReport).createdAt === "string" &&
      typeof (v as SavedReport).href === "string"
    ) {
      const key = `${(v as SavedReport).type}:${(v as SavedReport).id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v as SavedReport);
    }
  }
  return sortByNewest(out);
}
