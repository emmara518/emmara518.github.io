import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getStudentDashboard } from "@/lib/services/dashboard.service";
import {
  ActivityCard,
  ExamsCard,
  MentorChip,
  MyLearningList,
  NextActionCard,
  ProgressStrip,
} from "@/components/dashboard-widgets";
import { WalletCard } from "@/components/wallet-card";
import { Card, buttonStyles } from "@/components/ui";
import { formatDate, formatEGP } from "@/lib/format";

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

  return (
    <div className="space-y-7 pb-12">
      {/* Greeting — student is the center */}
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-black text-ink">أهلاً، {firstName}</h1>
        </div>
        <MentorChip />
      </header>

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
          <Card className="divide-y divide-line">
            {data.invoices.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs font-semibold text-muted">لا توجد فواتير بعد.</p>
            ) : (
              data.invoices.slice(0, 4).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{inv.courseTitle}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted" dir="ltr">
                      {inv.number}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[11px] text-muted">{formatDate(inv.issuedAt)}</span>
                    <span className="font-mono text-xs font-black">{formatEGP(inv.totalCents)}</span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
