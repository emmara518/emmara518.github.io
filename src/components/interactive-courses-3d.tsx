"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, PlayCircle, ArrowLeft, Zap, ChevronLeft, CheckCircle2 } from "lucide-react";
import { formatDuration, formatEGP } from "@/lib/format";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  priceCents: number;
  coverImageUrl?: string | null;
  gradeName: string;
  subjectName: string;
  lessonsCount: number;
  totalSeconds: number;
};

function getCourseCoverImage(course: CourseCardData): string {
  // Admin-assigned cover wins over the keyword heuristic.
  if (course.coverImageUrl) return course.coverImageUrl;

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
    return "/images/courses/algebra.jpg";
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
      {/* 3D Coordinate Ambient Glow */}
      <div className="pointer-events-none absolute -top-20 start-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(255,196,0,0.08),transparent_70%)] blur-2xl -z-10" />
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-line">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface border border-line text-[11px] font-mono tracking-tag text-neon-lime shadow-sm">
            <Zap size={13} className="text-neon-lime animate-pulse" />
            <span>3D INTERACTIVE CURRICULUM</span>
          </div>
          <h2 className="type-h2 text-ink">الكورسات</h2>
          <p className="type-small font-ui text-muted max-w-xl font-normal">
            ابدأ من مستواك.
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
                    ? "bg-neon-lime text-black shadow-[0_0_18px_rgba(255,196,0,0.3)] font-bold scale-105"
                    : "bg-surface text-muted border border-line hover:border-neon-lime/50 hover:text-ink shadow-sm"
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
                  filter: isSibling ? "brightness(0.92) contrast(0.95)" : "none",
                }}
              >
                <Link href={`/courses/${course.slug}`} className="block h-full group">
                  <div
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-500 flex flex-col justify-between h-full bg-surface shadow-card ${
                      isHero
                        ? "border-neon-lime shadow-[0_20px_60px_-10px_rgba(255,196,0,0.3),0_0_30px_rgba(255,196,0,0.15)] bg-surface2"
                        : "border-line hover:border-neon-lime/50"
                    }`}
                  >
                    {/* Top 3D Hero Flare Accent Line */}
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-neon-lime to-transparent transition-opacity duration-500 z-30 ${
                        isHero ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    {/* Visual Course AI Cover */}
                    <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-surface2 border-b border-line">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 pointer-events-none" />

                      {/* Top Floating Badges */}
                      <div className="absolute start-3.5 top-3.5 flex items-center gap-1.5 z-10 font-ui">
                        <span className="rounded-full bg-black/90 backdrop-blur-md border border-neon-lime/40 px-3 py-1 text-[11px] font-bold text-neon-lime shadow-md">
                          {course.subjectName}
                        </span>
                        <span className="rounded-full bg-surface/90 dark:bg-black/90 backdrop-blur-md border border-line px-2.5 py-1 text-[11px] font-semibold text-ink dark:text-white">
                          {course.gradeName}
                        </span>
                      </div>

                      {/* Hero Spotlight Indicator Badge */}
                      {isHero ? (
                        <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-neon-lime px-3 py-1 text-[11px] font-extrabold text-black shadow-[0_0_15px_rgba(255,196,0,0.6)] animate-bounce font-mono tracking-tag">
                          HERO FOCUS ★
                        </span>
                      ) : (
                        <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-black/85 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-mono text-white/90">
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
                              isHero ? "text-neon-lime" : "text-ink group-hover:text-neon-lime"
                            }`}
                          >
                            {course.title}
                          </h3>
                        </div>
                        <p className="type-small font-ui leading-relaxed text-muted line-clamp-2 font-normal">
                          {course.summary}
                        </p>
                      </div>

                      <div className="space-y-3.5 mt-auto">
                        {/* Course Metadata Strip */}
                        <div className="flex items-center gap-3.5 font-mono text-[11px] text-muted pt-1 border-t border-line">
                          <span className="inline-flex items-center gap-1 font-semibold text-ink">
                            <BookOpen size={13} className="text-neon-lime" /> {course.lessonsCount} درس
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} /> {formatDuration(course.totalSeconds)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-muted">
                            <PlayCircle size={13} /> FHD
                          </span>
                        </div>

                        {/* Pricing and Action CTA */}
                        <div className="flex items-center justify-between border-t border-line pt-3.5 font-ui">
                          <div>
                            <span className="text-[10px] font-mono text-muted block">تكلفة الاشتراك</span>
                            <span className="text-base sm:text-lg font-extrabold text-ink font-brand">
                              {formatEGP(course.priceCents)}
                            </span>
                          </div>

                          <div
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-sm ${
                              isHero
                                ? "bg-neon-lime text-black shadow-[0_0_20px_rgba(255,196,0,0.35)] translate-x-[-4px]"
                                : "bg-surface2 text-ink border border-line group-hover:bg-neon-lime group-hover:text-black group-hover:border-neon-lime"
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
      <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 font-ui">
        <div className="flex items-center gap-2 text-xs text-muted">
          <CheckCircle2 size={15} className="text-neon-lime" />
          <span>كل كورس يشمل شيتات وامتحانات تدريبية.</span>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-neon-lime hover:text-ink bg-surface hover:bg-surface2 px-5 py-2.5 rounded-xl border border-line hover:border-neon-lime transition-all duration-300 shadow-sm"
        >
          <span>جميع الكورسات</span>
          <ArrowLeft size={15} />
        </Link>
      </div>
    </section>
  );
}
