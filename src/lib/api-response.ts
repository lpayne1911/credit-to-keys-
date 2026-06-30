/**
 * ============================================================================
 *  Standard API response envelopes
 * ============================================================================
 *
 * One success shape and one error shape for every route, built as an ADDITIVE
 * superset so existing clients never break:
 *
 *   success → { ok: true, ...payload }     (legacy keys like `dealId` preserved)
 *   error   → { ok: false, error, code }   (`error` preserved; ok + code added)
 *
 * Compose with rate-limit headers via the `headers` option. The machine-readable
 * `code` lets clients branch on the failure kind instead of parsing prose.
 */
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "invalid_json"
  | "validation"
  | "rate_limited"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "unsupported_media"
  | "unavailable"
  | "upstream_error"
  | "server_error";

/** Default HTTP status for each error code (override via init.status). */
const DEFAULT_STATUS: Record<ApiErrorCode, number> = {
  invalid_json: 400,
  validation: 422,
  rate_limited: 429,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  payload_too_large: 413,
  unsupported_media: 415,
  unavailable: 503,
  upstream_error: 502,
  server_error: 500,
};

export interface ApiInit {
  /** Override the default status for the code. */
  status?: number;
  /** Extra headers (e.g. rate-limit headers). */
  headers?: HeadersInit;
}

/** Standard error envelope: `{ ok: false, error, code }`. */
export function apiError(
  code: ApiErrorCode,
  error: string,
  init: ApiInit = {},
): NextResponse {
  return NextResponse.json(
    { ok: false, error, code },
    { status: init.status ?? DEFAULT_STATUS[code], headers: init.headers },
  );
}

/** Standard success envelope: `{ ok: true, ...payload }`. Existing per-flow keys
 *  (dealId, planId, triageId, id, …) stay inside the payload unchanged. */
export function apiOk<T extends Record<string, unknown>>(
  payload: T,
  init: ApiInit = {},
): NextResponse {
  return NextResponse.json(
    { ok: true, ...payload },
    { status: init.status ?? 200, headers: init.headers },
  );
}
