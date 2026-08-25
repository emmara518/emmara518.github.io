import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Play,
} from "lucide-react";
import type { NextAction, DashboardActivity } from "@/lib/services/dashboard.service";
import { Badge, Card, buttonStyles } from "@/components/ui";

/** Student workspace widgets — real data only, quiet visual language. */

type Enrollment = {
  id: string;
  slug: string;
  title: string;
  gradeName: string;
  subjectName: string;
  progress: { total: number; completed: number };
};

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

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
      <div
        className="h-full rounded-full bg-brand transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ── 1. NEXT ACTION ─────────────────────────────────────────────────────── */

export function NextActionCard({
  action,
  progressPct,
}: {
  action: NextAction | null;
  progressPct?: number;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
            ماذا أفعل الآن؟
          </p>
          {action?.kind === "lesson" ? (
            <>
              <h2 className="text-lg font-black text-ink">كمل درسك</h2>
              <p className="truncate text-xs font-semibold text-muted">
                {action.courseTitle} — {action.lessonTitle}
              </p>
              <div className="flex items-center gap-2 pt-1.5">
                {action.videoTitle && action.videoTitle !== action.lessonTitle ? (
                  <Badge tone="muted">{action.videoTitle}</Badge>
                ) : null}
                {typeof progressPct === "number" && (
                  <span className="font-mono text-[11px] font-bold text-brand">{progressPct}%</span>
                )}
              </div>
            </>
          ) : action?.kind === "exam" ? (
            <>
              <h2 className="text-lg font-black text-ink">ابدأ الاختبار</h2>
              <p className="truncate text-xs font-semibold text-muted">
                {action.courseTitle} — {action.examTitle}
              </p>
              <div className="pt-1.5">
                <Badge tone="outline">اختبار متاح</Badge>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-black text-ink">ابدأ أول درس.</h2>
              <p className="text-xs font-semibold text-muted">اشترك في كورس وابدأ التعلم.</p>
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

function LearningCard({ e }: { e: Enrollment }) {
  const pct = e.progress.total > 0 ? Math.round((e.progress.completed / e.progress.total) * 100) : 0;
  return (
    <Card hover className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-ink">{e.title}</p>
          <div className="mt-1.5 flex gap-1.5">
            <Badge tone="brand">{e.subjectName}</Badge>
            <Badge tone="muted">{e.gradeName}</Badge>
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm font-black text-brand">{pct}%</span>
      </div>
      <ProgressBar value={pct} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold text-muted">
          {e.progress.completed}/{e.progress.total} فيديو
        </span>
        <Link
          href={`/dashboard/courses/${e.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          كمل
          <ArrowLeft size={13} />
        </Link>
      </div>
    </Card>
  );
}

export function MyLearningList({
  enrollments,
  viewAll,
}: {
  enrollments: Enrollment[];
  viewAll?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-ink">
          كورساتي{" "}
          {enrollments.length > 0 && (
            <span className="font-mono text-xs font-bold text-muted">({enrollments.length})</span>
          )}
        </h2>
        {viewAll && enrollments.length > 0 ? (
          <Link href="/dashboard/courses" className="text-xs font-bold text-brand hover:underline">
            عرض الكل ←
          </Link>
        ) : (
          <Link href="/courses" className="text-xs font-bold text-brand hover:underline">
            + كورس جديد
          </Link>
        )}
      </div>

      {enrollments.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-8 text-center" ticks>
          <BookOpen size={20} className="text-muted" />
          <p className="text-sm font-bold text-ink">لسه مفيش كورسات.</p>
          <Link href="/courses" className={buttonStyles("primary", "sm")}>
            تصفح الكورسات
          </Link>
        </Card>
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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-ink">تقدمي</h2>
        <Link href="/dashboard/progress" className="text-xs font-bold text-brand hover:underline">
          التفاصيل ←
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 [&>*]:min-w-0">
        {cells.map((c) => (
          <Card key={c.label} className="px-4 py-3.5">
            <span className="block font-mono text-xl font-black text-ink">{c.value}</span>
            <span className="mt-0.5 block text-[11px] font-bold text-muted">{c.label}</span>
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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-ink">اختباراتي</h2>
        {exams.length > 0 && (
          <Link href="/dashboard/exams" className="text-xs font-bold text-brand hover:underline">
            الكل ←
          </Link>
        )}
      </div>

      <Card className="divide-y divide-line">
        {exams.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs font-semibold text-muted">لا توجد اختبارات قريبة.</p>
        ) : (
          exams.slice(0, 3).map((exam) => {
            const attempted = exam.status !== null;
            return (
              <div key={exam.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-ink">{exam.title}</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-muted">
                    {exam.courseTitle}
                    <span className="mx-1.5 text-line-strong">·</span>
                    <Clock size={10} className="inline align-[-1px]" /> {exam.durationMin} د
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  {attempted ? (
                    <span className="font-mono text-[11px] font-bold text-success">
                      {exam.status!.bestScore}/{exam.status!.bestTotal}
                    </span>
                  ) : (
                    <Badge tone="outline">متاح</Badge>
                  )}
                  <Link
                    href={`/dashboard/exams/${exam.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
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

/* ── 5. RECENT ACTIVITY ─────────────────────────────────────────────────── */

const ACTIVITY_ICONS = {
  lesson: CheckCircle2,
  exam: ClipboardList,
  enrolled: BookOpen,
  notification: Bell,
} as const;

export function ActivityCard({ items }: { items: DashboardActivity[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-ink">آخر نشاط</h2>
        {items.length > 0 ? (
          <Link href="/dashboard/activity" className="text-xs font-bold text-brand hover:underline">
            عرض الكل ←
          </Link>
        ) : null}
      </div>
      <Card className="divide-y divide-line">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs font-semibold text-muted">لا يوجد نشاط بعد.</p>
        ) : (
          items.slice(0, 3).map((item) => {
            const Icon = ACTIVITY_ICONS[item.kind];
            return (
              <div key={`${item.kind}-${item.id}`} className="flex items-start gap-2.5 px-4 py-3">
                <Icon
                  size={14}
                  className={item.kind === "lesson" ? "mt-0.5 shrink-0 text-success" : "mt-0.5 shrink-0 text-muted"}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{item.title}</p>
                  {item.meta ? <p className="truncate text-[11px] text-muted">{item.meta}</p> : null}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </section>
  );
}

/* ── MENTOR IDENTITY (light) ────────────────────────────────────────────── */

export function MentorChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1">
      <Image
        src="/images/assets/teacher.webp"
        alt=""
        width={16}
        height={16}
        className="size-4 rounded-full object-cover object-top"
      />
      <span className="text-[11px] font-bold text-muted">مع مستر محمد سعيد</span>
    </span>
  );
}

export type { Enrollment as DashboardEnrollment, ExamItem as DashboardExam, Stats as DashboardStats };
