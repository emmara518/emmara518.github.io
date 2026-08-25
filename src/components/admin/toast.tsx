"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "ok" | "err" | "info";
export type ToastItem = { id: number; kind: ToastKind; text: string };

/** Tiny toast queue with auto-dismiss. Render <ToastViewport/> once near the root. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, kind, text }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  return { toasts, push, dismiss };
}

const TOAST_STYLES: Record<ToastKind, { icon: typeof Info; box: string; iconColor: string }> = {
  ok: { icon: CheckCircle2, box: "border-success/30 bg-surface", iconColor: "text-success" },
  err: { icon: AlertCircle, box: "border-danger/40 bg-surface", iconColor: "text-danger" },
  info: { icon: Info, box: "border-line bg-surface", iconColor: "text-brand" },
};

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      role="status"
      className="no-print fixed bottom-4 left-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-2"
    >
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.kind];
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lift animate-in fade-in slide-in-from-bottom-2",
              s.box
            )}
          >
            <Icon size={17} className={cn("mt-0.5 shrink-0", s.iconColor)} />
            <p className="flex-1 text-[13px] font-medium leading-relaxed text-ink">{t.text}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="إغلاق التنبيه"
              className="rounded-md p-0.5 text-muted transition-colors hover:text-ink cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
