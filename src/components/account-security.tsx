"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle as Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "./ui";

export function LogoutAllButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revokeAll() {
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
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" disabled={busy || disabled} onClick={revokeAll}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} className="-scale-x-100" />}
        تسجيل الخروج من باقي الأجهزة
      </Button>
      {done !== null && !error ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
          <ShieldCheck size={14} />
          {done > 0 ? `تم إنهاء ${done} جلسة أخرى` : "لا توجد جلسات أخرى"}
        </span>
      ) : null}
      {error ? <span className="text-xs font-semibold text-danger">{error}</span> : null}
    </div>
  );
}
