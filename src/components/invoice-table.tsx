import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDate, formatEGP } from "@/lib/format";

export type InvoiceRow = {
  id: string;
  number: string;
  courseTitle: string;
  status: "paid" | "pending" | "failed" | "refunded";
  totalCents: number;
  issuedAt: Date | string;
};

const STATUS_TONE: Record<InvoiceRow["status"], "success" | "muted" | "danger" | "outline"> = {
  paid: "success",
  pending: "muted",
  failed: "danger",
  refunded: "outline",
};
const STATUS_LABEL: Record<InvoiceRow["status"], string> = {
  paid: "مدفوعة",
  pending: "قيد المراجعة",
  failed: "فشلت",
  refunded: "مستردة",
};

/**
 * Shared invoice table for the student workspace.
 * `compact` renders a thead-less list-of-rows preview used on the home dashboard.
 */
export function InvoiceTable({
  invoices,
  empty,
  compact = false,
}: {
  invoices: InvoiceRow[];
  empty?: React.ReactNode;
  compact?: boolean;
}) {
  if (invoices.length === 0) return <>{empty}</>;
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-line bg-surface",
        compact && "border-0",
      )}
    >
      <table className={cn("w-full text-start", compact ? "min-w-0" : "min-w-[520px]")}>
        {!compact && (
          <thead className="border-b border-line bg-surface2/60 text-muted">
            <tr>
              <th className="px-3.5 py-2.5 text-start text-[11px] font-bold">رقم الفاتورة</th>
              <th className="px-3.5 py-2.5 text-start text-[11px] font-bold">الكورس</th>
              <th className="px-3.5 py-2.5 text-start text-[11px] font-bold">الحالة</th>
              <th className="px-3.5 py-2.5 text-start text-[11px] font-bold">التاريخ</th>
              <th className="px-3.5 py-2.5 text-end text-[11px] font-bold">الإجمالي</th>
            </tr>
          </thead>
        )}
        <tbody className={cn(compact ? "divide-y divide-line" : "divide-y divide-line")}>
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-surface2/40">
              <td className="p-3.5 font-mono text-xs font-bold text-brand" dir="ltr">
                {inv.number}
              </td>
              <td className="p-3.5 text-xs font-semibold text-ink">{inv.courseTitle}</td>
              <td className="p-3.5">
                <Badge tone={STATUS_TONE[inv.status]}>{STATUS_LABEL[inv.status]}</Badge>
              </td>
              <td className="p-3.5 text-[11px] text-muted">{formatDate(inv.issuedAt)}</td>
              <td className="p-3.5 text-end font-mono text-xs font-black text-ink">
                {formatEGP(inv.totalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
