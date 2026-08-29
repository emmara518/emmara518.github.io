import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, GraduationCap } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { listMyEnrollments } from "@/lib/services/dashboard.service";
import { listMyAttempts } from "@/lib/services/exams.service";
import { PageHeader } from "@/components/page-header";
import { Progress, Badge, Card, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "تقدمي" };

export default async function ProgressPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/progress");
  if (isAdminRole(user.role)) redirect("/admin");

  const [enrollments, attempts] = await Promise.all([listMyEnrollments(user), listMyAttempts(user.id)]);

  const totals = enrollments.reduce(
    (acc, e) => ({ total: acc.total + e.progress.total, completed: acc.completed + e.progress.completed }),
    { total: 0, completed: 0 },
  );
  const avg = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0;
  const bestPct = attempts.length
    ? Math.max(...attempts.map((a) => Math.round((a.score / Math.max(a.totalMarks, 1)) * 100)))
    : null;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="تقدمي" subtitle="ملخص تقدمك الحقيقي عبر كورساتك واختباراتك" />

      {/* stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 [&>*]:min-w-0">
        {[
          { label: "متوسط التقدم", value: `${avg}%` },
          { label: "دروس مكتملة", value: totals.completed },
          { label: "كورسات نشطة", value: enrollments.length },
          ...(attempts.length > 0
            ? [
                { label: "اختبارات مُختبرة", value: attempts.length },
                ...(bestPct !== null ? [{ label: "أفضل نتيجة", value: `${bestPct}%` }] : []),
              ]
            : []),
        ].map((c) => (
          <Card key={c.label} className="px-4 py-3.5">
            <span className="block font-mono text-xl font-black text-ink">{c.value}</span>
            <span className="mt-0.5 block text-[11px] font-bold text-muted">{c.label}</span>
          </Card>
        ))}
      </div>

      {/* per-course progress */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-ink">تقدم الكورسات</h2>
        {enrollments.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={22} />}
            title="لا توجد كورسات نشطة بعد."
            hint="اشترك في كورس لبدء تتبع تقدمك."
            action={
              <Link href="/courses" className="rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white">
                تصفح الكورسات
              </Link>
            }
          />
        ) : (
          <Card className="divide-y divide-line">
            {enrollments.map((e) => {
              const pct = e.progress.total > 0 ? Math.round((e.progress.completed / e.progress.total) * 100) : 0;
              return (
                <div key={e.id} className="space-y-2 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/dashboard/courses/${e.slug}`}
                      className="truncate text-xs font-extrabold text-ink hover:text-brand"
                    >
                      {e.title}
                    </Link>
                    <span className="shrink-0 font-mono text-xs font-black text-brand">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                  <p className="font-mono text-[10px] text-muted">
                    {e.progress.completed}/{e.progress.total} فيديو
                  </p>
                </div>
              );
            })}
          </Card>
        )}
      </section>

      {/* exam results */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-ink">نتائج الاختبارات</h2>
          <Link href="/dashboard/exams" className="text-xs font-bold text-brand hover:underline">
            اختباراتي ←
          </Link>
        </div>
        {attempts.length === 0 ? (
          <EmptyState icon={<ClipboardList size={20} />} title="لم تخض أي اختبار بعد." />
        ) : (
          <Card className="divide-y divide-line">
            {attempts.map((a) => {
              const ratio = a.score / Math.max(a.totalMarks, 1);
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-ink">{a.examTitle}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">{formatDateTime(a.submittedAt)}</p>
                  </div>
                  <Badge tone={ratio >= 0.6 ? "success" : "danger"}>
                    {a.score}/{a.totalMarks}
                  </Badge>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
