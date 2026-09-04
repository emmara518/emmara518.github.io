"use client";

import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight PWA helpers. Mounted once at the root.
 *
 * - Offline banner: shown when the browser goes offline.
 * - Install prompt: captures the deferred `beforeinstallprompt` event
 *   and surfaces a small floating CTA (Chrome / Edge / Samsung).
 *
 * Both are progressive enhancement: if the browser doesn't fire the
 * respective events, the component simply renders nothing.
 */
export function PwaChrome() {
  const [offline, setOffline] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Defer the initial setState to avoid `react-hooks/set-state-in-effect`.
    const t = window.setTimeout(() => setOffline(!navigator.onLine), 0);
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function triggerInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    try {
      await installEvent.userChoice;
    } catch {
      /* user dismissed or browser rejected */
    }
    setInstallEvent(null);
  }

  if (typeof window === "undefined") return null;

  const showInstall = !dismissed && !installed && installEvent !== null;
  const showOffline = offline;

  if (!showInstall && !showOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-3 z-[60] flex flex-col items-center gap-2 px-3 sm:bottom-4 sm:px-4"
    >
      {showOffline ? (
        <div
          className="pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm font-bold text-ink shadow-lift backdrop-blur"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-warning/20 text-warning">
            <WifiOff size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm">أنت غير متصل بالإنترنت</p>
            <p className="text-[11px] font-normal text-muted">
              الصفحة الحالية من الذاكرة المحلية. البيانات الحية متوقفة.
            </p>
          </div>
        </div>
      ) : null}

      {showInstall ? (
        <div
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl border border-brand/30 bg-surface/95 px-3.5 py-2.5 shadow-lift backdrop-blur",
            showOffline && "hidden",
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
            <Download size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">ثبّت DROS MATH</p>
            <p className="text-[11px] font-normal text-muted">وصول سريع · يعمل بدون إنترنت</p>
          </div>
          <button
            type="button"
            onClick={triggerInstall}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-strong"
          >
            تثبيت
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="إغلاق"
            className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-ink"
          >
            <X size={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

// Minimal type so we don't depend on the experimental web types.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}
