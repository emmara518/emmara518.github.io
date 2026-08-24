import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getStudentDashboard } from "@/lib/services/dashboard.service";
import {
  DashboardHeroBanner,
  CurrentMissionWidget,
  MasteryGaugeWidget,
  QuickMathTipWidget,
  UpcomingExamWidget,
  PlatformMetricsRow,
} from "@/components/dashboard-widgets";
import { AcademicMapRoadmap } from "@/components/academic-map";
import { WalletCard } from "@/components/wallet-card";
import { BookOpen, ClipboardList, Receipt, Bell } from "lucide-react";
import { Badge, Card, EmptyState, Progress, buttonStyles } from "@/components/ui";
import { formatDate, formatDateTime, formatEGP, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "لوحة الطالب — DROS MATH UNIVERSE" };

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (isAdminRole(user.role)) redirect("/admin");

  const { welcome } = await searchParams;
  const data = await getStudentDashboard(user);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner featuring Mr. Mohamed Saeed */}
      <DashboardHeroBanner user={user} />

      {/* Academic Stages Roadmap (01-05) */}
      <AcademicMapRoadmap />

      {/* Dashboard Main Grid Layout (Matching Mockup 1 & 2) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1 & 2: Current Mission, Mastery, Enrolled Courses */}
        <div className="lg:col-span-2 space-y-6">
          <CurrentMissionWidget />

          <div className="grid gap-6 sm:grid-cols-2">
            <MasteryGaugeWidget />
            <UpcomingExamWidget />
          </div>

          {/* Enrolled Courses Section */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-ink">كورساتي ومقرراتي الحالية</h2>
              <Link href="/courses" className="text-xs font-bold text-neon-lime hover:underline">
                + اشترك في كورس جديد
              </Link>
            </div>

            {data.enrollments.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={22} />}
                title="لم تشترك في أي كورس بعد"
                hint="تصفح كورسات مستر محمد سعيد وابدأ الحصص المجانية من محفظتك مباشرة."
                action={
                  <Link href="/courses" className={buttonStyles("primary", "sm")}>
                    تصفح الكورسات
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.enrollments.map((e) => {
                  const pct = e.progress.total > 0 ? Math.round((e.progress.completed / e.progress.total) * 100) : 0;
                  return (
                    <Card key={e.id} hover className="p-5 space-y-3 rounded-3xl border-line">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-extrabold text-sm text-ink">{e.title}</p>
                          <div className="flex gap-2 mt-1.5">
                            <Badge tone="brand">{e.subjectName}</Badge>
                            <Badge tone="muted">{e.gradeName}</Badge>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-black text-neon-lime">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2 rounded-full bg-surface2" />
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-[11px] text-muted">
                          {e.progress.completed} / {e.progress.total} فيديو
                        </span>
                        <Link
                          href={`/dashboard/courses/${e.slug}`}
                          className="text-xs font-bold text-neon-lime hover:underline"
                        >
                          متابعة التعلم ←
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Invoices Table */}
          <section className="space-y-4 pt-2">
            <h2 className="inline-flex items-center gap-2 text-lg font-black text-ink">
              <Receipt size={18} className="text-neon-lime" /> فواتيري واشتراكاتي
            </h2>
            <Card className="overflow-x-auto rounded-3xl border-line">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-line text-start text-xs text-muted">
                    <th className="p-4 text-start font-bold">رقم الفاتورة</th>
                    <th className="p-4 text-start font-bold">الكورس</th>
                    <th className="p-4 text-start font-bold">التاريخ</th>
                    <th className="p-4 text-start font-bold">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-5 text-center text-muted font-semibold">
                        لا توجد فواتير بعد.
                      </td>
                    </tr>
                  ) : (
                    data.invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-line/60 last:border-0 hover:bg-surface2/40">
                        <td className="p-4 font-mono text-xs font-bold text-neon-lime" dir="ltr">
                          {inv.number}
                        </td>
                        <td className="p-4 font-bold">{inv.courseTitle}</td>
                        <td className="p-4 text-muted">{formatDate(inv.issuedAt)}</td>
                        <td className="p-4 font-mono font-black">{formatEGP(inv.totalCents)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </section>
        </div>

        {/* Column 3: Sidebar Widgets (Wallet, Quick Tip, Notifications, Exams) */}
        <div className="space-y-6">
          <WalletCard balanceCents={data.wallet.balanceCents} />

          <QuickMathTipWidget />

          {/* Notifications Card */}
          <Card className="space-y-4 p-6 rounded-3xl border-line">
            <h2 className="inline-flex items-center gap-2 text-base font-black text-ink">
              <Bell size={16} className="text-amber-500" /> الإشعارات الأخيرة
            </h2>
            <ul className="space-y-3">
              {data.notifications.length === 0 ? (
                <li className="text-xs font-semibold text-muted">لا إشعارات حتى الآن.</li>
              ) : (
                data.notifications.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-surface2/60 p-3.5 border border-line/40">
                    <p className="text-xs font-extrabold text-ink">{n.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{n.body}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted/70">{timeAgo(n.createdAt)}</p>
                  </li>
                ))
              )}
            </ul>
          </Card>

          {/* Recent Quiz Results Card */}
          <Card className="space-y-3 p-6 rounded-3xl border-line">
            <h2 className="text-base font-black text-ink">نتائج الاختبارات الأخيرة</h2>
            {data.attempts.length === 0 ? (
              <p className="text-xs font-semibold text-muted">لم تخض أي اختبار بعد.</p>
            ) : (
              data.attempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-2xl bg-surface2/60 px-4 py-3 border border-line/40">
                  <div>
                    <p className="text-xs font-bold text-ink">{a.examTitle}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">{formatDateTime(a.submittedAt)}</p>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-sm font-black",
                      a.score / Math.max(a.totalMarks, 1) >= 0.6 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {a.score}/{a.totalMarks}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <PlatformMetricsRow />
    </div>
  );
}
