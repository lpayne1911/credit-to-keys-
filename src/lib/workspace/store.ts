/**
 * Workspace store — client-only (localStorage). Persists each report's full
 * payload plus a single index of all of them, so the dashboard can list and
 * reopen them. All functions are no-ops / empty on the server or when storage
 * is blocked, so callers don't need to guard.
 */
import type { ReportType, SavedReport } from "./types";
import { upsert, removeEntry, sanitize } from "./index-ops";

const INDEX_KEY = "da:reports";
const payloadKey = (type: ReportType, id: string) => `da:report:${type}:${id}`;

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function listReports(): SavedReport[] {
  if (!hasStorage()) return [];
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(INDEX_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function writeIndex(list: SavedReport[]): void {
  try {
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(list));
  } catch {
    // quota/blocked — the payload may still be saved; index just won't update
  }
}

/**
 * Persist a report payload + register it in the index. `createdAt` is stamped
 * here (the one allowed clock read, at the storage boundary). Returns the index
 * entry, or null if storage is unavailable.
 */
export function saveReport(
  type: ReportType,
  id: string,
  payload: unknown,
  meta: { title: string; subtitle?: string; href: string },
): SavedReport | null {
  if (!hasStorage()) return null;
  const entry: SavedReport = {
    id,
    type,
    title: meta.title,
    subtitle: meta.subtitle,
    createdAt: new Date().toISOString(),
    href: meta.href,
  };
  try {
    window.localStorage.setItem(payloadKey(type, id), JSON.stringify(payload));
  } catch {
    return null; // can't store the payload → don't claim it's saved
  }
  writeIndex(upsert(listReports(), entry));
  return entry;
}

/** Read a stored payload back. The caller validates its shape (schemaVersion). */
export function getReportPayload<T>(type: ReportType, id: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(payloadKey(type, id));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function removeReport(type: ReportType, id: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(payloadKey(type, id));
  } catch {
    // ignore
  }
  writeIndex(removeEntry(listReports(), type, id));
}
