import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getWalletSummary } from "@/lib/services/billing.service";
import { WalletOps } from "@/components/wallet-ops";
import { PageHeader } from "@/components/page-header";
import { formatEGP } from "@/lib/format";

export const metadata: Metadata = { title: "المحفظة" };

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/wallet");
  if (isAdminRole(user.role)) redirect("/admin");

  const wallet = await getWalletSummary(user.id);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="المحفظة"
        actions={
          <span className="font-mono text-sm font-bold text-brand">{formatEGP(wallet.balanceCents)}</span>
        }
      />

      <WalletOps balanceCents={wallet.balanceCents} transactions={wallet.transactions} />
    </div>
  );
}
