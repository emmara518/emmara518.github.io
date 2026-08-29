import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { Card } from "./ui";
import { formatEGP, timeAgo, TXN_KIND_LABELS } from "@/lib/format";

export type WalletTxnView = {
  id: string;
  amountCents: number;
  kind: string;
  note: string;
  createdAt: Date | string;
};

/** Compact dashboard balance card — all wallet operations live in /dashboard/wallet. */
export function WalletCard({
  balanceCents,
  transactions = [],
}: {
  balanceCents: number;
  transactions?: WalletTxnView[];
}) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-lg font-black text-ink">
          <Wallet size={16} className="text-brand" /> محفظتي
        </h2>
        <span className="rounded-full bg-neon-lime-soft px-3 py-1 font-mono text-xs font-bold text-brand">
          WALLET
        </span>
      </div>

      <div>
        <p className="text-xs font-bold text-muted">الرصيد المتاح</p>
        <p className="mt-0.5 font-mono text-4xl font-black">{formatEGP(balanceCents)}</p>
      </div>

      {transactions.length > 0 ? (
        <ul className="space-y-1 border-t border-line pt-3">
          {transactions.slice(0, 3).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-muted">
                {TXN_KIND_LABELS[t.kind] ?? t.kind} · {timeAgo(t.createdAt)}
              </span>
              <span className={`shrink-0 font-mono text-sm font-bold ${t.amountCents >= 0 ? "text-success" : "text-danger"}`}>
                {t.amountCents >= 0 ? "+" : "−"}
                {formatEGP(Math.abs(t.amountCents))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href="/dashboard/wallet"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
      >
        شحن الرصيد وإدارة المحفظة
        <ArrowLeft size={13} />
      </Link>
    </Card>
  );
}
