import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpen, ClipboardList, GraduationCap, Printer } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getChildProgress } from "@/lib/services/parent.service";
import { Badge, Card, EmptyState, Progress, buttonStyles } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "نتائج الابن — بوابة ولي الأمر" };

function attemptTone(percent: number): "success" | "gold" | "danger" {
  if (percent >= 85) return "success";
  if (percent >= 50) return "gold";
  return "danger";
}

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=/parent/children/${id}`);
  const isAdmin = isAdminRole(user.role);
  if (user.role !== "parent" && !isAdmin) redirect("/dashboard");

  let data;
  try {
    data = await getChildProgress(user.id, id);
  } catch {
    notFound();
  }

  const percents = data.recentAttempts
    .filter((a) => a.totalMarks > 0)
    .map((a) => Math.round((a.score / a.totalMarks) * 100));
  const avgPercent = percents.length
    ? Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.child.name}
        subtitle={
          data.child.gradeName ? `${data.child.gradeName} · نتائج الاختبارات وتقدّم الكورسات` : "نتائج الاختبارات وتقدّم الكورسات"
        }
        actions={
          <>
            <Link
              href={`/parent/children/${id}/report`}
              className={buttonStyles("outline", "sm")}
            >
              <Printer size={14} />
              تحميل التقرير
            </Link>
            <Badge tone={avgPercent === null ? "muted" : attemptTone(avgPercent)}>
              {avgPercent !== null ? `المعدل العام ${avgPercent}%` : "لا نتائج مسجلة بعد"}
            </Badge>
          </>
        }
        backHref="/parent"
        backLabel="أبنائي"
      />

      {/* Enrolled courses progress */}
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 text-base font-black text-ink">
          <span className="type-rule" aria-hidden />
          <BookOpen size={16} className="text-brand" />
          الكورسات المشترك بها
        </h2>
        {data.enrollments.length === 0 ? (
          <EmptyState icon={<BookOpen size={22} />} title="لا كورسات نشطة حاليًا." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.enrollments.map((e) => (
              <Card key={e.courseId} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-base font-extrabold text-ink">{e.title}</p>
                    <p className="text-xs font-semibold text-muted">{e.gradeName}</p>
                  </div>
                  <span className="shrink-0 font-mono text-base font-black text-brand">{e.progressPercent}%</span>
                </div>
                <Progress value={e.progressPercent} />
                <p className="text-xs font-semibold text-muted">
                  أكمل {e.videosCompleted} من {e.videosTotal} فيديو
                </p>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {/* Exam results */}
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 text-base font-black text-ink">
          <span className="type-rule" aria-hidden />
          <ClipboardList size={16} className="text-brand" />
          نتائج الاختبارات
        </h2>
        {data.recentAttempts.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={22} />}
            title="لم يحل أي اختبار حتى الآن."
            hint="ستظهر النتائج هنا تلقائيًا بعد أن يقدّم ابنك أي اختبار."
          />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-line bg-surface2/60 text-xs font-bold text-muted">
                  <th className="px-4 py-3 text-start">الاختبار</th>
                  <th className="px-4 py-3 text-start hidden md:table-cell">الكورس</th>
                  <th className="px-4 py-3 text-start">الدرجة</th>
                  <th className="px-4 py-3 text-start">النسبة</th>
                  <th className="px-4 py-3 text-start hidden sm:table-cell">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAttempts.map((a, i) => {
                  const percent = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
                  return (
                    <tr key={`${a.examTitle}-${i}`} className="border-b border-line/60 last:border-0">
                      <td className="max-w-56 truncate px-4 py-3.5 font-bold text-ink">{a.examTitle}</td>
                      <td className="max-w-48 truncate px-4 py-3.5 text-sm font-semibold text-muted hidden md:table-cell">
                        {a.courseTitle}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-bold text-ink">
                        {a.score}/{a.totalMarks}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={attemptTone(percent)}>{percent}%</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-muted hidden sm:table-cell">
                        {formatDateTime(a.submittedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
