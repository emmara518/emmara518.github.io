"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlarmClock } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Search highlighting: wraps query matches in a soft brand mark ── */
export function Highlight({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  if (!q || q.length === 0) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <mark className="rounded-sm bg-brand/25 px-0.5 text-ink">{match}</mark>
      {after}
    </>
  );
}

/* ── Coupon expiry intelligence badge ── */
export type ExpiryState = "none" | "active" | "expiring" | "expired";

export function expiryState(expiresAt: string | null, isUsedUp = false): ExpiryState {
  if (isUsedUp) return "expired";
  if (!expiresAt) return "none";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expired";
  if (diff <= 7 * 86400000) return "expiring";
  return "active";
}

export function ExpiryBadge({ state, dateLabel }: { state: ExpiryState; dateLabel?: string }) {
  if (state === "none") {
    return <span className="text-xs text-muted">{dateLabel ?? "غير محدد"}</span>;
  }
  if (state === "expired") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
        <AlarmClock size={12} /> منتهي {dateLabel ? <span dir="ltr" className="tabular-nums">({dateLabel})</span> : null}
      </span>
    );
  }
  if (state === "expiring") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold">
        <AlarmClock size={12} /> ينتهي قريباً {dateLabel ? <span dir="ltr" className="tabular-nums">({dateLabel})</span> : null}
      </span>
    );
  }
  return (
    <span className="tabular-nums text-xs text-muted" dir="ltr">
      {dateLabel}
    </span>
  );
}

/* ── Relative Arabic time ("قبل ٣ دقائق") ── */
export function relativeTime(iso: string | Date): string {
  const then = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} ${hours === 1 ? "ساعة" : hours === 2 ? "ساعتين" : "ساعات"}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `قبل ${days} ${days === 1 ? "يوم" : days === 2 ? "يومين" : "أيام"}`;
  const months = Math.floor(days / 30);
  return `قبل ${months} ${months === 1 ? "شهر" : "أشهر"}`;
}

/* ── Status vocabulary (single source for badges across the console) ── */
export const STATUS_LABEL: Record<string, { label: string; tone: "brand" | "gold" | "success" | "muted" | "danger" }> = {
  draft: { label: "مسودة", tone: "muted" },
  published: { label: "منشور", tone: "success" },
  archived: { label: "مؤرشف", tone: "danger" },
  paid: { label: "مدفوع", tone: "success" },
  pending: { label: "معلق", tone: "gold" },
  failed: { label: "فاشل", tone: "danger" },
  refunded: { label: "مسترد", tone: "muted" },
  active: { label: "نشط", tone: "success" },
  expired: { label: "منتهي", tone: "muted" },
  cancelled: { label: "ملغي", tone: "danger" },
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status]?.label ?? status;
}

export function statusTone(status: string): "brand" | "gold" | "success" | "muted" | "danger" {
  return STATUS_LABEL[status]?.tone ?? "muted";
}

/* ── Audit-log action codes → professional Arabic labels ── */
const ACTION_LABELS: Record<string, string> = {
  "users.create": "إنشاء مستخدم",
  "users.edit_profile": "تعديل ملف مستخدم",
  "users.toggle_status": "تجميد / تفعيل حساب",
  "users.change_role": "تغيير رتبة مستخدم",
  "users.wallet_adjust": "تعديل رصيد محفظة",
  "courses.create": "إنشاء مقرر",
  "courses.update": "تحديث مقرر",
  "courses.update_status": "تغيير حالة نشر مقرر",
  "courses.delete": "حذف مقرر",
  "exams.create": "إنشاء امتحان",
  "exams.update": "تحديث امتحان",
  "exams.toggle_publish": "نشر / إخفاء امتحان",
  "exams.delete": "حذف امتحان",
  "questions.create": "إضافة سؤال للبنك",
  "questions.delete": "حذف سؤال من البنك",
  "coupons.batch_create": "توليد دفعة أكواد",
  "coupons.toggle": "تفعيل / تعطيل كود",
  "coupons.delete": "حذف كود",
  "billing.manual_enroll": "تفعيل اشتراك يدوي",
  "orders.create": "عملية شراء جديدة",
  "stages.create": "إضافة مرحلة دراسية",
  "stages.update": "تعديل مرحلة دراسية",
  "stages.delete": "حذف مرحلة دراسية",
  "communications.broadcast_notification": "إرسال تنبيه جماعي",
  "community.delete_post": "حذف منشور مجتمع",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/* ── KPI stat card ── */
export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  hintTone = "muted",
  iconTone = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  hintTone?: "muted" | "success" | "brand" | "gold";
  iconTone?: "brand" | "gold" | "success";
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl",
          iconTone === "brand" && "bg-brand/10 text-brand",
          iconTone === "gold" && "bg-gold/10 text-gold",
          iconTone === "success" && "bg-success/10 text-success"
        )}
      >
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-tag text-muted">{label}</p>
        <p className="mt-0.5 font-mono text-2xl font-black tabular-nums tracking-normal text-ink">{value}</p>
        {hint ? (
          <span
            className={cn(
              "mt-0.5 block text-xs font-semibold",
              hintTone === "muted" && "text-muted",
              hintTone === "success" && "text-success",
              hintTone === "brand" && "text-brand",
              hintTone === "gold" && "text-gold"
            )}
          >
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ── Section header with icon, title, hint and actions slot ── */
export function SectionHeader({
  icon: Icon,
  title,
  hint,
  actions,
  count,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  actions?: ReactNode;
  count?: number;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="inline-flex items-center gap-2 font-brand text-base font-bold text-ink">
          <Icon size={18} className="shrink-0 text-brand" />
          {title}
          {typeof count === "number" ? <span className="tabular-nums text-muted">({count})</span> : null}
        </h3>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
