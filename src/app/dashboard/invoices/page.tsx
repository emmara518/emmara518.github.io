import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { listInvoices } from "@/lib/services/billing.service";
import { PageHeader } from "@/components/page-header";
import { InvoiceTable, type InvoiceRow } from "@/components/invoice-table";

export const metadata: Metadata = { title: "فواتيري" };

export default async function InvoicesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/invoices");
  if (isAdminRole(user.role)) redirect("/admin");

  const invoices = await listInvoices(user.id, 50);

  // order status enum: paid | pending | failed | refunded
  const rows: InvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    courseTitle: inv.courseTitle,
    status: inv.status as InvoiceRow["status"],
    totalCents: inv.totalCents,
    issuedAt: inv.issuedAt,
  }));

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="فواتيري" subtitle={`${invoices.length} فاتورة`} />

      <InvoiceTable invoices={rows} />
    </div>
  );
}
