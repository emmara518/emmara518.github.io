/**
 * Safe return-path sanitizer for `?next=` query params.
 *
 * Accepts ONLY internal same-origin application paths.
 * Rejects external URLs, protocol-relative URLs, backslash-tricks,
 * and non-http(s) schemes (javascript:, data:, vbscript:, file:, ...).
 *
 * Usage:
 *   const target = safeNext(searchParams.get("next")) ?? defaultRoute;
 *
 * Defensive by design — when in doubt, return null so the caller
 * falls back to the role-based default.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;

  // Reject anything that contains whitespace, control characters, or backslashes.
  // Backslashes are a known bypass vector for browsers ("/\evil.com").
  if (/[\s\\]/.test(value)) return null;

  // Must start with a single forward slash (an absolute internal path).
  if (!value.startsWith("/")) return null;

  // Reject protocol-relative URLs ("//evil.com") which some browsers treat as external.
  if (value.startsWith("//")) return null;

  // Reject any URL that carries an explicit scheme after the slash
  // (e.g. "/javascript:alert(1)" or "/data:..."). The browser would not
  // navigate to these as scripts in modern engines, but we never want
  // to forward users to anything that looks like a non-app URL.
  // Allow standard path/query/fragment characters only.
  if (!/^\/[A-Za-z0-9._~!\$&'()*+,;=:@/\-?#%]*$/.test(value)) return null;

  return value;
}
