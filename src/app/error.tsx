"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, buttonStyles } from "@/components/ui";

/**
 * Per-route error boundary. Catches any uncaught render error in the
 * route segment and its descendants, then offers a reset. Server-side
 * errors that bubble here have their messages redacted in production.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console so the operator can see it
    // during development. In production this is the only signal the
    // dev gets until telemetry is wired.
    console.error("[drosmath] route error:", error);
  }, [error]);

  const showMessage = process.env.NODE_ENV !== "production";

  return (
    <main className="mx-auto grid max-w-lg place-items-center px-4 py-24 sm:px-6">
      <Card className="grid w-full place-items-center gap-4 p-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle size={26} aria-hidden />
        </span>
        <p className="font-mono text-xs font-bold uppercase tracking-tag text-danger">
          خطأ غير متوقع
        </p>
        <h1 className="text-2xl font-black">حدث خطأ في عرض هذه الصفحة</h1>
        <p className="text-base leading-7 text-muted">
          حاول إعادة تحميل المكوّن. إذا تكرّر الخطأ، عُد إلى الصفحة الرئيسية أو تواصل مع الدعم.
        </p>
        {showMessage && error?.message ? (
          <p
            dir="ltr"
            className="w-full max-w-md truncate rounded-lg border border-line bg-surface2/60 px-3 py-2 text-left font-mono text-xs text-muted"
            title={error.message}
          >
            {error.message}
          </p>
        ) : null}
        {error?.digest ? (
          <p className="font-mono text-[11px] text-muted/80" dir="ltr">
            digest: {error.digest}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={reset}
            className={buttonStyles("primary", "md")}
          >
            <RefreshCw size={15} />
            إعادة المحاولة
          </button>
          <Link href="/" className={buttonStyles("outline", "md")}>
            العودة للرئيسية
          </Link>
        </div>
      </Card>
    </main>
  );
}
