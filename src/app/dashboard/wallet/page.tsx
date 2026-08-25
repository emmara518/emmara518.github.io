import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getWalletSummary } from "@/lib/services/billing.service";
import { WalletOps } from "@/components/wallet-ops";
import { formatEGP } from "@/lib/format";

export const metadata: Metadata = { title: "المحفظة" };

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/wallet");
  if (isAdminRole(user.role)) redirect("/admin");

  const wallet = await getWalletSummary(user.id);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-black text-ink">المحفظة</h1>
          <p className="mt-0.5 font-mono text-sm font-bold text-brand">{formatEGP(wallet.balanceCents)}</p>
        </div>
        <Link href="/dashboard" className="text-xs font-bold text-brand hover:underline">
          ← لوحة الطالب
        </Link>
      </header>

      <WalletOps balanceCents={wallet.balanceCents} transactions={wallet.transactions} />
    </div>
  );
}
