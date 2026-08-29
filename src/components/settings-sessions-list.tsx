"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Badge, buttonStyles } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import {
  ConfirmDialog,
  type ConfirmRequest,
} from "@/components/admin/confirm-dialog";

export type SessionRow = {
  id: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  isCurrent: boolean;
};

/**
 * Active sessions list + the "log out other devices" action.
 *
 * The destructive action is gated by a ConfirmDialog (requireText="خروج")
 * so an accidental click can't log the user out of every other device.
 * The visual treatment of the trigger button is preserved from the original
 * `LogoutAllButton` — only the click handler now opens a dialog.
 */
export function SettingsSessionsList({
  sessions,
}: {
  sessions: SessionRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  async function revokeAll(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/me/sessions", { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر تنفيذ الطلب");
        return;
      }
      setDone(json.data.revoked ?? 0);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {sessions.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted">لا توجد جلسات نشطة.</li>
        ) : (
          sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 px-4 py-3 first:pt-3 last:pb-3"
            >
              <div className="min-w-0">
                <p className="text-base font-semibold text-ink">
                  جلسة {formatDateTime(s.createdAt)}
                  {s.isCurrent ? " — الجهاز الحالي" : ""}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  تنتهي: {formatDateTime(s.expiresAt)}
                </p>
              </div>
              {s.isCurrent ? <Badge tone="success">نشطة</Badge> : <Badge tone="muted">أخرى</Badge>}
            </li>
          ))
        )}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || sessions.length <= 1}
          onClick={() =>
            setConfirm({
              title: "إنهاء كل الجلسات الأخرى؟",
              description:
                "سيتم تسجيل خروجك من كل الأجهزة الأخرى فوراً. هذا الإجراء لا يمكن التراجع عنه.",
              confirmLabel: "إنهاء الجلسات",
              tone: "danger",
              requireText: "خروج",
              onConfirm: revokeAll,
            })
          }
          className={buttonStyles("outline", "sm")}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} className="-scale-x-100" />}
          تسجيل الخروج من باقي الأجهزة
        </button>
        {done !== null && !error ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-success">
            <ShieldCheck size={14} />
            {done > 0 ? `تم إنهاء ${done} جلسة أخرى` : "لا توجد جلسات أخرى"}
          </span>
        ) : null}
        {error ? <span className="text-sm font-semibold text-danger">{error}</span> : null}
      </div>

      <p className="text-xs leading-relaxed text-muted">
        إنهاء بقية الجلسات يُسجل خروجك من جميع الأجهزة الأخرى ويحتفظ بجلستك الحالية.
      </p>

      <ConfirmDialog request={confirm} onDone={() => setConfirm(null)} />
    </div>
  );
}
