"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    num: "01",
    name: "التأسيس",
    english: "Foundation",
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-8 stroke-[#B8FF00]" fill="none" strokeWidth="1.8">
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
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-8 stroke-[#E8EAED]" fill="none" strokeWidth="1.8">
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
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-8 stroke-[#B8FF00]" fill="none" strokeWidth="1.8">
        <ellipse cx="20" cy="20" rx="16" ry="7" transform="rotate(-25 20 20)" />
        <ellipse cx="20" cy="20" rx="16" ry="7" transform="rotate(25 20 20)" />
        <circle cx="20" cy="20" r="3" fill="#B8FF00" />
      </svg>
    ),
  },
  {
    num: "04",
    name: "المراجعات",
    english: "Revision",
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-8 stroke-[#E8EAED]" fill="none" strokeWidth="1.8">
        <path d="M 12,20 C 6,20 6,10 12,10 C 18,10 22,30 28,30 C 34,30 34,20 28,20 C 22,20 18,10 12,10 Z" />
      </svg>
    ),
  },
  {
    num: "05",
    name: "الاختبارات",
    english: "Exams",
    shapeSvg: (
      <svg viewBox="0 0 40 40" className="size-8 stroke-[#B8FF00]" fill="none" strokeWidth="1.8">
        <circle cx="20" cy="20" r="15" />
        <circle cx="20" cy="20" r="9" strokeDasharray="3 2" />
        <circle cx="20" cy="20" r="3" fill="#B8FF00" />
      </svg>
    ),
  },
];

export function AcademicMapRoadmap() {
  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">خريطة التعلم والمسارات الدراسية</h2>
          <p className="text-xs font-semibold text-[#8E98A5]">اختر مرحلتك الدراسية للوصول المباشر لكورساتك المنظمة</p>
        </div>
        <Link href="/courses" className="text-xs font-bold text-[#B8FF00] hover:underline">
          عرض جميع المراحل ←
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAGES.map((s, idx) => (
          <Link
            key={s.num}
            href={`/courses?stage=${encodeURIComponent(s.name)}`}
            className="group relative flex flex-col items-center rounded-2xl border border-[#22262E] bg-[#0C0E10] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#B8FF00] hover:shadow-lg"
          >
            {/* Stage Number Badge */}
            <span className="font-mono text-xs font-bold text-[#8E98A5] tracking-widest mb-3">
              {s.num}
            </span>

            {/* Visual Geometric Icon */}
            <div className="relative mb-3 flex size-12 items-center justify-center rounded-xl bg-[#15181C] border border-[#22262E] transition-transform duration-300 group-hover:scale-105">
              {s.shapeSvg}
            </div>

            {/* Stage Title & English subtitle */}
            <h3 className="text-sm font-bold text-white group-hover:text-[#B8FF00] transition-colors">
              {s.name}
            </h3>
            <span className="font-mono text-[10px] font-semibold text-[#8E98A5] uppercase tracking-wider mt-0.5">
              {s.english}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
