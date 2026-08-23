"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  User,
  ArrowLeft,
  ChevronLeft,
  BookOpen,
  Target,
  Brain,
  Layers,
  X,
  Compass,
  FileCheck,
  Award,
  BarChart2,
} from "lucide-react";
import { LogoWordmark } from "./logo";
import { MATH_SYMBOLS_3D, MathSymbolData } from "@/lib/data/math-symbols";
import { cn } from "@/lib/utils";

export function DrosUniverseShowcase() {
  const [selectedSymbol, setSelectedSymbol] = useState<MathSymbolData | null>(null);
  const [selectedStage, setSelectedStage] = useState<{
    id: string;
    title: string;
    engTitle: string;
    desc: string;
    count: string;
    image: string;
    grades: string[];
    branches: string[];
    features: string[];
    stats: {
      lectures: string;
      sheets: string;
      exams: string;
    };
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Subtle Mouse Parallax on Hero Assets
  const handleMouseMove = (e: React.MouseEvent) => {
    if (reducedMotion) return;
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 16;
    const y = (e.clientY / innerHeight - 0.5) * 16;
    setMouseOffset({ x, y });
  };

  const academicStages = [
    { 
      id: "prep", 
      title: "المرحلة الإعدادية (Prep)", 
      engTitle: "Middle School Mathematics — Prep 1, 2 & 3",
      desc: "تأسيس المفاهيم الهندسية والجبرية وحل المعادلات المتقدمة مع الاستنتاج الرياضي وبناء التفكير المنطقي لطلاب اللغات.", 
      count: "Prep 1 · Prep 2 · Prep 3",
      image: "/images/stages/prep.jpg",
      grades: ["Prep 1 (First & Second Term)", "Prep 2 (Algebra & Geometry)", "Prep 3 (Cert Prep & Advanced Trig)"],
      branches: ["Algebra & Number Theory", "Euclidean Geometry", "Trigonometry Basics", "Analytical Geometry", "Statistics & Probability"],
      features: [
        "تأسيس قوي لمصطلحات ومفاهيم English Math بالكامل",
        "تفكيك مسائل البراهين الهندسية (Geometry Proofs) خطوة بخطوة",
        "شيتات تفاعلية أسبوعية واختبارات قياس مستوى دورية",
        "تدريب مكثف على نماذج امتحانات الإدارات التعليمية والمدارس المتميزة"
      ],
      stats: {
        lectures: "60+ محاضرة تفصيلية",
        sheets: "120+ شيت واجب ومراجعة",
        exams: "35+ اختبار إلكتروني قياسي"
      }
    },
    { 
      id: "sec1_2", 
      title: "الصف الأول والثاني الثانوي (Sec 1 & 2)", 
      engTitle: "Secondary School — Sec 1 & Sec 2 (Pure & Applied)",
      desc: "الدوال الحقيقية، حساب المثلثات، الهندسة التحليلية، مبادئ التفاضل والتكامل، والرياضيات التطبيقية (استاتيكا وهندسة فراغية).", 
      count: "Sec 1 · Sec 2 (Pure & Applied)",
      image: "/images/stages/sec1_2.jpg",
      grades: ["Sec 1 (Trigonometry & Analytical Geometry)", "Sec 2 (Pure Mathematics)", "Sec 2 (Applied Mathematics)"],
      branches: ["Real Functions & Inverses", "Calculus & Limits", "Trigonometric Identities", "Statics & Forces Equilibrium", "3D Space Geometry"],
      features: [
        "بناء أساس صلب للتفاضل والتكامل قبل دخول الثانوية العامة",
        "فهم عميق للرياضيات التطبيقية (Statics & Dynamics) بربطها بالحركة الواقعية",
        "حل مسائل التفكير من المستوى الرفيع (Higher Order Thinking Skills - HOTS)",
        "مراجعات شهرية شاملة مطابقة لمواصفات نظام التابلت الحديث"
      ],
      stats: {
        lectures: "80+ محاضرة عالية الجودة",
        sheets: "160+ شيت وتمارين متدرجة",
        exams: "50+ امتحان أسبوعي وشهري"
      }
    },
    { 
      id: "sec3", 
      title: "الصف الثالث الثانوي (Sec 3 Math)", 
      engTitle: "Thanaweya Amma — Sec 3 English Math Specialist",
      desc: "التفاضل والتكامل، الجبر والهندسة الفراغية، الاستاتيكا والديناميكا وأسرار حصد الدرجة النهائية والتميز في الثانوية العامة.", 
      count: "Calculus · Algebra · Dynamics · Statics",
      image: "/images/stages/sec3.jpg",
      grades: ["Pure Math (Calculus & Integration)", "Pure Math (Algebra & Solid Geometry)", "Applied Math (Statics)", "Applied Math (Dynamics)"],
      branches: ["Calculus & Integration Techniques", "Algebra (Matrices, Binomial, Complex Numbers)", "Solid & Vector Geometry", "Statics (Moments & Friction)", "Dynamics (Newton's Laws & Impulse)"],
      features: [
        "شرح كل قانون بأصله الرياضي الفيزيائي لضمان الثبات التام",
        "حل أكثر من 3000 مسألة من أحدث امتحانات الثانوية ونماذج الوزارة الاسترشادية",
        "تدريب زمني على سرعة الحل واستخدام مهارات التفكير السريع والآلة الحاسبة بذكاء",
        "معسكرات المراجعة النهائية وبنوك الأسئلة الشاملة ليلة الامتحان"
      ],
      stats: {
        lectures: "120+ محاضرة احترافية",
        sheets: "250+ شيت ومذكرة مراجعة",
        exams: "80+ امتحان إلكتروني ونموذج وزاري"
      }
    },
  ];

  const searchResults = [
    { title: "Calculus — التفاضل والتكامل الكامل لـ Sec 3", type: "كورس دراسي", href: "/courses" },
    { title: "Algebra & Solid Geometry — الجبر والهندسة الفراغية", type: "كورس دراسي", href: "/courses" },
    { title: "Applied Mathematics — الاستاتيكا والديناميكا", type: "كورس دراسي", href: "/courses" },
    { title: "بنك الأسئلة والاختبارات القياسية", type: "اختبارات", href: "/dashboard/arena" },
    { title: "دليل القوانين الرياضية الشامل", type: "ملخصات", href: "/dashboard/formulas" },
  ].filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-[#050505] text-[#F4F5F6] selection:bg-[#B8FF00] selection:text-[#050505] font-sans antialiased"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. EDITORIAL TOP NAVIGATION
         ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-[#22262E] px-4 sm:px-8 py-3.5">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <Link href="/" className="shrink-0" aria-label="Dros Math — الصفحة الرئيسية">
            <LogoWordmark />
          </Link>

          {/* Core Navigation Modules */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#8E98A5] font-ui">
            <Link href="/" className="text-[#B8FF00] font-semibold transition-colors">
              الرئيسية
            </Link>
            <Link href="/courses" className="hover:text-white transition-colors">
              المراحل الدراسية
            </Link>
            <Link href="/courses" className="hover:text-white transition-colors">
              المناهج والكورسات
            </Link>
            <Link href="/dashboard/arena" className="hover:text-white transition-colors">
              بنك الاختبارات
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              عن مستر محمد سعيد
            </Link>
          </nav>

          {/* Utility Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="size-9 rounded-lg bg-[#0C0E10] border border-[#22262E] text-[#8E98A5] hover:text-[#B8FF00] hover:border-[#B8FF00]/40 flex items-center justify-center transition-all cursor-pointer"
              title="بحث في المنصة"
              aria-label="بحث في المنصة"
            >
              <Search size={15} />
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-[#22262E] bg-[#0C0E10] px-4 py-2 text-xs font-semibold font-ui text-white hover:border-[#B8FF00] hover:text-[#B8FF00] transition-all"
            >
              <User size={13} />
              <span>دخول الطالب</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. THE MASTER LAYERED HERO SECTION
             Art Direction: Priority 1 (Mr. Mohamed Saeed) + Priority 2 (DROS MATH Editorial Headline) +
             Real Depth Layers (Background Grid/Orbits → Midground behind teacher → Teacher Focal Point → Foreground)
         ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-8 border-b border-[#22262E]">
        
        {/* Background Coordinate Grid with Subtle Matrix */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#22262E_1px,transparent_1px),linear-gradient(to_bottom,#22262E_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.14] pointer-events-none" />

        {/* Technical Coordinate Scale & Axis Crossings */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="size-full" preserveAspectRatio="none" viewBox="0 0 1200 600">
            <line x1="0" y1="300" x2="1200" y2="300" stroke="#8E98A5" strokeWidth="0.8" strokeDasharray="6 6" />
            <line x1="600" y1="0" x2="600" y2="600" stroke="#8E98A5" strokeWidth="0.8" strokeDasharray="6 6" />
            {/* Subtle Origin Indicator */}
            <circle cx="600" cy="300" r="3" fill="#B8FF00" />
            <text x="610" y="315" fill="#8E98A5" fontSize="10" fontFamily="monospace">(0, 0)</text>
          </svg>
        </div>

        {/* Controlled Restrained Lime Ambient Particle Accents */}
        <div className="absolute top-1/4 end-1/4 size-72 rounded-full bg-[#B8FF00]/[0.03] blur-[80px] pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ── Editorial Left Column: Pure Purpose & Strong Typography (6 Cols) ── */}
          <div className="lg:col-span-6 text-start space-y-6 sm:space-y-7 order-2 lg:order-1">
            
            {/* Platform Identifier Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#0C0E10] border border-[#22262E] text-[11px] font-mono tracking-tag text-[#8E98A5]">
              <span className="size-1.5 rounded-full bg-[#B8FF00]" />
              <span className="font-bold text-[#F4F5F6]">DROS MATH</span>
              <span className="text-[#343940]">/</span>
              <span>ENGLISH MATH PLATFORM</span>
            </div>

            {/* Editorial Headline */}
            <div className="space-y-4">
              <h1 className="type-hero text-white tracking-normal font-extrabold text-start">
                <span className="block">افهم الـ<bdi className="bidi-term font-mono text-white">Math</bdi></span>
                <span className="block text-white">بعمق.</span>
                <span className="block text-[#B8FF00] mt-1">وتعلمه بذكاء.</span>
              </h1>
              
              <div className="relative p-4 sm:p-5 rounded-2xl bg-[#0C0E10]/95 border-r-2 border-r-[#B8FF00] border-y border-l border-[#1D2128] shadow-lg max-w-xl">
                <p className="type-body font-ui text-[#9DA8B6] font-normal leading-[1.7]">
                  منصة <span className="text-[#F4F5F6] font-semibold bg-[#14181E] px-2 py-0.5 rounded-md border border-[#262B34]"><bdi className="bidi-term">Dros Math</bdi></span> مع <span className="text-[#B8FF00] font-semibold">مستر محمد سعيد</span> — رحلة احترافية لطلاب اللغات لتبسيط المفاهيم المعقدة، وبناء التفكير الرياضي والتحليلي وصولاً لأعلى درجات التميز والدرجات النهائية.
                </p>
              </div>
            </div>

            {/* Controlled Production-Grade CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1 font-ui">
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#B8FF00] px-7 py-3.5 text-sm font-bold text-[#050505] hover:bg-[#D7FF3F] transition-all cursor-pointer shadow-[0_0_24px_rgba(184,255,0,0.22)] active:scale-[0.98]"
              >
                <span>ابدأ رحلتك</span>
                <ArrowLeft size={16} />
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-[#22262E] bg-[#0C0E10] px-6 py-3.5 text-sm font-semibold text-[#F4F5F6] hover:border-[#B8FF00]/70 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>تعرف على مستر محمد سعيد</span>
              </Link>
            </div>

            {/* Precision Mathematical Domains Pipeline */}
            <div className="pt-6 border-t border-[#22262E] grid grid-cols-3 gap-4 font-mono text-xs">
              <div className="space-y-1">
                <span className="num-anchor text-[#B8FF00] tracking-tag text-xs">01 / ANALYSIS</span>
                <p className="text-[#8E98A5] text-[11px] font-ui font-normal">Calculus & Functions</p>
              </div>
              <div className="space-y-1">
                <span className="num-anchor text-[#B8FF00] tracking-tag text-xs">02 / STRUCTURE</span>
                <p className="text-[#8E98A5] text-[11px] font-ui font-normal">Algebra & Matrices</p>
              </div>
              <div className="space-y-1">
                <span className="num-anchor text-[#B8FF00] tracking-tag text-xs">03 / SPATIAL</span>
                <p className="text-[#8E98A5] text-[11px] font-ui font-normal">Solid & Dynamics</p>
              </div>
            </div>
          </div>

          {/* ── Right Hero Stage: Real Layered Architecture (6 Cols) ── */}
          <div className="lg:col-span-6 relative flex items-center justify-center order-1 lg:order-2 min-h-[420px] sm:min-h-[500px] lg:min-h-[560px] [perspective:1200px] [transform-style:preserve-3d]">
            
            {/* ── BACKGROUND LAYER: Technical Coordinate System & Dynamic Orbit Trajectories ── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-45">
              <svg width="560" height="560" viewBox="0 0 560 560" fill="none" className="size-full max-w-[560px]">
                {/* Outer Concentric Coordinate Rings with Degree Hash Marks */}
                <circle cx="280" cy="280" r="250" stroke="#22262E" strokeWidth="1" strokeDasharray="3 4" />
                <circle cx="280" cy="280" r="195" stroke="#22262E" strokeWidth="1" />
                <circle cx="280" cy="280" r="130" stroke="#343940" strokeWidth="1" strokeDasharray="2 3" />
                
                {/* Dynamic Coordinate Elliptical Orbit (Thin Glowing Lime) */}
                <ellipse
                  cx="280"
                  cy="280"
                  rx="260"
                  ry="105"
                  stroke="#B8FF00"
                  strokeWidth="1"
                  strokeDasharray="5 7"
                  strokeOpacity="0.8"
                  transform="rotate(-24 280 280)"
                  className={cn(!reducedMotion && "animate-spin-slow origin-center")}
                />

                {/* Counter-Orbit Trajectory */}
                <ellipse
                  cx="280"
                  cy="280"
                  rx="235"
                  ry="140"
                  stroke="#22262E"
                  strokeWidth="0.8"
                  transform="rotate(38 280 280)"
                />
                
                {/* Coordinate Crosshairs */}
                <line x1="280" y1="15" x2="280" y2="545" stroke="#22262E" strokeWidth="0.8" />
                <line x1="15" y1="280" x2="545" y2="280" stroke="#22262E" strokeWidth="0.8" />

                {/* Vector Ray at 45 deg */}
                <line x1="280" y1="280" x2="450" y2="110" stroke="#343940" strokeWidth="0.8" strokeDasharray="2 2" />
                <circle cx="450" cy="110" r="3" fill="#B8FF00" />
              </svg>
            </div>

            {/* ── MIDGROUND LAYER (Z-5): Mathematical Bodies Orbiting BEHIND Mr. Mohamed Saeed ── */}

            {/* 1. π (Pi) - Upper-Left Orbital Apex: Eccentric Drift (Large Heroic 3D Entity) */}
            <div
              role="button"
              tabIndex={0}
              aria-label="عرض تفاصيل الرمز الرياضي باي π"
              onClick={() => setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "pi") || null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "pi") || null);
                }
              }}
              style={{
                transform: `translate(${mouseOffset.x * 0.7}px, ${mouseOffset.y * 0.7}px)`,
              }}
              className={cn(
                "math-entity-node absolute top-3 left-1 sm:left-4 lg:left-6 z-[5] cursor-pointer group transition-transform duration-300 hover:scale-115 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8FF00] rounded-3xl",
                !reducedMotion && "animate-math-pi"
              )}
              title="π — النسبة التقريبية وحساب المثلثات"
            >
              <div className="math-3d-shape-box relative size-22 sm:size-28 lg:size-32 flex items-center justify-center">
                <div className="math-3d-floor-depth" />
                <div className="math-3d-orbit-ring" />
                <Image
                  src="/images/symbols/pi.png"
                  alt="π Symbol 3D"
                  width={128}
                  height={128}
                  className="object-contain filter drop-shadow-[0_0_22px_rgba(184,255,0,0.32)] group-hover:drop-shadow-[0_0_32px_rgba(184,255,0,0.65)] transition-all pointer-events-none transform-gpu group-hover:scale-105"
                />
              </div>
            </div>

            {/* 2. Σ (Sigma) - Upper-Right Dominant Apex: Majestic Precession (Dominant 3D Entity) */}
            <div
              role="button"
              tabIndex={0}
              aria-label="عرض تفاصيل الرمز الرياضي سيجما Σ"
              onClick={() => setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "sigma") || null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "sigma") || null);
                }
              }}
              style={{
                transform: `translate(${-mouseOffset.x * 0.9}px, ${-mouseOffset.y * 0.9}px)`,
              }}
              className={cn(
                "math-entity-node absolute top-1 right-0 sm:right-2 lg:right-4 z-[5] cursor-pointer group transition-transform duration-300 hover:scale-115 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8FF00] rounded-3xl",
                !reducedMotion && "animate-math-sigma"
              )}
              title="Σ — رمز المجموع والمتسلسلات"
            >
              <div className="math-3d-shape-box relative size-24 sm:size-32 lg:size-36 flex items-center justify-center">
                <div className="math-3d-floor-depth" />
                <div className="math-3d-orbit-ring" />
                <Image
                  src="/images/symbols/sigma.png"
                  alt="Sigma Symbol 3D"
                  width={144}
                  height={144}
                  className="object-contain filter drop-shadow-[0_0_28px_rgba(184,255,0,0.42)] group-hover:drop-shadow-[0_0_38px_rgba(184,255,0,0.7)] transition-all pointer-events-none transform-gpu group-hover:scale-105"
                />
              </div>
            </div>

            {/* 3. f(x) - Mid-Left Coordinate Field: Sinusoidal Wave (Detailed 3D Entity) */}
            <div
              role="button"
              tabIndex={0}
              aria-label="عرض تفاصيل الدالة الرياضية f(x)"
              onClick={() => setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "fx") || null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "fx") || null);
                }
              }}
              style={{
                transform: `translate(${-mouseOffset.x * 0.6}px, ${mouseOffset.y * 0.6}px)`,
              }}
              className={cn(
                "math-entity-node absolute top-[34%] -left-3 sm:left-0 lg:left-2 z-[6] cursor-pointer group transition-transform duration-300 hover:scale-115 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8FF00] rounded-3xl",
                !reducedMotion && "animate-math-fx"
              )}
              title="f(x) — الدوال والنهايات والتحليل"
            >
              <div className="math-3d-shape-box relative size-18 sm:size-22 lg:size-24 flex items-center justify-center">
                <div className="math-3d-floor-depth" />
                <div className="math-3d-orbit-ring" />
                <Image
                  src="/images/symbols/fx.png"
                  alt="f(x) Symbol 3D"
                  width={96}
                  height={96}
                  className="object-contain filter drop-shadow-[0_0_16px_rgba(184,255,0,0.28)] group-hover:drop-shadow-[0_0_26px_rgba(184,255,0,0.6)] transition-all pointer-events-none transform-gpu group-hover:scale-105"
                />
              </div>
            </div>

            {/* ── MAIN SUBJECT (Z-10): Mr. Mohamed Saeed Real Cutout Portrait with Radiant Backlight Halo ── */}
            <div className="relative z-[10] w-72 sm:w-88 lg:w-[27rem] h-88 sm:h-[28rem] lg:h-[34rem] flex items-end justify-center">
              
              {/* Volumetric Radiant Backlight Halo System (Illuminating from Behind the Teacher) */}
              <div className="absolute -inset-6 sm:-inset-12 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(184,255,0,0.42)_0%,rgba(184,255,0,0.18)_42%,transparent_72%)] animate-teacher-glow pointer-events-none -z-10" />
              
              {/* Secondary Concentrated Core Backlight Beam */}
              <div className="absolute inset-x-6 top-8 bottom-6 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(184,255,0,0.65)_0%,rgba(184,255,0,0.25)_40%,transparent_70%)] filter blur-2xl pointer-events-none -z-10" />
              
              {/* Rotating Luminous Coordinate Geometry Ring */}
              <div className="absolute size-[320px] sm:size-[380px] lg:size-[440px] rounded-full border border-[#B8FF00]/30 shadow-[0_0_60px_rgba(184,255,0,0.25)] animate-teacher-halo pointer-events-none -z-10" />

              <Image
                src="/images/teacher.webp"
                alt="مستر محمد سعيد — خبير تدريس الرياضيات لمدارس اللغات والثانوية العامة"
                fill
                priority
                className="object-contain object-bottom filter contrast-[1.05] brightness-[1.02] select-none pointer-events-none drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
                sizes="(max-width: 640px) 288px, (max-width: 1024px) 352px, 432px"
              />
              {/* Natural Base Seamless Fade to Black Floor */}
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
            </div>

            {/* ── BACKGROUND ORBITAL SYMBOLS (Z-5 / Z-6): Mathematical Entities Orbiting Behind Teacher ── */}

            {/* 4. ∫ (Integral) - Lower-Left Orbit Sweeping Behind Instructor */}
            <div
              role="button"
              tabIndex={0}
              aria-label="عرض تفاصيل رمز التكامل ∫"
              onClick={() => setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "integral") || null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "integral") || null);
                }
              }}
              style={{
                transform: `translate(${mouseOffset.x * 1.1}px, ${-mouseOffset.y * 1.1}px)`,
              }}
              className={cn(
                "math-entity-node absolute bottom-4 sm:bottom-8 left-1 sm:left-5 lg:left-8 z-[5] cursor-pointer group transition-transform duration-300 hover:scale-115 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8FF00] rounded-3xl",
                !reducedMotion && "animate-math-integral"
              )}
              title="∫ — حساب التكامل والتطبيقات"
            >
              <div className="math-3d-shape-box relative size-22 sm:size-28 lg:size-32 flex items-center justify-center">
                <div className="math-3d-floor-depth" />
                <div className="math-3d-orbit-ring" />
                <Image
                  src="/images/symbols/integral.png"
                  alt="Integral Symbol 3D"
                  width={128}
                  height={128}
                  className="object-contain filter drop-shadow-[0_0_24px_rgba(184,255,0,0.4)] group-hover:drop-shadow-[0_0_34px_rgba(184,255,0,0.7)] transition-all pointer-events-none transform-gpu group-hover:scale-105"
                />
              </div>
            </div>

            {/* 5. √ (Sqrt) - Mid-Right Orbit Sweeping Behind Instructor */}
            <div
              role="button"
              tabIndex={0}
              aria-label="عرض تفاصيل رمز الجذر التربيعي √"
              onClick={() => setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "sqrt") || null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "sqrt") || null);
                }
              }}
              style={{
                transform: `translate(${-mouseOffset.x * 0.8}px, ${mouseOffset.y * 0.8}px)`,
              }}
              className={cn(
                "math-entity-node absolute top-[32%] -right-2 sm:right-2 lg:right-5 z-[5] cursor-pointer group transition-transform duration-300 hover:scale-115 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8FF00] rounded-3xl",
                !reducedMotion && "animate-math-sqrt"
              )}
              title="√ — الجذور والأعداد المركبة"
            >
              <div className="math-3d-shape-box relative size-18 sm:size-22 lg:size-26 flex items-center justify-center">
                <div className="math-3d-floor-depth" />
                <div className="math-3d-orbit-ring" />
                <Image
                  src="/images/symbols/sqrt.png"
                  alt="Square Root Symbol 3D"
                  width={104}
                  height={104}
                  className="object-contain filter drop-shadow-[0_0_20px_rgba(184,255,0,0.32)] group-hover:drop-shadow-[0_0_30px_rgba(184,255,0,0.65)] transition-all pointer-events-none transform-gpu group-hover:scale-105"
                />
              </div>
            </div>

            {/* 6. x² - Mid-Right Lower Orbit Sweeping Behind Instructor */}
            <div
              role="button"
              tabIndex={0}
              aria-label="عرض تفاصيل القوة والأسس x²"
              onClick={() => setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "x2") || null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "x2") || null);
                }
              }}
              className={cn(
                "math-entity-node absolute bottom-24 sm:bottom-28 right-6 sm:right-12 lg:right-18 z-[6] cursor-pointer group transition-transform duration-300 hover:scale-115 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8FF00] rounded-3xl",
                !reducedMotion && "animate-math-x2"
              )}
              title="x² — المعادلات والقوى والجبر"
            >
              <div className="math-3d-shape-box relative size-18 sm:size-22 lg:size-26 flex items-center justify-center">
                <div className="math-3d-floor-depth" />
                <div className="math-3d-orbit-ring" />
                <Image
                  src="/images/symbols/x2.png"
                  alt="x² Symbol 3D"
                  width={104}
                  height={104}
                  className="object-contain filter drop-shadow-[0_0_20px_rgba(184,255,0,0.35)] group-hover:drop-shadow-[0_0_30px_rgba(184,255,0,0.68)] transition-all pointer-events-none transform-gpu group-hover:scale-105"
                />
              </div>
            </div>

            {/* 7. Δ - Bottom-Right Orbit Sweeping Behind Instructor */}
            <div
              role="button"
              tabIndex={0}
              aria-label="عرض تفاصيل رمز الدلتا والمميز Δ"
              onClick={() => setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "delta") || null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSymbol(MATH_SYMBOLS_3D.find((s) => s.id === "delta") || null);
                }
              }}
              className={cn(
                "math-entity-node absolute bottom-2 sm:bottom-4 right-1 sm:right-4 lg:right-7 z-[5] cursor-pointer group transition-transform duration-300 hover:scale-115 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8FF00] rounded-3xl",
                !reducedMotion && "animate-math-delta"
              )}
              title="Δ — المميز والهندسة الفراغية"
            >
              <div className="math-3d-shape-box relative size-20 sm:size-26 lg:size-30 flex items-center justify-center">
                <div className="math-3d-floor-depth" />
                <div className="math-3d-orbit-ring" />
                <Image
                  src="/images/symbols/delta.png"
                  alt="Delta Symbol 3D"
                  width={120}
                  height={120}
                  className="object-contain filter drop-shadow-[0_0_24px_rgba(184,255,0,0.38)] group-hover:drop-shadow-[0_0_34px_rgba(184,255,0,0.7)] transition-all pointer-events-none transform-gpu group-hover:scale-105"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. COMPLETE EDUCATIONAL ECOSYSTEM ARCHITECTURE
             Academic Stages → Lessons → Practice → Exams → Progress
         ───────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 py-16 max-w-7xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#22262E]">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-[#B8FF00] tracking-tag">ACADEMIC STAGES & CURRICULUM</span>
            <h2 className="type-h2 text-white">المراحل الدراسية ومسارات التعلم</h2>
          </div>
          <p className="type-small font-ui text-[#8E98A5] max-w-md font-normal">
            هيكلة تعليمية متكاملة لمدارس اللغات (<bdi className="bidi-term">English Math</bdi>) تغطي كامل متطلبات الفهم التأسيسي والتطبيقي.
          </p>
        </div>

        {/* Academic Stages Grid with 3D Interactive Hover & Zoom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 [perspective:1000px]">
          {academicStages.map((stage, idx) => (
            <div
              key={stage.id}
              className="relative overflow-hidden rounded-2xl bg-[#0C0E10] border border-[#22262E] hover:border-[#B8FF00] transition-all duration-500 ease-out group shadow-xl hover:shadow-[0_20px_50px_rgba(184,255,0,0.22)] flex flex-col justify-between hover:scale-[1.04] sm:hover:scale-[1.05] hover:-translate-y-2.5 hover:rotate-[0.5deg] z-10 hover:z-20 transform-gpu cursor-pointer"
            >
              {/* Subtle 3D Top Highlight Flare */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B8FF00]/0 group-hover:via-[#B8FF00] to-transparent transition-all duration-500 z-30" />

              {/* Top Dedicated Visual Showcase Frame of Mr. Mohamed Saeed */}
              <div className="relative w-full h-52 sm:h-56 overflow-hidden bg-[#050505]">
                <Image
                  src={stage.image}
                  alt={stage.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                
                {/* Subtle Vignette Gradient for Depth and Clean Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E10] via-transparent to-black/50" />

                {/* Grade Count Pill */}
                <div className="absolute bottom-3 right-3 z-10">
                  <span className="text-[11px] font-semibold font-ui text-[#F4F5F6] bg-[#050505]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#2B313A] group-hover:border-[#B8FF00]/60 shadow-md transition-colors">
                    {stage.count}
                  </span>
                </div>
              </div>

              {/* Card Body Content */}
              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#0C0E10] to-[#0E1115] group-hover:to-[#12161D] transition-colors duration-500">
                <div className="space-y-2">
                  <h3 className="type-h3 text-white group-hover:text-[#B8FF00] transition-colors leading-snug">
                    {stage.title}
                  </h3>
                  <p className="text-xs font-ui text-[#9DA8B6] group-hover:text-[#D0D5DD] leading-relaxed line-clamp-2 transition-colors font-normal">
                    {stage.desc}
                  </p>

                  {/* Branches Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {stage.branches.slice(0, 3).map((branch, bIdx) => (
                      <span key={bIdx} className="text-[10px] font-mono text-[#D0D5DD] group-hover:text-white bg-[#14181E] group-hover:bg-[#1A202A] px-2 py-0.5 rounded border border-[#22262E] group-hover:border-[#B8FF00]/40 transition-colors">
                        {branch}
                      </span>
                    ))}
                    {stage.branches.length > 3 && (
                      <span className="text-[10px] font-mono text-[#B8FF00] bg-[#14181E] px-1.5 py-0.5 rounded border border-[#22262E] group-hover:border-[#B8FF00]/40 transition-colors">
                        +{stage.branches.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: View Details Button & Explore Courses */}
                <div className="pt-4 border-t border-[#22262E] group-hover:border-[#2E3642] flex items-center justify-between gap-2 mt-auto transition-colors font-ui">
                  <button
                    onClick={() => setSelectedStage(stage)}
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#15181C] hover:bg-[#B8FF00] group-hover:bg-[#1A2028] group-hover:hover:bg-[#B8FF00] text-[#D0D5DD] hover:text-[#050505] group-hover:hover:text-[#050505] text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 border border-[#2B313A] group-hover:border-[#B8FF00]/50 hover:border-[#B8FF00] shadow-sm group/btn"
                  >
                    <BookOpen size={14} className="text-[#8E98A5] group-hover/btn:text-[#050505] group-hover:text-[#D0D5DD] transition-colors" />
                    <span>عرض تفاصيل المرحلة</span>
                  </button>

                  <Link
                    href="/courses"
                    className="p-2.5 rounded-xl bg-[#14181E] hover:bg-[#B8FF00] hover:text-[#050505] text-[#8E98A5] group-hover:text-[#D0D5DD] group-hover:hover:text-[#050505] border border-[#22262E] hover:border-[#B8FF00] transition-all duration-300 flex items-center justify-center shrink-0 shadow-sm"
                    title="استعراض المقررات"
                  >
                    <ChevronLeft size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 5 Ecosystem Core Pillars: Smooth Animated Moving Banner */}
        <div className="rounded-2xl bg-[#0C0E10] border border-[#22262E] p-6 sm:p-8 space-y-6 overflow-hidden relative group">
          {/* Ambient subtle glow inside container */}
          <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#B8FF00]/5 blur-3xl pointer-events-none" />

          {/* Banner Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-[#B8FF00] flex items-center gap-2 tracking-tag">
                <span className="size-2 rounded-full bg-[#B8FF00] animate-pulse" />
                THE LEARNING PIPELINE · مسار التميز
              </span>
              <h3 className="type-h3 text-white">منهجية الفهم والاستنتاج في Dros Math</h3>
            </div>
            <span className="text-[11px] font-mono text-[#8E98A5] bg-[#14181E] px-3 py-1 rounded-full border border-[#22262E] self-start sm:self-auto">
              تتحرك تلقائياً · مرر الماوس للتوقف
            </span>
          </div>

          {/* Smooth Continuous Marquee Track from Right to Left */}
          <div className="relative overflow-hidden pt-2" dir="ltr">
            {/* Side Fade Mask Overlays */}
            <div className="pointer-events-none absolute inset-y-0 start-0 w-12 sm:w-20 bg-gradient-to-r from-[#0C0E10] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 end-0 w-12 sm:w-20 bg-gradient-to-l from-[#0C0E10] to-transparent z-10" />

            <div className="pipeline-marquee-track items-stretch gap-4">
              {[
                { num: "01", title: "تأسيس المفاهيم", eng: "Foundation", desc: "استنتاج القوانين وفهم أصل كل نظرية رياضية بلا حفظ أعمى." },
                { num: "02", title: "حل النماذج المعقدة", eng: "Mastery", desc: "تفكيك مسائل امتحانات اللغات المتقدمة بالخطوات الدقيقة." },
                { num: "03", title: "تدريب مستمر", eng: "Practice", desc: "تمارين تطبيقية متدرجة الصعوبة لترسيخ سرعة وبديهة الحل." },
                { num: "04", title: "اختبارات قياسية", eng: "Standardized Exams", desc: "امتحانات إلكترونية دورية مطابقة لمواصفات الورقة الامتحانية." },
                { num: "05", title: "متابعة دقيقة", eng: "Evaluation", desc: "تقارير واضحة لمستوى الطالب ونقاط القوة والمواضيع التي تحتاج مراجعة." },
                { num: "01", title: "تأسيس المفاهيم", eng: "Foundation", desc: "استنتاج القوانين وفهم أصل كل نظرية رياضية بلا حفظ أعمى." },
                { num: "02", title: "حل النماذج المعقدة", eng: "Mastery", desc: "تفكيك مسائل امتحانات اللغات المتقدمة بالخطوات الدقيقة." },
                { num: "03", title: "تدريب مستمر", eng: "Practice", desc: "تمارين تطبيقية متدرجة الصعوبة لترسيخ سرعة وبديهة الحل." },
                { num: "04", title: "اختبارات قياسية", eng: "Standardized Exams", desc: "امتحانات إلكترونية دورية مطابقة لمواصفات الورقة الامتحانية." },
                { num: "05", title: "متابعة دقيقة", eng: "Evaluation", desc: "تقارير واضحة لمستوى الطالب ونقاط القوة والمواضيع التي تحتاج مراجعة." },
              ].map((pillar, pIndex) => (
                <div 
                  key={pIndex} 
                  className="w-[260px] sm:w-[290px] shrink-0 p-4 sm:p-5 rounded-2xl bg-[#14181E] hover:bg-[#1A1F26] border border-[#22262E] hover:border-[#B8FF00]/60 space-y-3 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(184,255,0,0.12)] flex flex-col justify-between"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between font-mono text-xs font-bold">
                    <span className="num-anchor text-[#B8FF00] bg-[#050505] px-2.5 py-1 rounded-lg border border-[#B8FF00]/30 shadow-sm text-sm">
                      {pillar.num}
                    </span>
                    <span className="text-[11px] text-[#8E98A5] font-semibold tracking-tag">{pillar.eng}</span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="type-h3 text-sm sm:text-base text-white">{pillar.title}</h4>
                    <p className="text-xs font-ui text-[#8E98A5] leading-relaxed font-normal">{pillar.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-[#22262E] flex items-center justify-between text-[10px] font-mono text-[#D0D5DD]">
                    <span>Dros Math Method</span>
                    <span className="size-1.5 rounded-full bg-[#B8FF00]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SYMBOL INSPECTION MODAL (Mathematical Inquiry Engine)
         ───────────────────────────────────────────────────────────── */}
      {selectedSymbol && (
        <div className="fixed inset-0 z-50 bg-[#050505]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0C0E10] border border-[#B8FF00]/50 p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#22262E]">
              <div className="flex items-center gap-3">
                <div className="relative size-12 rounded-xl bg-[#050505] border border-[#22262E] flex items-center justify-center overflow-hidden">
                  <Image
                    src={selectedSymbol.imageSrc}
                    alt={selectedSymbol.label}
                    width={44}
                    height={44}
                    className="object-contain drop-shadow-[0_0_10px_rgba(184,255,0,0.5)]"
                  />
                </div>
                <div>
                  <h4 className="type-h3 text-sm text-white">{selectedSymbol.label}</h4>
                  <span className="text-[11px] font-ui text-[#8E98A5]">{selectedSymbol.branch}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSymbol(null)}
                className="size-8 rounded-lg bg-[#15181C] text-[#8E98A5] hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050505] border border-[#22262E] math-medium text-center text-sm font-bold text-[#B8FF00] tracking-wider">
              {selectedSymbol.formula}
            </div>

            <p className="text-xs font-ui leading-relaxed text-[#8E98A5] font-normal">
              {selectedSymbol.desc}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5 font-ui">
              <button
                onClick={() => setSelectedSymbol(null)}
                className="px-4 py-2 rounded-lg bg-[#15181C] text-xs font-semibold text-[#8E98A5] hover:text-white"
              >
                إغلاق
              </button>
              <Link
                href="/courses"
                className="px-4 py-2 rounded-lg bg-[#B8FF00] text-xs font-bold text-[#050505] hover:bg-[#D7FF3F]"
              >
                استعراض الدروس المرتبطة
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4.5. STAGE DETAILS MODAL (تفاصيل الصف والمرحلة الدراسية)
         ───────────────────────────────────────────────────────────── */}
      {selectedStage && (
        <div 
          className="fixed inset-0 z-50 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedStage(null)}
        >
          <div 
            className="relative w-full max-w-2xl rounded-3xl bg-[#0C0E10] border border-[#2B313A] shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Visual Header Showcase */}
            <div className="relative w-full h-56 sm:h-64 bg-[#050505]">
              <Image
                src={selectedStage.image}
                alt={selectedStage.title}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E10] via-[#0C0E10]/50 to-black/60" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedStage(null)}
                className="absolute top-4 left-4 z-20 size-8 rounded-full bg-[#050505]/80 hover:bg-[#B8FF00] text-[#9DA8B6] hover:text-[#050505] transition-all flex items-center justify-center border border-[#2B313A]"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>

              {/* Top Meta Badges */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-[#B8FF00] bg-[#050505]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#B8FF00]/40 shadow-md">
                  {selectedStage.id === "prep" ? "STAGE 01" : selectedStage.id === "sec1_2" ? "STAGE 02" : "STAGE 03"}
                </span>
                <span className="text-xs font-bold text-white bg-[#14181E]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#2B313A]">
                  English Math Specialist
                </span>
              </div>

              {/* Header Title inside Visual */}
              <div className="absolute bottom-4 right-5 left-5 z-10 space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {selectedStage.title}
                </h3>
                <p className="font-mono text-xs text-[#B8FF00] tracking-wide">
                  {selectedStage.engTitle}
                </p>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-7 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-[#14181E] border border-[#22262E]">
                <div className="text-center space-y-0.5">
                  <span className="block text-[11px] text-[#8E98A5]">المحاضرات</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-[#B8FF00]">{selectedStage.stats.lectures}</span>
                </div>
                <div className="text-center space-y-0.5 border-x border-[#22262E]">
                  <span className="block text-[11px] text-[#8E98A5]">الشيتات والمراجعات</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-white">{selectedStage.stats.sheets}</span>
                </div>
                <div className="text-center space-y-0.5">
                  <span className="block text-[11px] text-[#8E98A5]">الاختبارات</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-[#B8FF00]">{selectedStage.stats.exams}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#8E98A5]">نظرة عامة على المرحلة</h4>
                <p className="text-sm text-[#D0D5DD] leading-relaxed">
                  {selectedStage.desc}
                </p>
              </div>

              {/* Grades Included */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#8E98A5]">الصفوف الدراسية المتاحة</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStage.grades.map((grade, gIdx) => (
                    <span 
                      key={gIdx}
                      className="px-3 py-1.5 rounded-xl bg-[#15181C] border border-[#2B313A] text-xs font-medium text-white flex items-center gap-1.5"
                    >
                      <span className="size-1.5 rounded-full bg-[#B8FF00]" />
                      {grade}
                    </span>
                  ))}
                </div>
              </div>

              {/* Branches of Math */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#8E98A5]">فروع الرياضيات المغطاة (Math Branches)</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStage.branches.map((branch, bIdx) => (
                    <span 
                      key={bIdx}
                      className="px-2.5 py-1 rounded-lg bg-[#050505] border border-[#22262E] font-mono text-xs text-[#B8FF00]"
                    >
                      {branch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Methodology & Features */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#8E98A5]">مميزات المنهج والشرح مع مستر محمد سعيد</h4>
                <div className="space-y-2">
                  {selectedStage.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#14181E]/60 border border-[#22262E]">
                      <span className="size-5 rounded-md bg-[#B8FF00]/10 border border-[#B8FF00]/30 text-[#B8FF00] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </span>
                      <p className="text-xs text-[#E8EAED] leading-relaxed">
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 sm:p-6 bg-[#0E1013] border-t border-[#22262E] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#8E98A5] text-center sm:text-right">
                متاح بنك أسئلة واختبارات قياسية لكل درس
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedStage(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#15181C] hover:bg-[#1D2128] text-xs font-bold text-[#8E98A5] hover:text-white border border-[#22262E] transition-colors"
                >
                  إغلاق
                </button>
                <Link
                  href="/courses"
                  onClick={() => setSelectedStage(null)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#B8FF00] hover:bg-[#D7FF3F] text-xs font-black text-[#050505] shadow-[0_0_20px_rgba(184,255,0,0.25)] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>استعراض المقررات والاشتراك</span>
                  <ChevronLeft size={16} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. SEARCH MODAL
         ───────────────────────────────────────────────────────────── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-[#050505]/90 backdrop-blur-md flex items-start justify-center pt-20 p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#0C0E10] border border-[#22262E] p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-[#22262E]">
              <div className="flex items-center gap-2 text-[#B8FF00]">
                <Search size={16} />
                <span className="text-sm font-bold text-white">بحث في محتوى Dros Math</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="size-7 rounded-lg bg-[#15181C] text-[#8E98A5] hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مرحلة دراسية، كورس، أو موضوع..."
              autoFocus
              className="w-full rounded-xl bg-[#050505] border border-[#22262E] px-4 py-3 text-sm text-white placeholder-[#8E98A5] focus:outline-none focus:border-[#B8FF00]"
            />

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#15181C] border border-[#22262E] hover:border-[#B8FF00] transition-colors"
                  >
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[10px] font-mono text-[#B8FF00] bg-[#B8FF00]/10 px-2 py-0.5 rounded">
                      {item.type}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#8E98A5]">
                  لا توجد نتائج مطابقة لبحثك.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
