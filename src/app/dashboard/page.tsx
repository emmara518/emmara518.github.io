import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getStudentDashboard } from "@/lib/services/dashboard.service";
import {
  ExamsCard,
  MyLearningList,
  NextActionCard,
  NextBestActionChip,
  ProgressStrip,
} from "@/components/dashboard-widgets";
import { ActivityCard } from "@/components/activity-card";
import { WalletCard } from "@/components/wallet-card";
import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { LogoMark } from "@/components/logo";
import { InvoiceTable, type InvoiceRow } from "@/components/invoice-table";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "لوحة الطالب" };

export default async function StudentDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (isAdminRole(user.role)) redirect("/admin");

  const data = await getStudentDashboard(user);
  const firstName = user.name.trim().split(/\s+/)[0];

  // Progress of the course the next action points at (for the % chip).
  const nextAction = data.nextAction;
  const nextActionPct =
    nextAction?.kind === "lesson"
      ? (() => {
          const e = data.enrollments.find((x) => x.slug === nextAction.courseSlug);
          if (!e || e.progress.total === 0) return undefined;
          return Math.round((e.progress.completed / e.progress.total) * 100);
        })()
      : undefined;

  // Map the raw invoice rows to the shared InvoiceRow shape.
  const invoiceRows: InvoiceRow[] = data.invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    courseTitle: inv.courseTitle,
    status: inv.status as InvoiceRow["status"],
    totalCents: inv.totalCents,
    issuedAt: inv.issuedAt,
  }));

  return (
    <div className="space-y-7 pb-12">
      {/* Greeting — student is the center */}
      <PageHeader
        title={`أهلاً، ${firstName}`}
        backHref=""
        actions={
          <>
            <NextBestActionChip action={data.nextAction} />
            <LogoMark size={28} />
          </>
        }
      />

      {/* 1. NEXT ACTION */}
      <NextActionCard action={data.nextAction} progressPct={nextActionPct} />

      {/* 2. MY LEARNING */}
      <MyLearningList enrollments={data.enrollments.slice(0, 4)} viewAll />

      {/* 3. MY PROGRESS */}
      <ProgressStrip stats={data.stats} />

      {/* 4 + 5. EXAMS / ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <ExamsCard exams={data.upcomingExams} />
        <ActivityCard items={data.recentActivity} />
      </div>

      {/* Secondary tools */}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="min-w-0">
          <WalletCard balanceCents={data.wallet.balanceCents} transactions={data.wallet.transactions} />
        </div>

        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-ink">فواتيري</h2>
            <Link href="/dashboard/invoices" className="text-xs font-bold text-brand hover:underline">
              عرض الكل ←
            </Link>
          </div>
          <InvoiceTable
            invoices={invoiceRows.slice(0, 4)}
            compact
            empty={
              <EmptyState
                compact
                icon={<FileText size={16} />}
                title="لا توجد فواتير بعد."
                hint="ستظهر هنا فواتير اشتراكاتك في الكورسات."
              />
            }
          />
        </section>
      </div>
    </div>
  );
}
