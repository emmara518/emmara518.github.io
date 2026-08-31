import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Play, Sparkles } from "lucide-react";
import type { NextAction } from "@/lib/services/dashboard.service";
import { Badge, Card, EmptyState, buttonStyles } from "@/components/ui";
import { LearningCard, type LearningCardEnrollment } from "@/components/learning-card";

/** Student workspace widgets — real data only, quiet visual language. */

type ExamItem = {
  id: string;
  title: string;
  durationMin: number;
  courseTitle: string;
  status: { attemptsCount: number; bestScore: number; bestTotal: number } | null;
};

type Stats = {
  coursesCount: number;
  videosCompleted: number;
  avgProgress: number;
  examsCount: number;
};

export type { LearningCardEnrollment, ExamItem as DashboardExam, Stats as DashboardStats };

/* ── 0. NEXT BEST ACTION CHIP (header) ──────────────────────────────────── */

/** Compact "what to do next" pill for the greeting row. Hidden when there's
 *  no actionable next step. */
export function NextBestActionChip({ action }: { action: NextAction | null }) {
  if (!action) {
    return (
      <Link
        href="/courses"
        className="inline-flex max-w-full min-w-0 items-center gap-1.5 truncate rounded-full border border-line bg-surface px-3 py-1 text-xs font-extrabold text-ink hover:border-brand hover:text-brand"
      >
        <Sparkles size={12} className="shrink-0" />
        <span className="truncate">تصفّح الكورسات</span>
      </Link>
    );
  }
  const label =
    action.kind === "lesson"
      ? `الدرس التالي: ${action.courseTitle} — ${action.lessonTitle}`
      : `اختبار متاح: ${action.examTitle}`;
  return (
    <Link
      href={action.href}
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 truncate rounded-full border border-line bg-surface px-3 py-1 text-xs font-extrabold text-ink hover:border-brand hover:text-brand"
    >
      {action.kind === "lesson" ? (
        <Play size={12} fill="currentColor" className="shrink-0" />
      ) : (
        <Sparkles size={12} className="shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
}

/** Backwards-compat alias for the original MentorChip import. */
export const MentorChip = NextBestActionChip;

/* ── 1. NEXT ACTION ─────────────────────────────────────────────────────── */

export function NextActionCard({
  action,
  progressPct,
}: {
  action: NextAction | null;
  progressPct?: number;
}) {
  return (
    <Card className="type-corner-mark p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
            ماذا أفعل الآن؟
          </p>
          {action?.kind === "lesson" ? (
            <>
              <h2 className="type-card-heading text-2xl text-ink">كمل درسك</h2>
              <p className="truncate text-sm font-semibold text-muted">
                {action.courseTitle} — {action.lessonTitle}
              </p>
              <div className="flex items-center gap-2 pt-1.5">
                {action.videoTitle && action.videoTitle !== action.lessonTitle ? (
                  <Badge tone="muted">{action.videoTitle}</Badge>
                ) : null}
                {typeof progressPct === "number" && (
                  <span className="font-mono text-xs font-bold text-brand">{progressPct}%</span>
                )}
              </div>
            </>
          ) : action?.kind === "exam" ? (
            <>
              <h2 className="type-card-heading text-2xl text-ink">ابدأ الاختبار</h2>
              <p className="truncate text-sm font-semibold text-muted">
                {action.courseTitle} — {action.examTitle}
              </p>
              <div className="pt-1.5">
                <Badge tone="outline">اختبار متاح</Badge>
              </div>
            </>
          ) : (
            <>
              <h2 className="type-card-heading text-2xl text-ink">ابدأ أول درس.</h2>
              <p className="text-sm font-semibold text-muted">اشترك في كورس وابدأ التعلم.</p>
            </>
          )}
        </div>

        <div className="shrink-0">
          {action ? (
            <Link href={action.href} className={buttonStyles("primary", "md")}>
              <Play size={15} fill="currentColor" />
              متابعة
            </Link>
          ) : (
            <Link href="/courses" className={buttonStyles("primary", "md")}>
              تصفح الكورسات
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ── 2. MY LEARNING ─────────────────────────────────────────────────────── */

export function MyLearningList({
  enrollments,
  viewAll,
}: {
  enrollments: LearningCardEnrollment[];
  viewAll?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-section-heading">
          كورساتي{" "}
          {enrollments.length > 0 && (
            <span className="font-mono text-xs font-bold text-muted">({enrollments.length})</span>
          )}
        </h2>
        {viewAll && enrollments.length > 0 ? (
          <Link href="/dashboard/courses" className="text-sm font-bold text-brand hover:underline">
            عرض الكل ←
          </Link>
        ) : (
          <Link href="/courses" className="text-sm font-bold text-brand hover:underline">
            + كورس جديد
          </Link>
        )}
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={20} />}
          title="لسه مفيش كورسات."
          hint="ابدأ بتصفح الكورسات المتاحة واشترك في أي كورس."
          action={
            <Link href="/courses" className={buttonStyles("primary", "sm")}>
              تصفح الكورسات
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {enrollments.map((e) => (
            <LearningCard key={e.id} e={e} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── 3. MY PROGRESS ─────────────────────────────────────────────────────── */

export function ProgressStrip({ stats }: { stats: Stats }) {
  const cells = [
    { label: "متوسط التقدم", value: `${stats.avgProgress}%` },
    { label: "دروس مكتملة", value: stats.videosCompleted },
    { label: "كورسات نشطة", value: stats.coursesCount },
    ...(stats.examsCount > 0 ? [{ label: "اختبارات مُختبرة", value: stats.examsCount }] : []),
  ];

  if (stats.coursesCount === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-section-heading">تقدمي</h2>
        <Link href="/dashboard/progress" className="text-sm font-bold text-brand hover:underline">
          التفاصيل ←
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 [&>*]:min-w-0">
        {cells.map((c) => (
          <Card key={c.label} className="px-4 py-3.5">
            <span className="block type-stat-display text-2xl">{c.value}</span>
            <span className="mt-0.5 block text-xs font-bold uppercase tracking-tag text-muted">{c.label}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ── 4. MY EXAMS ────────────────────────────────────────────────────────── */

export function ExamsCard({ exams }: { exams: ExamItem[] }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-section-heading">اختباراتي</h2>
        {exams.length > 0 && (
          <Link href="/dashboard/exams" className="text-sm font-bold text-brand hover:underline">
            الكل ←
          </Link>
        )}
      </div>

      <Card className="divide-y divide-line">
        {exams.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm font-semibold text-muted">لا توجد اختبارات قريبة.</p>
        ) : (
          exams.slice(0, 3).map((exam) => {
            const attempted = exam.status !== null;
            return (
              <div key={exam.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-ink">{exam.title}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-muted">
                    {exam.courseTitle}
                    <span className="mx-1.5 text-line-strong">·</span>
                    <Clock size={10} className="inline align-[-1px]" /> {exam.durationMin} د
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  {attempted ? (
                    <span className="font-mono text-xs font-bold text-success">
                      {exam.status!.bestScore}/{exam.status!.bestTotal}
                    </span>
                  ) : (
                    <Badge tone="outline">متاح</Badge>
                  )}
                  <Link
                    href={`/dashboard/exams/${exam.id}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
                  >
                    {attempted ? "إعادة" : "ابدأ"}
                    <ArrowLeft size={12} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </section>
  );
}
