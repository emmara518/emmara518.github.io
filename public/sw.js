/* DROS MATH — Service Worker
 * Strategy:
 *   - HTML navigations: network-first, fall back to cached "/" offline.
 *   - Static assets (/_next/static, /icons, /fonts, /images): stale-while-revalidate.
 *   - API: network-only (never cache mutable data).
 *   - YouTube embeds and other third-party origins: ignored.
 *
 * Caches:
 *   - dros-static-v1  : static assets, fonts, icons
 *   - dros-shell-v1   : offline fallback for the root route
 */

const CACHE_STATIC = "dros-static-v1";
const CACHE_SHELL = "dros-shell-v1";
const SHELL_URL = "/";
const SHELL_FALLBACK =
  "<!doctype html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"utf-8\">" +
  "<title>DROS MATH — غير متصل</title><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
  "<style>body{margin:0;background:#0F1413;color:#E6ECEA;font-family:system-ui,-apple-system,Tahoma,sans-serif;" +
  "display:grid;place-items:center;min-height:100vh;padding:2rem;text-align:center;}" +
  "h1{color:#3FA4A7;margin:0 0 .5rem;font-size:1.25rem;}.btn{display:inline-block;margin-top:1rem;" +
  "background:#287F83;color:#fff;padding:.6rem 1.1rem;border-radius:.6rem;text-decoration:none;font-weight:700;}" +
  "</style></head><body><div><h1>DROS MATH</h1><p>لا يوجد اتصال بالإنترنت حاليًا.</p>" +
  "<a class=\"btn\" href=\"/\">حاول مرة أخرى</a></div></body></html>";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_SHELL);
      try {
        await cache.add(SHELL_URL);
      } catch (e) {
        // The root may be auth-gated; the SW will still work for cached
        // static assets and the runtime fallback will catch navigations.
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_SHELL)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/favicon-32.png" ||
    url.pathname === "/apple-touch-icon.png"
  );
}

function isApi(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/api/");
}

function isHtmlNavigation(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API responses (auth, mutations, live data).
  if (isApi(url)) return;

  // HTML navigations: network-first, fall back to cached shell, then inline shell.
  if (isHtmlNavigation(request)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          // Stash a copy of the root for the offline fallback.
          if (url.pathname === "/" || url.pathname === "/index.html") {
            const cache = await caches.open(CACHE_SHELL);
            cache.put(SHELL_URL, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch (_) {
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match(SHELL_URL);
          if (shell) return shell;
          return new Response(SHELL_FALLBACK, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
      })()
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_STATIC);
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
        return cached || (await networkPromise);
      })()
    );
    return;
  }

  // Everything else (cross-origin, etc.): network passthrough.
});
