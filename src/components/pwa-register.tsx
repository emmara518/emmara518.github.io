"use client";

import { useEffect } from "react";

/**
 * Registers the DROS MATH service worker. Mounted once at the root.
 * Safe in dev (the SW only takes effect in production-like contexts).
 * Updates are picked up via the standard "waiting" → "skipWaiting" flow.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Promote a new waiting worker as soon as it appears.
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          reg.addEventListener("updatefound", () => {
            const next = reg.installing;
            if (!next) return;
            next.addEventListener("statechange", () => {
              if (next.state === "installed" && navigator.serviceWorker.controller) {
                reg.waiting?.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        })
        .catch(() => {
          // Silent: the SW is progressive enhancement. If registration
          // fails (CSP, browser policy, dev quirks) the app still works.
        });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
