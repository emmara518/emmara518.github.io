"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Play,
  Download,
  Flame,
  Clock,
  Sparkles,
  BookOpen,
  Users,
  Video,
  Award,
  Target,
  ArrowUpLeft,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DROS MATH UNIVERSE Hero Banner
 * Features Mr. Mohamed Saeed's portrait, glowing neon geometry, and math formulas.
 */
export function DashboardHeroBanner({ user }: { user?: { name: string } | null }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0C0E10] text-white p-6 sm:p-10 border border-[#22262E] shadow-2xl">
      {/* Background Math Grid & Engineered Orbit lines */}
      <div className="absolute inset-0 math-grid-pattern opacity-20 pointer-events-none" />

      {/* Floating Math Formulas */}
      <div className="absolute top-6 left-1/3 hidden md:block font-mono text-sm font-bold text-[#8E98A5]/40 select-none">
        f(x) = x² - 4x + 3
      </div>
      <div className="absolute bottom-10 left-1/4 hidden md:block font-mono text-xs font-bold text-[#B8FF00]/40 select-none">
        x = (-b ± √(b² - 4ac)) / 2a
      </div>

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        {/* Text & Action Column */}
        <div className="space-y-6 text-start">
          <div className="inline-flex items-center gap-2 rounded-md border border-[#22262E] bg-[#15181C] px-3.5 py-1 text-xs font-bold text-[#8E98A5]">
            <span className="size-1.5 rounded-full bg-[#B8FF00]" />
            <span>منصة دروس ماث — مستر محمد سعيد</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-white">
            تعلم الرياضيات <br />
            <span className="text-[#B8FF00]">بمنطق واستنتاج هندسي</span>
          </h1>

          <p className="max-w-xl text-sm sm:text-base font-medium leading-relaxed text-[#8E98A5]">
            تعلم بذكاء، تدرب باحتراف، وتفوق بثقة مع <span className="font-extrabold text-white">مستر محمد سعيد</span>.
            منهج كامل، اختبارات بتصحيح فوري، ومتابعة لحظية لتقدمك.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-[#B8FF00] px-6 py-3.5 text-sm font-black text-[#050505] hover:bg-[#D7FF3F] transition-all"
            >
              <Play size={16} fill="currentColor" />
              <span>ابدأ التعلم الآن</span>
            </Link>

            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-[#22262E] bg-[#15181C] px-5 py-3.5 text-sm font-bold text-white hover:border-[#B8FF00] transition-colors"
            >
              <span>استعراض المقررات</span>
            </Link>
          </div>

          {/* Quick Nav Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4 border-t border-[#22262E]">
            {[
              { label: "المقررات", icon: BookOpen },
              { label: "المجتمع", icon: Users },
              { label: "الدروس", icon: Video },
              { label: "الاختبارات", icon: Award },
              { label: "أهدافك", icon: Target },
            ].map((tab) => (
              <button
                key={tab.label}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#15181C] px-3 py-2 text-xs font-bold text-[#8E98A5] border border-[#22262E] hover:border-[#B8FF00]/60 hover:text-white transition-all"
              >
                <tab.icon size={13} className="text-[#B8FF00]" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Teacher Portrait Container (Mr. Mohamed Saeed) */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative size-72 sm:size-80 lg:size-96 rounded-2xl p-1.5 bg-[#15181C] border border-[#22262E]">
            <div className="relative size-full overflow-hidden rounded-xl bg-[#050505]">
              <Image
                src="/images/teacher.webp"
                alt="مستر محمد سعيد — Dros Math"
                fill
                priority
                className="object-cover object-top hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Glowing Signature Badge */}
            <div className="absolute bottom-4 right-4 rounded-2xl bg-slate-900/90 border border-lime-400/40 px-4 py-2 text-center backdrop-blur-md shadow-xl">
              <span className="block text-[10px] font-mono font-bold text-lime-400">LECTURER</span>
              <span className="block text-xs font-black text-white">أ/ محمد سعيد</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Current Mission Card (مهمتك الحالية)
 */
export function CurrentMissionWidget() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-neon-lime/20 text-lime-600 dark:text-lime-400 font-bold">
            <Target size={16} />
          </span>
          <div>
            <span className="text-[10px] font-mono font-bold text-muted uppercase">MISSION 09</span>
            <h3 className="text-sm font-black text-ink">مهمتك الحالية</h3>
          </div>
        </div>
        <span className="rounded-full bg-lime-500/10 px-3 py-1 font-mono text-xs font-extrabold text-lime-600 dark:text-lime-400 border border-lime-500/20">
          68% مكتمل
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr] items-center">
        <div className="space-y-3 text-start">
          <h4 className="text-lg font-black text-ink">التفاضل والتكامل</h4>
          <p className="font-mono text-xs text-muted">CALCULUS — Limits & Derivatives</p>

          <div className="flex items-center gap-4 text-xs font-bold text-muted pt-1">
            <span>26 فيديو</span>
            <span>•</span>
            <span>18 اختبار</span>
            <span>•</span>
            <span>07 تحديات</span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/courses/calculus"
              className="inline-flex items-center gap-2 rounded-xl bg-neon-lime px-4 py-2 text-xs font-black text-slate-950 hover:bg-lime-400 transition-colors"
            >
              <Play size={14} fill="currentColor" />
              <span>متابعة المهمة</span>
            </Link>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3 py-2 text-xs font-bold text-muted hover:text-ink transition-colors">
              <Download size={14} />
              <span>تحميل الملخص</span>
            </button>
          </div>
        </div>

        {/* 3D Wave Graph SVG (Matching Mockup 2) */}
        <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center">
          <svg viewBox="0 0 200 100" className="w-full h-full stroke-lime-400" fill="none" strokeWidth="2">
            <path d="M 10 50 Q 50 10, 100 50 T 190 50" />
            <path d="M 10 70 Q 60 30, 110 70 T 190 30" stroke="#22d3ee" strokeOpacity="0.6" strokeDasharray="4 2" />
          </svg>
          <span className="absolute bottom-2 right-3 font-mono text-[10px] font-bold text-lime-400">
            dy/dx
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Mastery Gauge Widget (تقدمك في التعلم)
 */
export function MasteryGaugeWidget() {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-ink">تقدمك في التعلم</h3>
        <Link href="/dashboard/stats" className="text-xs font-bold text-neon-lime hover:underline">
          تقرير تفصيلي
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Doughnut Progress */}
        <div className="relative size-28 shrink-0 flex items-center justify-center">
          <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-surface2"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-neon-lime"
              strokeDasharray="82, 100"
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-center">
            <span className="font-mono text-xl font-black text-ink">82%</span>
            <span className="block text-[9px] font-bold text-muted">مستوى الإتقان</span>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="w-full space-y-2 text-xs font-bold">
          {[
            { name: "الجبر", val: 90, color: "bg-lime-500" },
            { name: "الدوال", val: 85, color: "bg-cyan-500" },
            { name: "الهندسة", val: 75, color: "bg-amber-500" },
            { name: "التكامل", val: 65, color: "bg-emerald-500" },
          ].map((s) => (
            <div key={s.name} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">{s.name}</span>
                <span className="font-mono text-ink">{s.val}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                <div className={cn("h-full rounded-full", s.color)} style={{ width: `${s.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Math Tip Widget (معلومة سريعة)
 */
export function QuickMathTipWidget() {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-amber-500">
        <Sparkles size={18} />
        <h3 className="text-xs font-black uppercase tracking-wider text-muted">معلومة سريعة</h3>
      </div>
      <p className="text-sm font-bold leading-relaxed text-ink">
        مشتقة الدالة الثابتة تساوي صفر دائماً.
      </p>
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-center font-mono text-base font-black text-amber-600 dark:text-amber-400">
        (c)&apos; = 0
      </div>
    </div>
  );
}

/**
 * Upcoming Exam Widget (الاختبار القادم)
 */
export function UpcomingExamWidget() {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-ink">الاختبار القادم</h3>
        <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-rose-500 border border-rose-500/20">
          هام
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-black text-ink">الجبر الخطي والمصفوفات</h4>
        <p className="font-mono text-xs text-muted">2 يوم 14 ساعة متبقية</p>
      </div>

      <Link
        href="/dashboard/exams/algebra-101"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neon-lime px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-lime-400 transition-colors"
      >
        <span>ابدأ الاختبار الان</span>
      </Link>
    </div>
  );
}

/**
 * Platform Metrics Banner (120K Students, 2500 Hours)
 */
export function PlatformMetricsRow() {
  const metrics = [
    { value: "+120K", label: "طالب وطالبة معنا" },
    { value: "+2,500", label: "ساعة محتوى تعليمي" },
    { value: "+8,000", label: "امتحان تم حله" },
    { value: "98%", label: "نسبة رضا الطلاب" },
    { value: "4.9/5", label: "تقييم المنصة" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl border border-line/60 bg-surface/80 p-4 text-center shadow-sm backdrop-blur-xl"
        >
          <span className="block font-mono text-xl font-black text-neon-lime">{m.value}</span>
          <span className="block text-[11px] font-bold text-muted mt-1">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
