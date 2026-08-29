"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { UserPreferences } from "@/lib/services/preferences.service";

type NotifKey = "community" | "examResults" | "wallet" | "marketing";

const ROWS: { key: NotifKey; title: string; hint: string }[] = [
  {
    key: "community",
    title: "ردود المجتمع",
    hint: "إشعار عند الرد على منشور لك أو الإشارة إليك في المجتمع.",
  },
  {
    key: "examResults",
    title: "نتائج الاختبارات",
    hint: "إشعار فور ظهور نتيجة اختبار أو امتحان.",
  },
  {
    key: "wallet",
    title: "نشاط المحفظة",
    hint: "إشعار لكل عملية شحن أو شراء أو استرداد على محفظتك.",
  },
  {
    key: "marketing",
    title: "العروض والكوبونات",
    hint: "إشعار بالعروض الموسمية والكوبونات الجديدة.",
  },
];

/**
 * Notifications preferences. Each toggle fires a PUT to /api/v1/me/preferences
 * with the partial payload; the server merges and persists. We track per-row
 * busy state for granular spinners.
 */
export function SettingsNotificationsForm({ initial }: { initial: UserPreferences }) {
  const [state, setState] = useState(initial.notifications);
  const [busy, setBusy] = useState<NotifKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  // Sync prop → local state when the server-side preferences change.
  // (Re-accepting server truth is the safe behaviour here — local optimistic
  // toggles are short-lived and re-fetched on every router.refresh.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(initial.notifications);
  }, [initial.notifications]);

  async function toggle(key: NotifKey, value: boolean) {
    setError(null);
    setBusy(key);
    setState((prev) => ({ ...prev, [key]: value }));
    try {
      const res = await fetch("/api/v1/me/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notifications: { [key]: value } }),
      });
      const json = await res.json();
      if (!json.ok) {
        setState((prev) => ({ ...prev, [key]: !value }));
        setError(json.error?.message ?? "تعذر الحفظ");
        return;
      }
      setSavedCount((n) => n + 1);
    } catch {
      setState((prev) => ({ ...prev, [key]: !value }));
      setError("مشكلة في الاتصال");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="divide-y divide-line p-0">
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-bold text-ink">{row.title}</p>
            <p className="text-[11px] leading-5 text-muted">{row.hint}</p>
          </div>
          <Switch
            checked={state[row.key]}
            disabled={busy === row.key}
            onChange={(v) => void toggle(row.key, v)}
            label={state[row.key] ? "مفعّل" : "متوقف"}
          />
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[11px]">
        <span className="text-muted">
          {error ? (
            <span className="font-semibold text-danger">{error}</span>
          ) : savedCount > 0 ? (
            <span className="font-semibold text-success">تم الحفظ</span>
          ) : (
            <span>التغييرات تُحفظ تلقائيًا.</span>
          )}
        </span>
        {busy ? <Loader2 size={12} className="animate-spin text-muted" /> : null}
      </div>
    </Card>
  );
}

function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line transition-colors",
        checked ? "bg-brand" : "bg-surface2",
        disabled && "opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "-translate-x-1" : "-translate-x-6",
        )}
      />
    </button>
  );
}
