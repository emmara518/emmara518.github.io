"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/utils";
import type { UserPreferences } from "@/lib/services/preferences.service";

/**
 * Appearance settings — the existing ThemeToggle for light/dark plus a density
 * pill toggle. The density toggle writes `data-density="compact"` on <html>;
 * no CSS rules consume it yet, this is a forward-compatible hook for the
 * next token-driven compaction pass.
 */
export function SettingsAppearanceForm({ initial }: { initial: UserPreferences }) {
  const [density, setDensity] = useState<"comfortable" | "compact">(initial.density);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  // Sync prop → local state when the server-side preferences change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDensity(initial.density);
  }, [initial.density]);

  // Mirror the density attribute onto <html> on every change so the value
  // is reflected before the PUT round-trip resolves. Idempotent.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  async function persist(next: "comfortable" | "compact") {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/v1/me/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ density: next }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر الحفظ");
        return;
      }
      setSavedCount((n) => n + 1);
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="divide-y divide-line p-0">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-bold text-ink">المظهر</p>
          <p className="text-[11px] leading-5 text-muted">التبديل بين الوضع الفاتح والداكن.</p>
        </div>
        <ThemeToggle variant="pill" />
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-bold text-ink">الكثافة</p>
          <p className="text-[11px] leading-5 text-muted">مريحة افتراضيًا، مضغوطة لعرض محتوى أكثر.</p>
        </div>
        <DensityPill
          value={density}
          disabled={busy}
          onChange={(next) => {
            setDensity(next);
            void persist(next);
          }}
        />
      </div>

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

function DensityPill({
  value,
  disabled,
  onChange,
}: {
  value: "comfortable" | "compact";
  disabled?: boolean;
  onChange: (next: "comfortable" | "compact") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-0.5 text-[11px] font-bold">
      <button
        type="button"
        onClick={() => onChange("comfortable")}
        disabled={disabled}
        className={cn(
          "rounded-full px-3 py-1 transition-colors",
          value === "comfortable" ? "bg-brand text-white" : "text-muted hover:text-ink",
        )}
      >
        مريحة
      </button>
      <button
        type="button"
        onClick={() => onChange("compact")}
        disabled={disabled}
        className={cn(
          "rounded-full px-3 py-1 transition-colors",
          value === "compact" ? "bg-brand text-white" : "text-muted hover:text-ink",
        )}
      >
        مضغوطة
      </button>
    </div>
  );
}
