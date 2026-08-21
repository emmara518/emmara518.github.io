"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle as Loader2, Plus, Wallet } from "lucide-react";
import { Button, Card } from "./ui";
import { formatEGP } from "@/lib/format";

export function WalletCard({ balanceCents }: { balanceCents: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function topUp(amountEgp: number) {
    setLoading(amountEgp);
    setError(null);
    try {
      const res = await fetch("/api/v1/me/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountEgp }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر الشحن");
        return;
      }
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card ticks className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-base font-extrabold">
          <Wallet size={16} className="text-gold" /> محفظتي
        </h2>
        <span className="rounded-full bg-[var(--gold-soft)] px-2.5 py-1 font-mono text-[10px] font-bold text-gold">
          DEMO·WALLET
        </span>
      </div>
      <p className="font-mono text-3xl font-extrabold">{formatEGP(balanceCents)}</p>
      <div className="grid grid-cols-3 gap-2">
        {[100, 250, 500].map((amount) => (
          <Button
            key={amount}
            variant="surface"
            size="sm"
            disabled={loading !== null}
            onClick={() => topUp(amount)}
          >
            {loading === amount ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {amount} ج
          </Button>
        ))}
      </div>
      {error ? <p className="text-xs font-semibold text-danger">{error}</p> : null}
      <p className="text-[11px] leading-5 text-muted">
        شحن تجريبي فوري لاختبار الشراء — تُستبدل لاحقًا ببوابة دفع حقيقية عبر نفس الحد البرمجي.
      </p>
    </Card>
  );
}
