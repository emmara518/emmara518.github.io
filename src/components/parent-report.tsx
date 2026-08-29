import { BookOpen, ClipboardList, GraduationCap, Target, TrendingUp, Clock } from "lucide-react";
import { Badge, Card, EmptyState, Progress } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { formatDate, formatDateTime } from "@/lib/format";

type Enrollment = {
  courseId: string;
  title: string;
  slug: string;
  gradeName: string;
  startsAt: Date;
  videosTotal: number;
  videosCompleted: number;
  progressPercent: number;
};

type Attempt = {
  examTitle: string;
  courseTitle: string;
  score: number;
  totalMarks: number;
  submittedAt: Date;
};

type ReportData = {
  child: { id: string; name: string; email: string; gradeName: string | null };
  enrollments: Enrollment[];
  recentAttempts: Attempt[];
};

function attemptTone(percent: number): "success" | "gold" | "danger" {
  if (percent >= 85) return "success";
  if (percent >= 50) return "gold";
  return "danger";
}

export function ParentReport({
  data,
  parentName,
  generatedAt,
}: {
  data: ReportData;
  parentName: string;
  generatedAt: Date;
}) {
  const { child, enrollments, recentAttempts } = data;

  const validAttempts = recentAttempts.filter((a) => a.totalMarks > 0);
  const avgPercent = validAttempts.length
    ? Math.round(validAttempts.reduce((sum, a) => sum + Math.round((a.score / a.totalMarks) * 100), 0) / validAttempts.length)
    : null;

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length)
    : 0;

  const lastActivity =
    recentAttempts[0]?.submittedAt ??
    enrollments
      .map((e) => e.startsAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] ??
    null;

  return (
    <div className="print-area space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div className="space-y-1">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
            تقرير ولي الأمر
          </p>
          <h1 className="type-display text-3xl font-black text-ink">{child.name}</h1>
          <p className="text-base font-semibold text-muted">
            {child.gradeName ?? "بدون صف دراسي"} · {formatDate(generatedAt)}
          </p>
        </div>
        <div className="no-print">
          <PrintButton />
        </div>
      </header>

      {/* KPIs */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-black text-ink">
          <TrendingUp size={16} className="text-brand" />
          ملخّص التقدّم
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 [&>*]:min-w-0">
          <Card className="px-4 py-3.5 print:border-0 print:shadow-none print:bg-transparent">
            <span className="block font-mono text-3xl font-black text-ink">{enrollments.length}</span>
            <span className="mt-0.5 block text-xs font-bold text-muted">عدد الكورسات</span>
          </Card>
          <Card className="px-4 py-3.5 print:border-0 print:shadow-none print:bg-transparent">
            <span className="block font-mono text-3xl font-black text-ink">{avgProgress}%</span>
            <span className="mt-0.5 block text-xs font-bold text-muted">متوسط التقدم</span>
          </Card>
          <Card className="px-4 py-3.5 print:border-0 print:shadow-none print:bg-transparent">
            <span className="block font-mono text-3xl font-black text-ink">{recentAttempts.length}</span>
            <span className="mt-0.5 block text-xs font-bold text-muted">عدد الاختبارات المُختبرة</span>
          </Card>
          <Card className="px-4 py-3.5 print:border-0 print:shadow-none print:bg-transparent">
            <span className="block font-mono text-base font-extrabold text-ink">
              {lastActivity ? formatDate(lastActivity) : "—"}
            </span>
            <span className="mt-0.5 block text-xs font-bold text-muted">آخر نشاط</span>
          </Card>
        </div>
        {avgPercent !== null ? (
          <p className="text-xs font-semibold text-muted">
            المعدل العام في الاختبارات:{" "}
            <span className="font-mono font-extrabold text-ink">{avgPercent}%</span>
          </p>
        ) : null}
      </section>

      {/* Per-course completion */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-black text-ink">
          <BookOpen size={16} className="text-brand" />
          تقدّم الكورسات
        </h2>
        {enrollments.length === 0 ? (
          <EmptyState icon={<BookOpen size={22} />} title="لا كورسات نشطة حاليًا." />
        ) : (
          <Card className="overflow-hidden print:border-0 print:shadow-none print:bg-transparent">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-line bg-surface2/60 text-xs font-bold text-muted print:bg-transparent">
                  <th className="px-4 py-3 text-start">الكورس</th>
                  <th className="px-4 py-3 text-start">التقدّم</th>
                  <th className="px-4 py-3 text-start">آخر نشاط</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.courseId} className="border-b border-line/60 last:border-0">
                    <td className="max-w-56 px-4 py-3.5">
                      <p className="truncate font-bold text-ink">{e.title}</p>
                      <p className="mt-0.5 text-xs font-semibold text-muted">
                        أكمل {e.videosCompleted} من {e.videosTotal} فيديو
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Progress value={e.progressPercent} className="w-24" />
                        <span className="font-mono text-sm font-extrabold text-ink">
                          {e.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-muted">
                      {formatDate(e.startsAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Recent exam attempts */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-black text-ink">
          <ClipboardList size={16} className="text-brand" />
          آخر محاولات الاختبارات
        </h2>
        {recentAttempts.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={22} />}
            title="لم يحل أي اختبار حتى الآن."
            hint="ستظهر النتائج هنا تلقائيًا بعد أن يقدّم ابنك أي اختبار."
          />
        ) : (
          <Card className="overflow-hidden print:border-0 print:shadow-none print:bg-transparent">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-line bg-surface2/60 text-xs font-bold text-muted print:bg-transparent">
                  <th className="px-4 py-3 text-start">الاختبار</th>
                  <th className="px-4 py-3 text-start hidden md:table-cell">الكورس</th>
                  <th className="px-4 py-3 text-start">الدرجة</th>
                  <th className="px-4 py-3 text-start">النسبة</th>
                  <th className="px-4 py-3 text-start hidden sm:table-cell">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.slice(0, 5).map((a, i) => {
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
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-muted hidden sm:table-cell">
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

      {/* Weak topics — placeholder slot. v1 data doesn't include per-topic analytics
          yet; we surface a friendly empty state so the section reads honestly. */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-black text-ink">
          <Target size={16} className="text-brand" />
          نقاط الضعف
        </h2>
        <EmptyState
          icon={<Target size={22} />}
          title="لا توجد بيانات تحليل موضوعي بعد."
          hint="ستظهر هنا الموضوعات التي يحتاج فيها الطالب إلى دعم إضافي."
        />
      </section>

      {/* Footer */}
      <footer className="space-y-1 border-t border-line pt-4 text-xs font-semibold text-muted">
        <p>
          ولي الأمر: <span className="font-extrabold text-ink">{parentName}</span>
          <span className="mx-2 text-line-strong">·</span>
          الطالب: <span className="font-extrabold text-ink">{child.name}</span>
        </p>
        <p>
          <Clock size={11} className="inline align-[-1px]" /> تاريخ التقرير:{" "}
          <span className="font-mono text-ink">{formatDateTime(generatedAt)}</span>
        </p>
      </footer>
    </div>
  );
}
