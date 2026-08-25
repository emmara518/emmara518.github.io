"use client";

import { useEffect, useRef } from "react";
import { GraduationCap, Mail, Receipt, Wallet, X, Award } from "lucide-react";
import { Badge } from "../ui";
import { formatDate, formatEGP } from "@/lib/format";
import { statusLabel, statusTone, actionLabel } from "./primitives";
import type { AttemptRow, OrderRow, SubscriptionRow, UserRow } from "./types";

/**
 * Student 360° profile — everything known about one student in a single
 * accessible modal: identity, wallet, subscriptions, orders, exam attempts.
 * Data is composed from the already-loaded admin datasets (no extra fetches).
 */
export function StudentProfileModal({
  student,
  subscriptions,
  orders,
  attempts,
  onClose,
  onAdjustWallet,
}: {
  student: UserRow | null;
  subscriptions: SubscriptionRow[];
  orders: OrderRow[];
  attempts: AttemptRow[];
  onClose: () => void;
  onAdjustWallet: (student: UserRow) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!student) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLButtonElement>("[data-autofocus]")?.focus();
    }, 30);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [student]);

  if (!student) return null;

  const mySubs = subscriptions.filter((s) => s.studentEmail === student.email);
  const myOrders = orders.filter((o) => o.studentEmail === student.email);
  const myAttempts = attempts.filter((a) => a.studentEmail === student.email);
  const spentTotal = myOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const avgPct =
    myAttempts.length > 0
      ? Math.round(
          myAttempts.reduce((sum, a) => sum + (a.score / (a.totalMarks || 1)) * 100, 0) / myAttempts.length
        )
      : null;

  return (
    <div
      className="no-print fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-profile-title"
        className="custom-scrollbar max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-lift animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-surface px-6 pb-4 pt-5">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
              {student.name.trim().charAt(0)}
            </span>
            <div>
              <h3 id="student-profile-title" className="font-brand text-lg font-semibold leading-snug text-ink">
                {student.name}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <Mail size={12} />
                <span dir="ltr">{student.email}</span>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => navigator.clipboard.writeText(student.email)}
                  className="cursor-pointer rounded border border-line px-1.5 py-0.5 text-[10px] text-muted transition-colors hover:border-brand/50 hover:text-brand"
                >
                  نسخ
                </button>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface2/60 p-3 text-center">
              <p className="text-[11px] text-muted">الرصيد الحالي</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-brand">{formatEGP(student.balanceCents)}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/60 p-3 text-center">
              <p className="text-[11px] text-muted">الاشتراكات النشطة</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">
                {mySubs.filter((s) => s.status === "active").length}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/60 p-3 text-center">
              <p className="text-[11px] text-muted">إجمالي المدفوع</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">{formatEGP(spentTotal)}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface2/60 p-3 text-center">
              <p className="text-[11px] text-muted">متوسط الدرجات</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">
                {avgPct !== null ? `${avgPct}%` : "—"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAdjustWallet(student)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
            >
              <Wallet size={14} /> تعديل المحفظة
            </button>
            <span className="text-[11px] text-muted">
              مسجل منذ <span dir="ltr">{formatDate(student.createdAt)}</span>
            </span>
          </div>

          {/* Subscriptions */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <GraduationCap size={13} /> الاشتراكات ({mySubs.length})
            </h4>
            {mySubs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-surface2/40 px-4 py-3 text-center text-xs text-muted">
                لا توجد اشتراكات لهذا الطالب بعد.
              </p>
            ) : (
              <div className="space-y-1.5">
                {mySubs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface2/40 px-3.5 py-2.5 text-xs">
                    <span className="font-medium text-ink">{s.courseTitle}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums text-muted" dir="ltr">{formatDate(s.startsAt)}</span>
                      <Badge tone={statusTone(s.status)}>{statusLabel(s.status)}</Badge>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Orders */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Receipt size={13} /> الطلبات ({myOrders.length})
            </h4>
            {myOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-surface2/40 px-4 py-3 text-center text-xs text-muted">
                لا توجد طلبات شراء.
              </p>
            ) : (
              <div className="space-y-1.5">
                {myOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface2/40 px-3.5 py-2.5 text-xs">
                    <span className="font-medium text-ink">{o.courseTitle}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold tabular-nums text-brand">{formatEGP(o.totalCents)}</span>
                      <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Exam attempts */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Award size={13} /> محاولات الامتحانات ({myAttempts.length})
            </h4>
            {myAttempts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-surface2/40 px-4 py-3 text-center text-xs text-muted">
                لم يتقدّم لأي امتحان بعد.
              </p>
            ) : (
              <div className="space-y-1.5">
                {myAttempts.map((a) => {
                  const pct = Math.round((a.score / (a.totalMarks || 1)) * 100);
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface2/40 px-3.5 py-2.5 text-xs">
                      <span className="font-medium text-ink">{a.examTitle}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums text-muted">{a.score}/{a.totalMarks}</span>
                        <Badge tone={pct >= 85 ? "success" : pct >= 50 ? "gold" : "danger"}>{pct}%</Badge>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
