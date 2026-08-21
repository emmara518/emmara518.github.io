"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CircleCheckBig as CheckCircle2, CreditCard, LoaderCircle as Loader2, Ticket } from "lucide-react";
import { Button, Input, buttonStyles } from "./ui";
import { formatEGP } from "@/lib/format";
import { cn } from "@/lib/utils";

export function EnrollPanel({
  slug,
  priceCents,
  owned,
  loggedIn,
}: {
  slug: string;
  priceCents: number;
  owned: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (owned) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-bold text-success">
          <CheckCircle2 size={17} />
          أنت مشترك في هذا الكورس
        </div>
        <Link href={`/dashboard/courses/${slug}`} className={cn(buttonStyles("primary", "lg"), "w-full")}>
          متابعة التعلم
        </Link>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="space-y-3">
        <Link href={`/login?next=/courses/${slug}`} className={cn(buttonStyles("primary", "lg"), "w-full")}>
          سجّل الدخول للاشتراك
        </Link>
        <p className="text-center text-xs text-muted">الدفع من رصيد المحفظة — كوبون الخصم DROS25 يمنحك 25%</p>
      </div>
    );
  }

  async function enroll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/courses/${slug}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: coupon.trim() }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر إتمام الاشتراك");
        if (json.error?.code === "INSUFFICIENT_FUNDS") {
          router.push("/dashboard");
        }
        return;
      }
      router.push(`/dashboard/courses/${slug}?welcome=1`);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Ticket size={15} className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          placeholder="كوبون الخصم (اختياري)"
          className="pe-10 font-mono uppercase"
          dir="ltr"
        />
      </div>
      <Button onClick={enroll} disabled={loading} size="lg" className="w-full">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
        {loading ? "جارٍ تفعيل الاشتراك…" : `اشترك الآن · ${formatEGP(priceCents)}`}
      </Button>
      {error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-center text-xs font-semibold leading-6 text-danger">
          {error}
        </p>
      ) : null}
      <p className="text-center text-xs leading-6 text-muted">
        خصم فوري من رصيد محفظتك · فاتورة إلكترونية تلقائية · جرّب كود DROS25
      </p>
    </div>
  );
}
