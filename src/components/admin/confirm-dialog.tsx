"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { buttonStyles } from "../ui";
import { cn } from "@/lib/utils";

export type ConfirmRequest = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = red confirm (destructive), primary = brand confirm */
  tone?: "danger" | "primary";
  /** When set, the user must type this exact text to unlock the confirm button */
  requireText?: string;
  onConfirm: () => void | Promise<void>;
};

/**
 * Accessible confirmation dialog:
 * role=dialog + aria-modal, Escape cancels, focus is trapped,
 * body scroll locked, optional type-to-confirm for critical actions.
 */
export function ConfirmDialog({
  request,
  onDone,
}: {
  request: ConfirmRequest | null;
  /** Called after the confirm flow fully finishes (success or cancel) to clear the request. */
  onDone: () => void;
}) {
  const open = request !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset transient state whenever a new request arrives — official
  // "adjust state during render" pattern (no effect needed).
  const [prevRequest, setPrevRequest] = useState<ConfirmRequest | null>(request);
  if (request !== prevRequest) {
    setPrevRequest(request);
    setTyped("");
    setBusy(false);
  }

  // Initial focus + body scroll lock
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      if (request?.requireText) textRef.current?.focus();
      else confirmRef.current?.focus();
    }, 30);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, request?.requireText]);

  const cancel = useCallback(() => {
    if (busy) return;
    onDone();
  }, [busy, onDone]);

  // Escape to cancel + focus trap
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cancel();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [cancel]
  );

  if (!open || !request) return null;
  const req: ConfirmRequest = request;

  const tone = req.tone ?? "danger";
  const unlocked = !req.requireText || typed.trim() === req.requireText;

  async function handleConfirm() {
    if (!unlocked || busy) return;
    setBusy(true);
    try {
      await req.onConfirm();
    } finally {
      setBusy(false);
      onDone();
    }
  }

  return (
    <div
      className="no-print fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lift space-y-4 animate-in fade-in zoom-in-95"
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl",
              tone === "danger" ? "bg-danger/10 text-danger" : "bg-brand/10 text-brand"
            )}
          >
            <AlertTriangle size={19} />
          </span>
          <div className="space-y-1 flex-1">
            <h3 id="confirm-dialog-title" className="font-brand text-base font-bold leading-relaxed text-ink">
              {req.title}
            </h3>
            {req.description ? (
              <p className="text-sm leading-relaxed text-muted">{req.description}</p>
            ) : null}
          </div>
        </div>

        {request.requireText ? (
          <input
            ref={textRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={`اكتب «${request.requireText}» للتأكيد`}
            aria-label={`اكتب ${request.requireText} للتأكيد`}
            className="h-11 w-full rounded-xl border border-line bg-surface2 px-3.5 text-sm text-ink outline-none transition-colors focus:border-brand"
            dir="rtl"
          />
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={cancel} disabled={busy} className={buttonStyles("ghost")}>
            {req.cancelLabel ?? "إلغاء"}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            disabled={!unlocked || busy}
            className={cn(
              buttonStyles(),
              tone === "danger"
                ? "bg-danger text-white hover:brightness-110 border-0"
                : "bg-brand text-white hover:bg-brand-strong border-0"
            )}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : null}
            {req.confirmLabel ?? "تأكيد"}
          </button>
        </div>
      </div>
    </div>
  );
}
