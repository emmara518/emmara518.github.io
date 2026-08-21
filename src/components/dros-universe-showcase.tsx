"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Compass,
  BookOpen,
  FlaskConical,
  Swords,
  Users,
  Building2,
  Moon,
  Search,
  Bell,
  User,
  ArrowRight,
  Play,
  Flame,
  Fingerprint,
  Sparkles,
  Video,
  ClipboardCheck,
  HeartHandshake,
  Star,
  Pi,
  Menu,
  X,
  ChevronLeft,
  GraduationCap,
  Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TeacherGeometricOrbitals } from "./teacher-geometric-orbitals";

/**
 * ─────────────────────────────────────────────────────────────
 * DROS MATH UNIVERSE — 10-YEAR SENIOR MOBILE-FIRST ARCHITECTURE
 * - Mobile (<lg): Ultra-compact hero, horizontal snap roadmap,
 *   segmented dashboard widget, sticky thumb-friendly dock & drawer
 * - Desktop (lg+): Full cyber sidebar and 3-column bento showcase
 * ─────────────────────────────────────────────────────────────
 */
export function DrosUniverseShowcase() {
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoadmap, setActiveRoadmap] = useState<number>(0);
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);
  const [activeMobileCard, setActiveMobileCard] = useState<"mission" | "engine" | "laws">("mission");

  const navItems = [
    { id: "home", label: "الرئيسية", icon: Home, href: "/" },
    { id: "journey", label: "رحلتك", icon: Compass, href: "/dashboard/journey" },
    { id: "courses", label: "الكورسات", icon: BookOpen, href: "/courses" },
    { id: "labs", label: "المعامل", icon: FlaskConical, href: "/dashboard/labs" },
    { id: "arena", label: "الساحة", icon: Swords, href: "/dashboard/arena" },
    { id: "community", label: "المجتمع", icon: Users, href: "/dashboard/community" },
    { id: "laws", label: "القوانين", icon: Pi, href: "/dashboard/formulas" },
    { id: "museum", label: "المتحف", icon: Building2, href: "/dashboard/museum" },
  ];

  const roadmapItems = [
    {
      id: "01",
      title: "التأسيس",
      sub: "Foundation",
      color: "#eab308",
      type: "saturn",
      badge: "البداية",
    },
    {
      id: "02",
      title: "الإعدادي",
      sub: "Preparatory",
      color: "#06b6d4",
      type: "polyhedron",
      badge: "مكتمل",
    },
    {
      id: "03",
      title: "الثانوي",
      sub: "Secondary",
      color: "#a855f7",
      type: "mobius",
      badge: "نشط الآن",
    },
    {
      id: "04",
      title: "المراجعات",
      sub: "Revision",
      color: "#f97316",
      type: "galaxy",
      badge: "مكثف",
    },
    {
      id: "05",
      title: "الامتحانات",
      sub: "Exams",
      color: "#ec4899",
      type: "target",
      badge: "نهائي",
    },
  ];

  const mathLaws = [
    { id: "pythagoras", title: "فيثاغورس", symbol: "△", formula: "a² + b² = c²" },
    { id: "functions", title: "الدوال", symbol: "f(x)", formula: "y = ax + b" },
    { id: "limits", title: "النهايات", symbol: "lim", formula: "lim[x→a] f(x)" },
    { id: "derivative", title: "المشتقة", symbol: "d/dx", formula: "f'(x) = dy/dx" },
    { id: "integral", title: "التكامل", symbol: "∫", formula: "∫ f(x) dx" },
    { id: "probability", title: "الاحتمالات", symbol: "🔒", formula: "P(A∪B)", locked: true },
  ];

  return (
    <div className="min-h-screen bg-[#04060b] text-slate-100 selection:bg-lime-400 selection:text-black font-sans antialiased overflow-x-hidden pb-16 lg:pb-0">
      {/* ─────────────────────────────────────────────────────────────
          MOBILE TOP APP BAR (< lg)
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#070b13]/95 backdrop-blur-xl border-b border-[#131b2c] px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-lime-400/10 border border-lime-400/50 flex items-center justify-center text-neon-lime font-black text-xs shadow-[0_0_10px_rgba(163,230,53,0.3)]">
            DM
          </div>
          <div>
            <span className="font-black text-white text-sm tracking-tight leading-none block">
              DROS<span className="text-neon-lime">MATH</span>
            </span>
            <span className="font-mono text-[8px] font-bold text-slate-400 tracking-widest block">
              UNIVERSE
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/60 text-neon-lime text-xs font-black"
          >
            <User size={12} />
            <span>دخول</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="size-9 rounded-xl bg-[#0c1220] border border-[#182338] text-slate-200 flex items-center justify-center"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE DRAWER MODAL (< lg)
         ───────────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-between p-5 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[#182338]">
            <div className="flex items-center gap-2">
              <span className="text-neon-lime font-black text-lg">DROS MATH</span>
              <span className="text-[10px] text-slate-400 font-mono">v3.0</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="size-8 rounded-full bg-[#131b2c] flex items-center justify-center text-slate-300"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="grid grid-cols-2 gap-2.5 my-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#0c1220] border border-[#182338] text-slate-200 text-xs font-bold active:bg-lime-400 active:text-black transition-colors"
                >
                  <Icon size={16} className="text-neon-lime shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 pt-4 border-t border-[#182338]">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-neon-lime text-slate-950 font-black text-xs shadow-lg shadow-lime-500/20"
            >
              <span>ابدأ رحلتك الآن مجاناً</span>
              <ArrowRight size={14} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OUTER LAYOUT: Desktop Sidebar + Main Container
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* DESKTOP CYBER SIDEBAR (Hidden on Mobile) */}
        <aside className="hidden lg:flex w-44 xl:w-48 bg-[#070b13] border-l border-[#131b2c] flex-col justify-between p-3.5 z-40 shrink-0 select-none">
          <div>
            {/* Top Brand Logo */}
            <div className="mb-6 px-1 pt-2">
              <Link href="/" className="group block">
                <div className="text-xl xl:text-2xl font-black tracking-tight text-white leading-none">
                  <span className="text-neon-lime block text-xl xl:text-2xl">DROS</span>
                  <span className="text-white block text-lg xl:text-xl -mt-1 tracking-wider font-extrabold">MATH</span>
                </div>
                <span className="font-mono text-[9px] font-bold text-slate-400 tracking-[0.25em] block mt-1">
                  UNIVERSE
                </span>
              </Link>
            </div>

            {/* Vertical Menu */}
            <nav className="space-y-1.5" aria-label="شريط التنقل الجانبي">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 text-right group cursor-pointer",
                      isActive
                        ? "bg-[#111a14] border border-lime-400/80 text-neon-lime shadow-[0_0_15px_rgba(163,230,53,0.25)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1220] border border-transparent"
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        "transition-transform group-hover:scale-110",
                        isActive ? "text-neon-lime" : "text-slate-400"
                      )}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Lower Sidebar Items */}
          <div className="space-y-3 pt-4 border-t border-[#131b2c] mt-4">
            <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0c1220] border border-[#182338] text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <Moon size={14} className="text-neon-lime" />
                <span>الوضع الليلي</span>
              </span>
              <div className="size-2 rounded-full bg-neon-lime animate-pulse" />
            </div>

            {/* Black Hole Swirl CTA */}
            <div className="relative overflow-hidden rounded-2xl border border-lime-500/30 bg-gradient-to-b from-[#0e1726] to-[#080d16] p-3 text-center group">
              <div className="absolute -top-10 -right-10 size-28 rounded-full bg-lime-500/20 blur-xl group-hover:scale-125 transition-transform" />
              <div className="relative z-10">
                <p className="text-[11px] font-black text-slate-200">جاهز ترفع مستواك؟</p>
                <p className="text-[9px] font-bold text-neon-lime mt-0.5">ابدأ رحلتك الآن</p>
                <Link
                  href="/register"
                  className="mt-2 inline-flex size-7 rounded-full bg-neon-lime text-slate-950 items-center justify-center hover:bg-lime-300 hover:scale-110 transition-all shadow-md"
                >
                  <ArrowRight size={13} className="rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* ─────────────────────────────────────────────────────────────
            MAIN STAGE CONTENT AREA (Mobile Optimized)
           ───────────────────────────────────────────────────────────── */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden p-3 sm:p-5 lg:p-7 space-y-4 sm:space-y-6">
          {/* Desktop Top Header Bar (Hidden on Mobile) */}
          <header className="hidden lg:flex items-center justify-between gap-4 pb-2 border-b border-[#131b2c]/80">
            <nav className="flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-300">
              <Link href="/about" className="hover:text-neon-lime transition-colors">عن المنصة</Link>
              <Link href="/features" className="hover:text-neon-lime transition-colors">المميزات</Link>
              <Link href="/parents" className="hover:text-neon-lime transition-colors">للأولياء الأمور</Link>
              <Link href="/pricing" className="hover:text-neon-lime transition-colors">الأسعار</Link>
              <Link href="/contact" className="hover:text-neon-lime transition-colors">تواصل معنا</Link>
            </nav>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="size-9 rounded-full bg-[#0c1220] border border-[#182338] text-slate-300 hover:text-white flex items-center justify-center"
                title="بحث"
              >
                <Search size={15} />
              </button>

              <button
                type="button"
                className="relative size-9 rounded-full bg-[#0c1220] border border-[#182338] text-slate-300 hover:text-white flex items-center justify-center"
                title="الإشعارات"
              >
                <Bell size={15} />
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-400 text-[9px] font-black text-black flex items-center justify-center">
                  3
                </span>
              </button>

              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full border border-lime-400/80 bg-lime-500/10 px-4 py-1.5 text-xs font-black text-neon-lime hover:bg-lime-400 hover:text-black transition-all shadow-[0_0_12px_rgba(163,230,53,0.2)]"
              >
                <User size={13} />
                <span>تسجيل الدخول</span>
              </Link>
            </div>
          </header>

          {/* ─────────────────────────────────────────────────────────────
              1. HERO SECTION: Mr. Mohamed Saeed as the Grand Hero
             ───────────────────────────────────────────────────────────── */}
          <section className="relative rounded-3xl bg-gradient-to-b from-[#080d19] via-[#060a12] to-[#04070d] border border-lime-400/30 p-5 sm:p-8 lg:p-10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(163,230,53,0.12)]">
            {/* Ambient Background & Sacred Math Grid */}
            <div className="absolute inset-0 math-grid-pattern opacity-20 pointer-events-none" />
            <div className="absolute top-10 left-1/2 -translate-x-1/2 size-[36rem] rounded-full bg-lime-500/12 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-10 size-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            {/* Full-Cover Floating 3D Geometric Solids & Mathematical Universe Animation */}
            <TeacherGeometricOrbitals />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              {/* ── Left Column: Master Brand & Value Proposition (5 Cols) ── */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-6 text-start order-2 lg:order-1">
                {/* Authority Top Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/40 text-neon-lime text-xs font-black shadow-[0_0_15px_rgba(163,230,53,0.2)] backdrop-blur-md">
                  <GraduationCap size={15} />
                  <span>المنصة الرسمية للأستاذ محمد سعيد</span>
                  <span className="size-1.5 rounded-full bg-neon-lime animate-ping" />
                </div>

                {/* Primary Master Headline */}
                <div className="space-y-1 select-none">
                  <div className="text-xs sm:text-sm font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>خبير مادة الرياضيات للثانوية العامة</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black text-white tracking-tight leading-tight">
                    مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-neon-lime to-emerald-400 drop-shadow-[0_0_30px_rgba(163,230,53,0.4)]">م/ محمد سعيد</span>
                  </h1>
                  <div className="text-2xl sm:text-4xl xl:text-5xl font-black text-slate-200">
                    الرياضيات <span className="text-neon-lime underline decoration-lime-400/50 decoration-wavy decoration-2">فهم وإبداع</span> مش حفظ.
                  </div>
                </div>

                {/* Authority Bio Subtitle */}
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-medium max-w-lg">
                  رحلة تعليمية تفاعلية تحول أصعب نظريات ومسائل الجبر، التفاضل والتكامل، والهندسة الفراغية إلى أفكار بديهية واضحة تضمن لك التفوق والدرجة النهائية.
                </p>

                {/* Quick Trust Highlights */}
                <div className="grid grid-cols-3 gap-2.5 py-1">
                  <div className="rounded-2xl bg-[#0b1220]/80 border border-[#1a2942] p-2.5 text-center backdrop-blur-sm">
                    <span className="block font-mono text-base sm:text-lg font-black text-neon-lime">+15 سنة</span>
                    <span className="text-[10px] font-bold text-slate-400">خبرة تدريس</span>
                  </div>
                  <div className="rounded-2xl bg-[#0b1220]/80 border border-[#1a2942] p-2.5 text-center backdrop-blur-sm">
                    <span className="block font-mono text-base sm:text-lg font-black text-amber-400">+25,000</span>
                    <span className="text-[10px] font-bold text-slate-400">طالب متفوق</span>
                  </div>
                  <div className="rounded-2xl bg-[#0b1220]/80 border border-[#1a2942] p-2.5 text-center backdrop-blur-sm">
                    <span className="block font-mono text-base sm:text-lg font-black text-cyan-400">99.4%</span>
                    <span className="text-[10px] font-bold text-slate-400">نسبة النجاح</span>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2.5 rounded-full bg-neon-lime px-6 sm:px-7 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(163,230,53,0.45)] hover:bg-lime-300 hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>ابدأ مع مستر محمد الآن</span>
                    <span className="flex size-5 items-center justify-center rounded-full bg-slate-950 text-neon-lime">
                      <ArrowRight size={12} className="rtl:rotate-180" />
                    </span>
                  </Link>

                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0c1424] border border-[#1e2d4a] px-5 py-3 text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:border-lime-400/50 transition-colors"
                  >
                    <Play size={13} fill="currentColor" className="text-neon-lime" />
                    <span>استكشف كورسات المنهج</span>
                  </Link>
                </div>
              </div>

              {/* ── Center/Hero Focus: Mr. Mohamed Saeed Grand Visual Stage (4.5 Cols) ── */}
              <div className="lg:col-span-4 relative flex items-center justify-center order-1 lg:order-2 select-none">
                {/* 1. Grand Multi-layered Eye-Catching Aura & Halo Glow behind Teacher */}
                {/* Intense Core Neon Backlight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 sm:size-96 rounded-full bg-radial from-lime-400/45 via-lime-500/25 to-transparent blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
                
                {/* Secondary Cyan/Emerald Atmospheric Halo */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 sm:size-[28rem] rounded-full bg-radial from-cyan-400/30 via-emerald-500/15 to-transparent blur-[70px] pointer-events-none" />

                {/* Vertical Light Sunburst Behind Teacher Silhouette */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-80 bg-gradient-to-b from-lime-300/35 via-lime-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />

                {/* Ground Stage Light & Pedestal Radiance */}
                <div className="absolute -bottom-6 w-full h-28 bg-gradient-to-t from-lime-400/50 via-lime-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-2 w-4/5 h-10 bg-cyan-400/35 rounded-full blur-lg pointer-events-none" />

                {/* Subtle Geometric Halo Atmosphere */}
                <div className="absolute size-80 sm:size-[26rem] rounded-full bg-radial from-lime-500/20 via-transparent to-transparent blur-3xl pointer-events-none" />

                {/* Teacher Name Signature Pill */}
                <div className="absolute bottom-20 -right-2 font-sans text-xs font-black text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] z-20 pointer-events-none rotate-[-4deg]">
                  مستر محمد سعيد ✍️
                </div>

                {/* Grand Teacher Portrait Hero - Pure Organic Seamless Cutout without Box / Border */}
                <div className="relative z-10 w-72 sm:w-88 lg:w-[26rem] h-84 sm:h-[28rem] lg:h-[31rem] flex items-end justify-center">
                  <div className="relative w-full h-full flex items-end justify-center group">
                    <Image
                      src="/images/teacher.webp"
                      alt="أستاذ محمد سعيد — خبير تدريس الرياضيات للثانوية العامة"
                      fill
                      priority
                      className="object-contain object-bottom filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)] brightness-[1.04] contrast-[1.06] transition-transform duration-700 group-hover:scale-105 select-none pointer-events-none"
                      sizes="(max-width: 768px) 320px, 440px"
                    />

                    {/* Integrated Vignette & Ground Fade so no harsh cutoffs at the base */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#060a12] via-[#060a12]/70 to-transparent pointer-events-none" />

                    {/* Teacher Identity Floating Badge */}
                    <div className="absolute -bottom-2 inset-x-2 sm:inset-x-6 z-20 rounded-2xl bg-slate-950/90 border border-[#1f304e] p-2.5 sm:p-3 backdrop-blur-xl flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-lime-400/15 border border-lime-400/70 flex items-center justify-center text-neon-lime text-xs font-black shadow-[0_0_10px_rgba(163,230,53,0.3)]">
                          MS
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1">
                            <span>أ/ محمد سعيد</span>
                            <span className="text-neon-lime text-xs font-bold">✓</span>
                          </div>
                          <span className="text-[9px] font-semibold text-slate-400">كبير معلمي الرياضيات للثانوية العامة</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
                          <span>★ 4.98</span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-mono">+10k طالب</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Teacher Stats & Student Passport (2.5 - 3 Cols) ── */}
              <div className="lg:col-span-3 space-y-3.5 order-3">
                {/* Card 1: Student Math ID */}
                <div className="rounded-2xl border border-lime-500/30 bg-[#090e18]/90 p-4 space-y-3 backdrop-blur-md shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-mono text-[8px] font-bold text-slate-400">بطاقة الطالب الذكية</span>
                      <span className="font-mono text-xs sm:text-sm font-black text-white">MATH PASSPORT</span>
                    </div>
                    <div className="size-8 rounded-full bg-lime-500/15 border border-lime-400/60 flex items-center justify-center text-neon-lime shadow-[0_0_10px_rgba(163,230,53,0.3)]">
                      <Fingerprint size={16} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-300">مستوى الإتقان</span>
                      <span className="font-mono text-neon-lime">المستوى 27 (72%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#131d2e] overflow-hidden">
                      <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-lime-500 to-neon-lime shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl bg-[#0c1424] border border-[#1b2842] p-2">
                      <div className="size-6 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                        <Flame size={12} className="fill-amber-400" />
                      </div>
                      <div className="truncate">
                        <span className="block font-mono text-[7px] text-slate-400">حماس مستمر</span>
                        <span className="text-[10px] font-black text-white truncate">12 يوم 🔥</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl bg-[#0c1424] border border-[#1b2842] p-2">
                      <div className="size-6 rounded-lg bg-lime-500/15 border border-lime-400/40 flex items-center justify-center text-neon-lime shrink-0">
                        <Pi size={12} />
                      </div>
                      <div className="truncate">
                        <span className="block font-mono text-[7px] text-slate-400">المسار النشط</span>
                        <span className="text-[10px] font-black text-neon-lime truncate">التفاضل</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-lime-400/80 bg-lime-500/10 py-2 text-xs font-black text-neon-lime hover:bg-lime-400 hover:text-black transition-all"
                  >
                    <User size={12} />
                    <span>لوحة تحكم الطالب</span>
                  </Link>
                </div>

                {/* Card 2: Teacher Live Q&A Room Widget */}
                <div className="rounded-2xl border border-[#1b2842] bg-[#070c16] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-white flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                      حصص البث التفاعلي
                    </span>
                    <span className="text-[10px] text-neon-lime font-mono">Live Session</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    مراجعة حل مسائل النهايات والتفاضل المتقدمة مع أ/ محمد سعيد مباشرة.
                  </p>
                  <Link
                    href="/live"
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0e1726] border border-[#223352] text-[11px] font-bold text-slate-200 hover:border-lime-400/50 hover:text-neon-lime transition-all"
                  >
                    <span className="flex items-center gap-1.5">
                      <Video size={13} className="text-neon-lime" />
                      <span>جدول الحصص المباشرة</span>
                    </span>
                    <ChevronLeft size={13} />
                  </Link>
                </div>
              </div>

            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              2. ROADMAP TRACK: رحلتك في عالم الرياضيات (Touch-Swipeable on Mobile)
             ───────────────────────────────────────────────────────────── */}
          <section className="rounded-2xl sm:rounded-3xl border border-[#131b2c] bg-[#070c16] p-3.5 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <span className="text-neon-lime font-bold text-sm">♾</span>
                <h2 className="text-sm sm:text-base font-black text-white">رحلتك في عالم الرياضيات</h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                المرحلة {activeRoadmap + 1} من 5
              </span>
            </div>

            {/* Horizontal Snap Scroll on Mobile / 5-Col Grid on Desktop */}
            <div className="flex sm:grid sm:grid-cols-5 gap-2.5 overflow-x-auto pb-1.5 sm:pb-0 scroll-smooth snap-x snap-mandatory no-scrollbar">
              {roadmapItems.map((item, idx) => {
                const isActive = activeRoadmap === idx;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveRoadmap(idx)}
                    className={cn(
                      "flex-shrink-0 w-36 sm:w-auto snap-center relative flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center cursor-pointer transition-all duration-200 select-none",
                      isActive
                        ? "bg-[#0d1627] border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.2)] scale-[1.02]"
                        : "bg-[#090f1d] border-[#152033] hover:border-slate-600 hover:bg-[#0c1424]"
                    )}
                  >
                    <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className="text-slate-300">{item.id}</span>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.2 rounded-full",
                        isActive ? "bg-lime-400 text-black font-black" : "text-slate-500"
                      )}>
                        {item.badge}
                      </span>
                    </div>

                    <div className="my-2 size-10 sm:size-12 flex items-center justify-center">
                      {item.type === "saturn" && (
                        <div className="size-7 rounded-full bg-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                      )}
                      {item.type === "polyhedron" && (
                        <div className="size-8 text-cyan-400 font-mono font-black text-xl">⬡</div>
                      )}
                      {item.type === "mobius" && (
                        <span className="text-2xl font-black text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]">
                          ♾
                        </span>
                      )}
                      {item.type === "galaxy" && (
                        <div className="size-7 rounded-full bg-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.8)] animate-pulse" />
                      )}
                      {item.type === "target" && (
                        <div className="size-7 rounded-full border-2 border-pink-500 flex items-center justify-center">
                          <div className="size-2 rounded-full bg-pink-400" />
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-black text-white">{item.title}</span>
                    <span className="font-mono text-[8px] text-slate-400 font-semibold">{item.sub}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              3. DASHBOARD CARDS (Segmented Tab Bar on Mobile / 3-Cols on Desktop)
             ───────────────────────────────────────────────────────────── */}
          <div className="lg:hidden flex items-center justify-between bg-[#070c16] border border-[#131b2c] p-1 rounded-2xl">
            <button
              onClick={() => setActiveMobileCard("mission")}
              className={cn(
                "flex-1 py-2 text-[11px] font-black rounded-xl transition-all",
                activeMobileCard === "mission"
                  ? "bg-lime-400 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              مهمتك الحالية
            </button>
            <button
              onClick={() => setActiveMobileCard("engine")}
              className={cn(
                "flex-1 py-2 text-[11px] font-black rounded-xl transition-all",
                activeMobileCard === "engine"
                  ? "bg-lime-400 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              محرك الفهم 82%
            </button>
            <button
              onClick={() => setActiveMobileCard("laws")}
              className={cn(
                "flex-1 py-2 text-[11px] font-black rounded-xl transition-all",
                activeMobileCard === "laws"
                  ? "bg-lime-400 text-black shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              القوانين (6)
            </button>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* ── Card 1: مهمتك الحالية ── */}
            <div className={cn(
              "rounded-2xl sm:rounded-3xl border border-[#131b2c] bg-[#070c16] p-4 sm:p-5 space-y-3 shadow-xl flex flex-col justify-between",
              activeMobileCard !== "mission" && "hidden lg:flex"
            )}>
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="text-slate-200 font-extrabold">مهمتك الحالية</span>
                  <span className="font-mono text-neon-lime text-[11px]">MISSION 07</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">التفاضل والتكامل</h3>
                <span className="font-mono text-[9px] text-slate-400 font-bold block">CALCULUS</span>

                <div className="flex items-center gap-2.5 mt-2.5 text-[9px] sm:text-[10px] font-bold text-slate-300">
                  <div className="flex items-center gap-1">
                    <Video size={11} className="text-neon-lime" />
                    <span>28 درس</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClipboardCheck size={11} className="text-cyan-400" />
                    <span>12 امتحان</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame size={11} className="text-amber-400" />
                    <span>08 تحديات</span>
                  </div>
                </div>

                <div className="relative my-2.5 h-16 sm:h-20 w-full rounded-xl bg-[#04070d] border border-[#152033] p-1.5 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-1 left-2 font-mono text-[9px] text-pink-400 font-bold">dy/dx</div>
                  <svg viewBox="0 0 200 50" className="w-full h-full stroke-pink-500 fill-none stroke-[1.5]">
                    <path d="M 10 38 Q 60 8 100 32 T 190 15" stroke="#a855f7" strokeWidth="2" />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="font-mono text-neon-lime font-black">72%</span>
                  <div className="h-1.5 w-32 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-[72%] bg-neon-lime rounded-full" />
                  </div>
                </div>
              </div>

              <Link
                href="/courses"
                className="mt-2 flex items-center justify-center gap-1.5 w-full rounded-xl border border-lime-400/80 bg-lime-500/10 py-2 text-xs font-black text-neon-lime hover:bg-neon-lime hover:text-black transition-all"
              >
                <span>تابع المهمة</span>
                <ArrowRight size={12} className="rtl:rotate-180" />
              </Link>
            </div>

            {/* ── Card 2: MATH ENGINE محرك فهمك الذكي ── */}
            <div className={cn(
              "rounded-2xl sm:rounded-3xl border border-[#131b2c] bg-[#070c16] p-4 sm:p-5 space-y-3 shadow-xl flex flex-col justify-between",
              activeMobileCard !== "engine" && "hidden lg:flex"
            )}>
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="text-slate-200 font-extrabold">MATH ENGINE</span>
                  <span className="text-neon-lime font-bold text-[11px]">محرك فهمك الذكي</span>
                </div>

                <div className="flex items-center gap-3.5 my-2">
                  <div className="relative size-16 rounded-full border-4 border-cyan-400 flex flex-col items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)] shrink-0">
                    <span className="font-mono text-lg font-black text-white">82%</span>
                    <span className="text-[7px] font-bold text-slate-300">الفهم</span>
                  </div>

                  <div className="flex-1 space-y-1 text-[10px] font-bold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">الجبر</span>
                      <span className="font-mono text-emerald-400">90%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[90%] h-full bg-emerald-400" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">الدوال</span>
                      <span className="font-mono text-neon-lime">85%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-neon-lime" />
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#0c1424] border border-[#1b2842] flex items-center justify-between text-[10px] font-bold">
                  <span className="text-amber-400">يحتاج تعزيز:</span>
                  <span className="text-slate-200">التكامل (45%)</span>
                </div>
              </div>

              <button
                type="button"
                className="mt-2 flex items-center justify-center gap-1.5 w-full rounded-xl border border-lime-400/60 bg-[#0d1626] py-2 text-xs font-black text-neon-lime hover:bg-lime-500/20 transition-all cursor-pointer"
              >
                <Sparkles size={12} className="text-neon-lime" />
                <span>توصيات الذكاء الاصطناعي</span>
              </button>
            </div>

            {/* ── Card 3: القوانين التي أتقنتها ── */}
            <div className={cn(
              "rounded-2xl sm:rounded-3xl border border-[#131b2c] bg-[#070c16] p-4 sm:p-5 space-y-3 shadow-xl flex flex-col justify-between",
              activeMobileCard !== "laws" && "hidden lg:flex"
            )}>
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="text-slate-200 font-extrabold">القوانين المتقنة</span>
                  <Pi size={13} className="text-neon-lime" />
                </div>

                <div className="grid grid-cols-3 gap-1.5 my-2">
                  {mathLaws.map((law) => (
                    <div
                      key={law.id}
                      onClick={() => setSelectedLaw(law.id)}
                      className={cn(
                        "rounded-xl border p-1.5 text-center cursor-pointer transition-all hover:scale-105",
                        law.locked
                          ? "bg-[#080d16] border-[#152033] opacity-60"
                          : "bg-[#0a1120] border-lime-400/40 hover:border-lime-400 hover:bg-[#0e192e]"
                      )}
                    >
                      <div className="font-mono text-xs font-black text-neon-lime">
                        {law.symbol}
                      </div>
                      <span className="block text-[8px] font-bold text-slate-300 truncate">
                        {law.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/dashboard/formulas"
                className="mt-2 flex items-center justify-center gap-1.5 w-full rounded-xl border border-lime-400/80 bg-lime-500/5 py-2 text-xs font-black text-neon-lime hover:bg-neon-lime hover:text-black transition-all"
              >
                <Pi size={12} />
                <span>بنك القوانين</span>
              </Link>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              4. BOTTOM STATS RIBBON
             ───────────────────────────────────────────────────────────── */}
          <section className="rounded-2xl sm:rounded-3xl border border-[#131b2c] bg-[#070c16] p-3 sm:p-4 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 text-center divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[#131b2c]">
              <div className="pt-1.5 sm:pt-0">
                <div className="flex items-center justify-center gap-1 text-neon-lime mb-0.5">
                  <Users size={14} />
                  <span className="font-mono text-base sm:text-lg font-black text-white">+120K</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">طالب نشط</span>
              </div>

              <div className="pt-1.5 sm:pt-0">
                <div className="flex items-center justify-center gap-1 text-neon-lime mb-0.5">
                  <Video size={14} />
                  <span className="font-mono text-base sm:text-lg font-black text-white">+2500</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">ساعة شرح</span>
              </div>

              <div className="pt-1.5 sm:pt-0">
                <div className="flex items-center justify-center gap-1 text-cyan-400 mb-0.5">
                  <ClipboardCheck size={14} />
                  <span className="font-mono text-base sm:text-lg font-black text-white">+8000</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">امتحان محلول</span>
              </div>

              <div className="pt-1.5 sm:pt-0">
                <div className="flex items-center justify-center gap-1 text-neon-lime mb-0.5">
                  <HeartHandshake size={14} />
                  <span className="font-mono text-base sm:text-lg font-black text-white">98%</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">نسبة الرضا</span>
              </div>

              <div className="pt-1.5 sm:pt-0 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                  <Star size={14} className="fill-amber-400" />
                  <span className="font-mono text-base sm:text-lg font-black text-white">4.9/5</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">تقييم الطلاب</span>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STICKY MOBILE BOTTOM THUMB DOCK (< lg)
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#070b13]/95 backdrop-blur-xl border-t border-[#131b2c] px-3 py-1.5 flex items-center justify-around">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-neon-lime">
          <Home size={18} />
          <span className="text-[9px] font-black">الرئيسية</span>
        </Link>
        <Link href="/courses" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200">
          <BookOpen size={18} />
          <span className="text-[9px] font-bold">الكورسات</span>
        </Link>
        <Link href="/dashboard/labs" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200">
          <FlaskConical size={18} />
          <span className="text-[9px] font-bold">المعامل</span>
        </Link>
        <Link href="/dashboard/arena" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200">
          <Swords size={18} />
          <span className="text-[9px] font-bold">الساحة</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200">
          <User size={18} />
          <span className="text-[9px] font-bold">حسابي</span>
        </Link>
      </div>
    </div>
  );
}

