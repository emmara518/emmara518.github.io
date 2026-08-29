import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CircleCheckBig as CheckCircle2,
  CirclePlay as PlayCircle,
  ClipboardList,
  Clock,
  FileText,
  Lock,
  User,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { EnrollPanel } from "@/components/enroll-panel";
import { getSessionUser } from "@/lib/auth";
import { getCourseBySlug, getCourseCurriculum } from "@/lib/services/catalog.service";
import { hasActiveSubscription } from "@/lib/services/billing.service";
import { formatDuration, formatEGP } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return { title: course ? course.title : "كورس غير موجود" };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "published") notFound();

  const [curriculum, user] = await Promise.all([getCourseCurriculum(course.id), getSessionUser()]);
  const owned = user ? await hasActiveSubscription(user.id, course.id) : false;

  const totalSeconds = curriculum.lessons.reduce(
    (s, l) => s + l.videos.reduce((x, v) => x + v.durationSec, 0),
    0,
  );

  const getCoverImage = () => {
    const s = (course.slug || "").toLowerCase();
    const sub = (course.subjectName || "").toLowerCase();
    const t = (course.title || "").toLowerCase();

    if (s.includes("calculus") || sub.includes("تفاضل") || t.includes("تفاضل") || s.includes("diff")) {
      return "/images/courses/calculus.jpg";
    }
    if (s.includes("trig") || sub.includes("مثلثات") || t.includes("مثلثات")) {
      return "/images/courses/trigonometry.jpg";
    }
    if (s.includes("geom") || sub.includes("هندسة") || t.includes("هندسة") || s.includes("solid")) {
      return "/images/courses/geometry.jpg";
    }
    if (s.includes("revision") || s.includes("final") || t.includes("مراجعة")) {
      return "/images/courses/final_revision.jpg";
    }
    return "/images/courses/algebra.jpg";
  };

  const coverImage = getCoverImage();

  const features = [
    `${curriculum.lessons.length} درسًا مرئيًا مرتبًا`,
    `${formatDuration(totalSeconds)} من الشرح عبر YouTube`,
    `${curriculum.exams.length} اختبارًا إلكترونيًا بتصحيح فوري`,
    `${curriculum.files.length} ملف PDF (مذكرة + تدريبات)`,
    "شهادة إتمام ومتابعة تقدم لحظية",
  ];

  return (
    <main>
      {/* header with AI Teacher Visual Canvas */}
      <section className="relative overflow-hidden border-b border-[#2D3A38] bg-[#131D1B]">
        {/* Ambient AI Teacher Background Artwork */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Image
            src={coverImage}
            alt={`${course.title} - مستر محمد سعيد`}
            fill
            sizes="100vw"
            priority
            className="object-cover object-center opacity-25 filter blur-[1px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131D1B] via-[#131D1B]/85 to-[#131D1B]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(40,127,131,0.18),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted" aria-label="مسار">
            <Link href="/courses" className="hover:text-brand">الكورسات</Link>
            <span>/</span>
            <span>{course.gradeName}</span>
            <span>/</span>
            <span className="text-ink">{course.subjectName}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{course.subjectName}</Badge>
            <Badge tone="gold">{course.gradeName}</Badge>
            <Badge tone="outline">{course.stageName}</Badge>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-snug tracking-tight sm:text-4xl text-white">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl leading-8 text-[#9DA8B6]">{course.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-[#D0D5DD]">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#FFC400] bg-[#1A2422] px-3 py-1 rounded-full border border-[#FFC400]/30">
              <User size={15} /> {course.teacherName}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <BookOpen size={15} /> {curriculum.lessons.length} درسًا
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Clock size={15} /> {formatDuration(totalSeconds)}
            </span>
          </div>
        </div>
      </section>

      {/* body */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {/* description */}
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold">عن هذا الكورس</h2>
            <p className="leading-8 text-muted">{course.description}</p>
          </section>

          {/* curriculum */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">محتوى الكورس</h2>
              <span className="font-mono text-xs text-muted">
                {curriculum.lessons.filter((l) => l.isFreePreview).length} درسًا مجانيًا للمعاينة
              </span>
            </div>
            <Card className="divide-y divide-line overflow-hidden">
              {curriculum.lessons.map((lesson, i) => {
                const unlocked = owned || lesson.isFreePreview;
                return (
                  <div key={lesson.id} className="p-5">
                    <div className="flex items-center gap-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface2 font-mono text-sm font-bold text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold">{lesson.title}</p>
                        <p className="mt-0.5 text-xs leading-6 text-muted">{lesson.description}</p>
                      </div>
                      {lesson.isFreePreview && !owned ? <Badge tone="success">معاينة مجانية</Badge> : null}
                      {!unlocked ? <Lock size={15} className="text-muted" /> : null}
                      {unlocked ? (
                        <Link
                          href={`/dashboard/courses/${course.slug}?lesson=${i + 1}`}
                          className="text-xs font-bold text-brand hover:underline"
                        >
                          {owned ? "افتح الدرس" : "شاهد مجانًا"} ←
                        </Link>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-1.5 ps-13">
                      {lesson.videos.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-lg bg-surface2/60 px-3 py-2 text-xs text-muted"
                        >
                          <span className="inline-flex items-center gap-2">
                            <PlayCircle size={13} className={unlocked ? "text-brand" : "text-muted"} />
                            {v.title}
                          </span>
                          <span className="font-mono">{formatDuration(v.durationSec)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>

          {/* exams + files */}
          <section className="grid gap-5 md:grid-cols-2">
            <Card className="space-y-4 p-6">
              <h2 className="inline-flex items-center gap-2 text-lg font-extrabold">
                <ClipboardList size={18} className="text-gold" /> الاختبارات الإلكترونية
              </h2>
              <ul className="space-y-2.5 text-sm">
                {curriculum.exams.length === 0 ? (
                  <li className="text-muted">تُضاف الاختبارات قريبًا.</li>
                ) : (
                  curriculum.exams.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface2/60 px-4 py-3">
                      <span className="text-ink">{e.title}</span>
                      <span className="font-mono text-xs text-muted">
                        {e.questionsCount} سؤال · {e.durationMin} د
                      </span>
                    </li>
                  ))
                )}
              </ul>
              {!owned ? <p className="text-xs text-muted">الاختبارات متاحة للمشتركين فقط.</p> : null}
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="inline-flex items-center gap-2 text-lg font-extrabold">
                <FileText size={18} className="text-brand" /> ملفات الكورس
              </h2>
              <ul className="space-y-2.5 text-sm">
                {curriculum.files.map((f) => {
                  const visible = owned || f.isFreePreview;
                  return (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface2/60 px-4 py-3"
                    >
                      <span className="text-ink">{f.title}</span>
                      <span className="font-mono text-xs text-muted">
                        {visible ? `${(f.sizeBytes / 1_000_000).toFixed(1)}MB PDF` : "للمشتركين"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>
        </div>

        {/* sidebar */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-5">
          <Card ticks className="space-y-5 p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted">سعر الاشتراك الكامل</p>
                <p className="mt-1 text-3xl font-extrabold">{formatEGP(course.priceCents)}</p>
              </div>
              <Badge tone="gold">وصول كامل</Badge>
            </div>
            <EnrollPanel slug={course.slug} priceCents={course.priceCents} owned={owned} loggedIn={Boolean(user)} />
            <ul className="space-y-2.5 border-t border-line pt-4 text-sm text-muted">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-lg font-extrabold text-white">
              م∫
            </span>
            <div>
              <p className="text-sm font-bold">{course.teacherName}</p>
              <p className="text-xs text-muted">معلم الرياضيات — الإعدادية والثانوية</p>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
