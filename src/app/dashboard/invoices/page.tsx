import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { listInvoices } from "@/lib/services/billing.service";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui";
import { formatDate, formatEGP } from "@/lib/format";

export const metadata: Metadata = { title: "فواتيري" };

export default async function InvoicesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/invoices");
  if (isAdminRole(user.role)) redirect("/admin");

  const invoices = await listInvoices(user.id, 50);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="فواتيري" subtitle={`${invoices.length} فاتورة`} />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="p-3.5 text-start font-bold">رقم الفاتورة</th>
              <th className="p-3.5 text-start font-bold">الكورس</th>
              <th className="p-3.5 text-start font-bold">الحالة</th>
              <th className="p-3.5 text-start font-bold">التاريخ</th>
              <th className="p-3.5 text-start font-bold">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-xs font-semibold text-muted">
                  لا توجد فواتير بعد.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-line/60 last:border-0">
                  <td className="p-3.5 font-mono text-xs font-bold text-brand" dir="ltr">
                    {inv.number}
                  </td>
                  <td className="p-3.5 text-xs font-bold">{inv.courseTitle}</td>
                  <td className="p-3.5">
                    <Badge tone={inv.status === "paid" ? "success" : inv.status === "pending" ? "muted" : "danger"}>
                      {inv.status === "paid" ? "مدفوعة" : inv.status === "pending" ? "معلقة" : "فشلت"}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-xs text-muted">{formatDate(inv.issuedAt)}</td>
                  <td className="p-3.5 font-mono text-xs font-black">{formatEGP(inv.totalCents)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
