"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    num: "01",
    name: "التأسيس",
    english: "Foundation",
    color: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-10 stroke-emerald-500" fill="none" strokeWidth="1.8">
        <polygon points="20,4 36,34 4,34" />
        <line x1="20" y1="4" x2="20" y2="34" />
        <line x1="36" y1="34" x2="20" y2="22" />
        <line x1="4" y1="34" x2="20" y2="22" />
      </svg>
    ),
  },
  {
    num: "02",
    name: "الإعدادي",
    english: "Preparatory",
    color: "from-cyan-500 to-blue-500",
    glow: "shadow-cyan-500/20",
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-10 stroke-cyan-500" fill="none" strokeWidth="1.8">
        <rect x="8" y="14" width="18" height="18" />
        <rect x="14" y="8" width="18" height="18" strokeDasharray="3 3" />
        <line x1="8" y1="14" x2="14" y2="8" />
        <line x1="26" y1="14" x2="32" y2="8" />
        <line x1="8" y1="32" x2="14" y2="26" />
        <line x1="26" y1="32" x2="32" y2="26" />
      </svg>
    ),
  },
  {
    num: "03",
    name: "الثانوي",
    english: "Secondary",
    color: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-10 stroke-amber-500" fill="none" strokeWidth="1.8">
        <ellipse cx="20" cy="20" rx="16" ry="7" transform="rotate(-25 20 20)" />
        <ellipse cx="20" cy="20" rx="16" ry="7" transform="rotate(25 20 20)" />
        <circle cx="20" cy="20" r="4" fill="currentColor" fillOpacity="0.2" />
      </svg>
    ),
  },
  {
    num: "04",
    name: "المراجعات",
    english: "Revision",
    color: "from-lime-500 to-emerald-500",
    glow: "shadow-lime-500/20",
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-10 stroke-lime-500" fill="none" strokeWidth="1.8">
        <path d="M 12,20 C 6,20 6,10 12,10 C 18,10 22,30 28,30 C 34,30 34,20 28,20 C 22,20 18,10 12,10 Z" />
      </svg>
    ),
  },
  {
    num: "05",
    name: "الاختبارات",
    english: "Exams",
    color: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/20",
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-10 stroke-rose-500" fill="none" strokeWidth="1.8">
        <circle cx="20" cy="20" r="16" />
        <circle cx="20" cy="20" r="10" strokeDasharray="4 2" />
        <circle cx="20" cy="20" r="4" fill="currentColor" />
      </svg>
    ),
  },
];

export function AcademicMapRoadmap() {
  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-ink tracking-tight">خريطة التعلم والمسارات الدراسية</h2>
          <p className="text-xs font-semibold text-muted">اختر مرحلتك الدراسية للوصول المباشر لكورساتك المنظمة</p>
        </div>
        <Link href="/courses" className="text-xs font-bold text-neon-lime hover:underline">
          عرض جميع المراحل ←
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAGES.map((s, idx) => (
          <Link
            key={s.num}
            href={`/courses?stage=${encodeURIComponent(s.name)}`}
            className="group relative flex flex-col items-center rounded-3xl border border-line/70 bg-surface/80 p-5 text-center shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-neon-lime hover:shadow-xl"
          >
            {/* Stage Number Badge */}
            <span className="font-mono text-xs font-black text-muted/60 tracking-widest mb-3">
              {s.num}
            </span>

            {/* 3D Visual Geometric Icon */}
            <div className="relative mb-3 flex size-14 items-center justify-center rounded-2xl bg-surface2/60 transition-transform duration-300 group-hover:scale-110">
              {s.shapeSvg}
            </div>

            {/* Stage Title & English subtitle */}
            <h3 className="text-sm font-extrabold text-ink group-hover:text-neon-lime transition-colors">
              {s.name}
            </h3>
            <span className="font-mono text-[10px] font-bold text-muted/70 uppercase tracking-wider mt-0.5">
              {s.english}
            </span>

            {/* Connecting dot array indicator */}
            {idx < STAGES.length - 1 && (
              <div className="hidden lg:block absolute -left-3 top-1/2 my-auto size-2 rounded-full bg-line" />
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
