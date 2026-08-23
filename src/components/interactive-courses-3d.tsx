"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, PlayCircle, ArrowLeft, Sparkles, Zap, ChevronLeft, CheckCircle2 } from "lucide-react";
import { formatDuration, formatEGP } from "@/lib/format";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  priceCents: number;
  gradeName: string;
  subjectName: string;
  lessonsCount: number;
  totalSeconds: number;
};

function getCourseCoverImage(course: CourseCardData): string {
  const s = (course.slug || "").toLowerCase();
  const sub = (course.subjectName || "").toLowerCase();
  const t = (course.title || "").toLowerCase();

  if (s.includes("calculus") || sub.includes("تفاضل") || t.includes("تفاضل") || s.includes("diff") || sub.includes("calculus")) {
    return "/images/courses/calculus.jpg";
  }
  if (s.includes("trig") || sub.includes("مثلثات") || t.includes("مثلثات")) {
    return "/images/courses/trigonometry.jpg";
  }
  if (s.includes("geom") || sub.includes("هندسة") || t.includes("هندسة") || s.includes("solid")) {
    return "/images/courses/geometry.jpg";
  }
  if (s.includes("revision") || s.includes("final") || t.includes("مراجعة") || t.includes("شاملة")) {
    return "/images/courses/final_revision.jpg";
  }
  return "/images/courses/algebra.jpg";
}

export function InteractiveCourses3DSection({ courses }: { courses: CourseCardData[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter courses by category if selected
  const categories = [
    { id: "all", label: "جميع المقررات" },
    { id: "pure", label: "Pure Math (تفاضل وجبر)" },
    { id: "applied", label: "Applied Math (ميكانيكا)" },
  ];

  const filteredCourses = courses.filter((c) => {
    if (activeCategory === "all") return true;
    const text = `${c.title} ${c.subjectName} ${c.summary}`.toLowerCase();
    if (activeCategory === "pure") {
      return text.includes("تفاضل") || text.includes("جبر") || text.includes("calculus") || text.includes("algebra");
    }
    if (activeCategory === "applied") {
      return text.includes("استاتيكا") || text.includes("ديناميكا") || text.includes("ميكانيكا") || text.includes("statics") || text.includes("dynamics");
    }
    return true;
  });

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 overflow-hidden">
      {/* 3D Cosmic Coordinate Ambient Lights */}
      <div className="pointer-events-none absolute -top-20 start-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(184,255,0,0.08),transparent_70%)] blur-2xl -z-10" />
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#22262E]">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0C0E10] border border-[#22262E] text-[11px] font-mono tracking-tag text-[#B8FF00]">
            <Zap size={13} className="text-[#B8FF00] animate-pulse" />
            <span>3D INTERACTIVE CURRICULUM</span>
            <span className="text-[#343940]">/</span>
            <span className="text-[#8E98A5]">المقررات الحصرية</span>
          </div>
          <h2 className="type-h2 text-white">المناهج والمقررات الدراسية التفاعلية</h2>
          <p className="type-small font-ui text-[#8E98A5] max-w-xl font-normal">
            قف على أي مقرر دراسي لتفعيل مسرح التركيز ثلاثي الأبعاد والاطلاع على تفاصيل المنهج مع مستر محمد سعيد.
          </p>
        </div>

        {/* Categories / Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto font-ui">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-[#B8FF00] text-[#050505] shadow-[0_0_18px_rgba(184,255,0,0.3)] font-bold scale-105"
                    : "bg-[#0C0E10] text-[#8E98A5] border border-[#22262E] hover:border-[#B8FF00]/50 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Perspective Stage Container */}
      <div
        ref={containerRef}
        className="mt-12 [perspective:1400px] relative min-h-[500px]"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {filteredCourses.map((course, idx) => {
            const isHero = hoveredId === course.id;
            const isAnyHovered = hoveredId !== null;
            const isSibling = isAnyHovered && !isHero;

            // Calculate directional 3D shift relative to grid
            const siblingTransform =
              idx % 3 === 0
                ? "translateZ(-30px) rotateY(4deg) scale(0.96)"
                : idx % 3 === 2
                ? "translateZ(-30px) rotateY(-4deg) scale(0.96)"
                : "translateZ(-40px) scale(0.95)";

            const coverImage = getCourseCoverImage(course);

            return (
              <div
                key={course.id}
                onMouseEnter={() => setHoveredId(course.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="transition-all duration-500 ease-out transform-gpu"
                style={{
                  transform: isHero
                    ? "translateZ(50px) translateY(-14px) scale(1.05)"
                    : isSibling
                    ? siblingTransform
                    : "translateZ(0px) translateY(0px) scale(1)",
                  zIndex: isHero ? 40 : 10,
                  opacity: isSibling ? 0.65 : 1,
                  filter: isSibling ? "brightness(0.85) contrast(0.95)" : "none",
                }}
              >
                <Link href={`/courses/${course.slug}`} className="block h-full group">
                  <div
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-500 flex flex-col justify-between h-full bg-[#0C0E10] ${
                      isHero
                        ? "border-[#B8FF00] shadow-[0_20px_60px_-10px_rgba(184,255,0,0.3),0_0_30px_rgba(184,255,0,0.15)] bg-gradient-to-b from-[#12161D] to-[#0A0D11]"
                        : "border-[#22262E] hover:border-[#B8FF00]/50 shadow-xl"
                    }`}
                  >
                    {/* Top 3D Hero Flare Accent Line */}
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#B8FF00] to-transparent transition-opacity duration-500 z-30 ${
                        isHero ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    {/* Visual Course AI Cover: Mr. Mohamed Saeed */}
                    <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-[#050505] border-b border-[#22262E]">
                      <Image
                        src={coverImage}
                        alt={`${course.title} - مستر محمد سعيد`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover object-center transition-transform duration-700 ease-out ${
                          isHero ? "scale-110" : "group-hover:scale-105"
                        }`}
                        referrerPolicy="no-referrer"
                      />
                      {/* Vignette Overlay for Crisp Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E10] via-black/30 to-black/60 pointer-events-none" />

                      {/* Top Floating Badges */}
                      <div className="absolute start-3.5 top-3.5 flex items-center gap-1.5 z-10 font-ui">
                        <span className="rounded-full bg-[#050505]/90 backdrop-blur-md border border-[#B8FF00]/40 px-3 py-1 text-[11px] font-bold text-[#B8FF00] shadow-md">
                          {course.subjectName}
                        </span>
                        <span className="rounded-full bg-[#14181E]/90 backdrop-blur-md border border-[#22262E] px-2.5 py-1 text-[11px] font-semibold text-[#E8EAED]">
                          {course.gradeName}
                        </span>
                      </div>

                      {/* Hero Spotlight Indicator Badge */}
                      {isHero ? (
                        <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-[#B8FF00] px-3 py-1 text-[11px] font-extrabold text-[#050505] shadow-[0_0_15px_rgba(184,255,0,0.6)] animate-bounce font-mono tracking-tag">
                          HERO FOCUS ★
                        </span>
                      ) : (
                        <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-[#050505]/85 backdrop-blur-md border border-[#2B313A] px-2.5 py-0.5 text-[10px] font-mono text-[#D0D5DD]">
                          أ/ محمد سعيد
                        </span>
                      )}
                    </div>

                    {/* Card Body Content */}
                    <div className="space-y-4 p-5 sm:p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`type-h3 transition-colors ${
                              isHero ? "text-[#B8FF00]" : "text-white group-hover:text-[#B8FF00]"
                            }`}
                          >
                            {course.title}
                          </h3>
                        </div>
                        <p className="type-small font-ui leading-relaxed text-[#8E98A5] line-clamp-2 font-normal">
                          {course.summary}
                        </p>
                      </div>

                      <div className="space-y-3.5 mt-auto">
                        {/* Course Metadata Strip */}
                        <div className="flex items-center gap-3.5 font-mono text-[11px] text-[#8E98A5] pt-1 border-t border-[#1C2128]">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#D0D5DD]">
                            <BookOpen size={13} className="text-[#B8FF00]" /> {course.lessonsCount} درس
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} /> {formatDuration(course.totalSeconds)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#8E98A5]">
                            <PlayCircle size={13} /> FHD
                          </span>
                        </div>

                        {/* Pricing and Action CTA */}
                        <div className="flex items-center justify-between border-t border-[#22262E] pt-3.5 font-ui">
                          <div>
                            <span className="text-[10px] font-mono text-[#6E7681] block">تكلفة الاشتراك</span>
                            <span className="text-base sm:text-lg font-extrabold text-white font-brand">
                              {formatEGP(course.priceCents)}
                            </span>
                          </div>

                          <div
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-sm ${
                              isHero
                                ? "bg-[#B8FF00] text-[#050505] shadow-[0_0_20px_rgba(184,255,0,0.35)] translate-x-[-4px]"
                                : "bg-[#14181E] text-[#B8FF00] border border-[#B8FF00]/30 group-hover:bg-[#B8FF00] group-hover:text-[#050505]"
                            }`}
                          >
                            <span>استعراض المحاضرات</span>
                            <ChevronLeft size={15} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explore Full Catalog Link Bar */}
      <div className="mt-12 pt-6 border-t border-[#1F242C] flex flex-col sm:flex-row items-center justify-between gap-4 font-ui">
        <div className="flex items-center gap-2 text-xs text-[#8E98A5]">
          <CheckCircle2 size={15} className="text-[#B8FF00]" />
          <span>جميع المحاضرات تشمل شيتات واجب، امتحانات تدريبية، ودعم فني مستمر.</span>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#B8FF00] hover:text-white bg-[#0E1115] hover:bg-[#151920] px-5 py-2.5 rounded-xl border border-[#262C36] hover:border-[#B8FF00] transition-all duration-300"
        >
          <span>تصفح الفهرس الكامل لجميع المراحل</span>
          <ArrowLeft size={15} />
        </Link>
      </div>
    </section>
  );
}
