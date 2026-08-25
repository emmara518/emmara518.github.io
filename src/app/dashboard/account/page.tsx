import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge, Card, buttonStyles } from "@/components/ui";
import { LogoutAllButton } from "@/components/account-security";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";
import { getAccountOverview } from "@/lib/services/account.service";
import { listInvoices } from "@/lib/services/billing.service";
import { formatDate, formatDateTime, formatEGP } from "@/lib/format";

export const metadata: Metadata = { title: "حسابي" };

const SUB_STATUS_LABEL: Record<string, { label: string; tone: "success" | "danger" | "muted" }> = {
  active: { label: "نشط", tone: "success" },
  expired: { label: "منتهي", tone: "muted" },
  cancelled: { label: "ملغي", tone: "danger" },
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/account");

  const store = await cookies();
  const [data, invoiceRows] = await Promise.all([
    getAccountOverview(user.id, store.get(SESSION_COOKIE)?.value ?? null),
    listInvoices(user.id, 24),
  ]);

  if (!data.profile) redirect("/login");

  const p = data.profile;

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-black text-ink">حسابي</h1>
        <Link href="/dashboard" className="text-xs font-bold text-brand hover:underline">
          ← لوحة الطالب
        </Link>
      </header>

      {/* Profile */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-4">
          {p.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatarUrl} alt="" className="size-14 rounded-full object-cover ring-1 ring-line" />
          ) : (
            <span className="grid size-14 place-items-center rounded-full bg-surface2 text-lg font-bold text-muted ring-1 ring-line">
              {p.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
            </span>
          )}
          <div className="min-w-0 space-y-0.5">
            <p className="text-base font-black text-ink">{p.name}</p>
            <p className="font-mono text-xs text-muted" dir="ltr">
              {p.email}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {p.phone ? (
                <Badge tone="muted">
                  <span dir="ltr">{p.phone}</span>
                </Badge>
              ) : null}
              {p.gradeName ? <Badge tone="brand">{p.gradeName}</Badge> : null}
              <Badge tone="outline">عضو منذ {formatDate(p.createdAt)}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        {/* Security / sessions */}
        <section className="space-y-3">
          <h2 className="text-sm font-black text-ink">الأجهزة والجلسات</h2>
          <Card className="space-y-4 p-5">
            <ul className="divide-y divide-line">
              {data.sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">
                      جلسة {formatDateTime(s.createdAt)}
                      {s.isCurrent ? " — الجهاز الحالي" : ""}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">
                      تنتهي: {formatDateTime(s.expiresAt)}
                    </p>
                  </div>
                  {s.isCurrent ? <Badge tone="success">نشطة</Badge> : <Badge tone="muted">أخرى</Badge>}
                </li>
              ))}
            </ul>
            <LogoutAllButton disabled={data.sessions.length <= 1} />
            <p className="text-[11px] leading-5 text-muted">
              إنهاء بقية الجلسات يُسجل خروجك من جميع الأجهزة الأخرى ويحتفظ بجلستك الحالية.
            </p>
          </Card>
        </section>

        {/* Subscriptions */}
        <section className="space-y-3">
          <h2 className="text-sm font-black text-ink">اشتراكاتي</h2>
          <Card className="divide-y divide-line">
            {data.subscriptions.length === 0 ? (
              <div className="space-y-3 px-4 py-6 text-center">
                <p className="text-xs font-semibold text-muted">لا توجد اشتراكات بعد.</p>
                <Link href="/courses" className={buttonStyles("primary", "sm")}>
                  تصفح الكورسات
                </Link>
              </div>
            ) : (
              data.subscriptions.map((s) => {
                const st = SUB_STATUS_LABEL[s.status] ?? SUB_STATUS_LABEL.expired;
                return (
                  <div key={s.id} className="space-y-1 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/dashboard/courses/${s.courseSlug}`}
                        className="truncate text-xs font-extrabold text-ink hover:text-brand"
                      >
                        {s.courseTitle}
                      </Link>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <p className="font-mono text-[10px] text-muted">
                      بدأ: {formatDate(s.startsAt)}
                      {s.endsAt ? ` · ينتهي: ${formatDate(s.endsAt)}` : ""}
                    </p>
                  </div>
                );
              })
            )}
          </Card>
        </section>
      </div>

      {/* Invoices */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-ink">فواتيري</h2>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-start font-bold">رقم الفاتورة</th>
                <th className="p-3 text-start font-bold">الكورس</th>
                <th className="p-3 text-start font-bold">الحالة</th>
                <th className="p-3 text-start font-bold">التاريخ</th>
                <th className="p-3 text-start font-bold">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-xs font-semibold text-muted">
                    لا توجد فواتير بعد.
                  </td>
                </tr>
              ) : (
                invoiceRows.map((inv) => (
                  <tr key={inv.id} className="border-b border-line/60 last:border-0">
                    <td className="p-3 font-mono text-xs font-bold text-brand" dir="ltr">
                      {inv.number}
                    </td>
                    <td className="p-3 text-xs font-bold">{inv.courseTitle}</td>
                    <td className="p-3">
                      <Badge tone={inv.status === "paid" ? "success" : inv.status === "pending" ? "muted" : "danger"}>
                        {inv.status === "paid" ? "مدفوعة" : inv.status === "pending" ? "معلقة" : "فشلت"}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted">{formatDate(inv.issuedAt)}</td>
                    <td className="p-3 font-mono text-xs font-black">{formatEGP(inv.totalCents)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
