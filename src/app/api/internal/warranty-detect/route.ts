/**
 * POST /api/internal/warranty-detect — INTERNAL verification tooling ONLY.
 *
 * A safe, read-only way to verify the warranty/service-contract matcher in any
 * environment (including production) without uploading a document or touching
 * the database. It classifies a single text line and returns the decision.
 *
 * SECURITY:
 *  - Disabled by default: returns 404 unless DIAGNOSTIC_SECRET is configured.
 *  - Requires the secret via the `x-diagnostic-secret` header (401 otherwise).
 *  - No database access, no writes, no customer data, no PII.
 *  - Basic per-instance rate limiting as defense-in-depth.
 *  - Not linked anywhere in the app's navigation.
 */
import { NextResponse } from "next/server";
import { detectWarrantyLineItem } from "@/lib/warranty/detect-warranty-line-item";

export const runtime = "nodejs";

// Simple per-instance fixed-window rate limiter (best-effort; serverless
// instances are short-lived, so this is a courtesy guard, not a hard cap).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
let windowStart = 0;
let windowCount = 0;
function rateLimited(now: number): boolean {
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const secret = process.env.DIAGNOSTIC_SECRET;
  // Disabled unless explicitly configured — keeps it off in any env by default.
  if (!secret) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (req.headers.get("x-diagnostic-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (rateLimited(Date.now())) {
    return NextResponse.json({ error: "Rate limited." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  const text = (body as { text?: unknown })?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: 'Body must be { "text": "<line item>" }.' },
      { status: 400 },
    );
  }

  const d = detectWarrantyLineItem(text);
  return NextResponse.json({
    input: text,
    isWarrantyLike: d.isWarranty,
    matchedTerm: d.matchedTerm,
    // The matcher classifies on distinctive terms, not on a single display name,
    // and it is rule-based (deterministic), so there is no probabilistic score.
    matchedDisplayName: d.matchedTerm,
    category: d.isWarranty ? "vehicle_service_contract" : null,
    confidence: d.isWarranty ? "rule-based" : null,
    excludedReason: d.excludedBy,
  });
}
