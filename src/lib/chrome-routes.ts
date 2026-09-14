/**
 * Central chrome map — the single source of truth for which chrome a route
 * renders. Both the public chrome gate (header/footer/background) and the
 * public header read from here, so the route-to-chrome decision lives in one
 * place instead of being duplicated per component.
 *
 * Route → chrome contract:
 *   - APP_SHELL_ROUTES  → the route renders its own shell; shared public
 *     chrome is suppressed.
 *   - AUTH_ROUTES       → public chrome renders, but never authenticated
 *     identity (user chip / dashboard link / logout).
 *   - everything else   → normal public chrome.
 */

/** Routes that render their own workspace shell (topbar/sidebar) or a
 *  standalone full-screen surface. The shared public header (fixed, z-50)
 *  must not render on top of them — it produced a second header on
 *  /notifications and public chrome over authenticated pages. */
export const APP_SHELL_ROUTES = [
  "/dashboard",
  "/admin",
  "/parent",
  "/notifications",
  "/welcome",
] as const;

/** Routes whose header must never expose authenticated identity, even when a
 *  valid session cookie exists (e.g. a returned-from-redirect visitor). */
export const AUTH_ROUTES = ["/login", "/register", "/register-parent"] as const;

function matches(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isAppShellRoute(pathname: string): boolean {
  return APP_SHELL_ROUTES.some((route) => matches(pathname, route));
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => matches(pathname, route));
}
