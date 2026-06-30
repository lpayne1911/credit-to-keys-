/**
 * Same-origin redirect sanitizer. Anything coming from a `redirectTo` query
 * param is attacker-controllable, so we only ever allow a relative path on our
 * own origin — never an absolute URL, protocol-relative `//host`, or backslash
 * trick that a browser could resolve to another site.
 *
 * Pure, no I/O — safe to unit test and use on client or server.
 */
export function safeRedirectPath(input: unknown, fallback = "/dashboard"): string {
  if (typeof input !== "string") return fallback;
  const value = input.trim();
  // Must be a rooted path …
  if (!value.startsWith("/")) return fallback;
  // … but not protocol-relative (`//evil.com`) or a backslash variant.
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // Allowlist ordinary URL path/query characters only — rejects spaces,
  // control characters, and backslashes that could smuggle a second URL.
  if (!/^\/[A-Za-z0-9\-._~\/?#%=&:@+]*$/.test(value)) return fallback;
  if (value.length > 512) return fallback;
  return value;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a canonical UUID (used to validate claimable ids). */
export function isUuid(input: unknown): input is string {
  return typeof input === "string" && UUID_RE.test(input);
}
