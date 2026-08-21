"use client";

import React, { useState } from "react";

interface FloatingSolid {
  id: string;
  name: string;
  category: string;
  formula: string;
  colorClass: string;
  glowColor: string;
  glowDropShadow: string;
  positionClass: string; // Tailwind positioning across the cover
  animationClass: string;
  sizeClass: string;
  renderIcon: () => React.ReactNode;
}

interface FloatingOperator {
  id: string;
  char: string;
  meaning: string;
  color: string;
  glowColor: string;
  bgAuraColor: string;
  positionClass: string;
  animationClass: string;
  fontSizeClass: string;
}

interface FloatingEquation {
  id: string;
  title: string;
  equation: string;
  positionClass: string;
  animationClass: string;
  colorClass: string;
  borderClass: string;
}

export function TeacherGeometricOrbitals() {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // ── 1. Sacred 3D Polyhedra & Geometric Vectors (Positioned Across Entire Cover) ──
  const coverSolids: FloatingSolid[] = [
    // 1. Tesseract (Top-Left near authority badges)
    {
      id: "solid-tesseract",
      name: "المكعب الفراغي المتداخل (4D Tesseract)",
      category: "الهندسة الفراغية 3D",
      formula: "V = a³ | x² + y² + z² = r²",
      colorClass: "text-neon-lime",
      glowColor: "rgba(163,230,53,0.95)",
      glowDropShadow: "drop-shadow-[0_0_12px_rgba(163,230,53,0.95)] drop-shadow-[0_0_28px_rgba(163,230,53,0.6)]",
      positionClass: "top-6 left-4 sm:left-12 lg:left-8",
      animationClass: "animate-cover-float-1",
      sizeClass: "size-12 sm:size-14",
      renderIcon: () => (
        <svg viewBox="0 0 54 54" className="size-full">
          <defs>
            <linearGradient id="tessTopFull" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a3e635" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="tessFrontFull" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <polygon points="12,12 36,12 44,22 20,22" fill="url(#tessTopFull)" stroke="#a3e635" strokeWidth="1.8" />
          <polygon points="20,22 44,22 44,44 20,44" fill="url(#tessFrontFull)" stroke="#a3e635" strokeWidth="1.8" />
          <polygon points="12,12 20,22 20,44 12,34" fill="none" stroke="#84cc16" strokeWidth="1.6" />
          <polygon points="24,19 36,19 40,24 28,24" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
          <polygon points="28,24 40,24 40,36 28,36" fill="rgba(6,182,212,0.25)" stroke="#22d3ee" strokeWidth="1.5" />
          <line x1="12" y1="12" x2="24" y2="19" stroke="#67e8f9" strokeWidth="1.4" strokeDasharray="2,2" />
          <line x1="36" y1="12" x2="36" y2="19" stroke="#67e8f9" strokeWidth="1.4" strokeDasharray="2,2" />
          <line x1="44" y1="44" x2="40" y2="36" stroke="#67e8f9" strokeWidth="1.4" strokeDasharray="2,2" />
          <line x1="20" y1="44" x2="28" y2="36" stroke="#67e8f9" strokeWidth="1.4" strokeDasharray="2,2" />
          <circle cx="20" cy="22" r="2.5" fill="#bef264" className="drop-shadow-[0_0_8px_#a3e635]" />
          <circle cx="44" cy="22" r="2" fill="#22d3ee" />
        </svg>
      ),
    },

    // 2. Octahedron (Top-Right above stats)
    {
      id: "solid-octahedron",
      name: "المجسم الثماني الكريستالي (Octahedron 3D)",
      category: "الفراغية والمجسمات",
      formula: "A = 2√3 a² | V = (√2/3) a³",
      colorClass: "text-cyan-400",
      glowColor: "rgba(6,182,212,0.95)",
      glowDropShadow: "drop-shadow-[0_0_12px_rgba(6,182,212,0.95)] drop-shadow-[0_0_28px_rgba(6,182,212,0.6)]",
      positionClass: "top-8 right-6 sm:right-16 lg:right-10",
      animationClass: "animate-cover-float-2",
      sizeClass: "size-12 sm:size-14",
      renderIcon: () => (
        <svg viewBox="0 0 54 54" className="size-full">
          <defs>
            <linearGradient id="octaFaceFull1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="octaFaceFull2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <polygon points="27,4 8,27 27,35" fill="url(#octaFaceFull1)" stroke="#22d3ee" strokeWidth="1.8" />
          <polygon points="27,4 46,27 27,35" fill="url(#octaFaceFull2)" stroke="#67e8f9" strokeWidth="2" />
          <polygon points="27,50 8,27 27,35" fill="rgba(8,145,178,0.3)" stroke="#0891b2" strokeWidth="1.8" />
          <polygon points="27,50 46,27 27,35" fill="url(#octaFaceFull1)" stroke="#06b6d4" strokeWidth="1.8" />
          <line x1="8" y1="27" x2="46" y2="27" stroke="#cffafe" strokeWidth="1.4" strokeDasharray="3,2" />
          <circle cx="27" cy="35" r="3" fill="#ecfeff" className="drop-shadow-[0_0_10px_#22d3ee]" />
        </svg>
      ),
    },

    // 3. Golden Ratio Spiral (Bottom-Left near Call to Action)
    {
      id: "solid-golden-spiral",
      name: "النسبة الذهبية وحلزون فيبوناتشي (φ)",
      category: "الجبر والتحليل الهندسي",
      formula: "φ = (1 + √5) / 2 ≈ 1.618",
      colorClass: "text-amber-400",
      glowColor: "rgba(251,191,36,0.95)",
      glowDropShadow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.95)] drop-shadow-[0_0_28px_rgba(251,191,36,0.6)]",
      positionClass: "bottom-12 left-6 sm:left-20 lg:left-14",
      animationClass: "animate-cover-float-3",
      sizeClass: "size-12 sm:size-14",
      renderIcon: () => (
        <svg viewBox="0 0 54 54" className="size-full">
          <defs>
            <linearGradient id="goldTubeCover" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <path d="M 8,8 L 46,8 L 46,46 L 8,46 Z" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3,3" strokeOpacity="0.4" />
          <path
            d="M 27,27 A 3,3 0 0,1 30,30 A 6,6 0 0,1 24,36 A 12,12 0 0,1 12,24 A 24,24 0 0,1 36,0 A 36,36 0 0,1 52,36"
            fill="none"
            stroke="url(#goldTubeCover)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <circle cx="27" cy="27" r="3" fill="#fef08a" className="drop-shadow-[0_0_10px_#fde047]" />
        </svg>
      ),
    },

    // 4. Spatial 3D Vector Basis (Center Upper Atmosphere)
    {
      id: "solid-vector-space",
      name: "منظومة المتجهات الفراغية 3D (î, ĵ, k̂)",
      category: "الجبر الخطي والهندسة التحليلية",
      formula: "u⃗ × v⃗ = |u||v| sinθ n̂",
      colorClass: "text-sky-400",
      glowColor: "rgba(56,189,248,0.95)",
      glowDropShadow: "drop-shadow-[0_0_12px_rgba(56,189,248,0.95)] drop-shadow-[0_0_28px_rgba(56,189,248,0.6)]",
      positionClass: "top-4 left-1/2 -translate-x-1/2 sm:translate-x-8 lg:-translate-x-4",
      animationClass: "animate-cover-float-4",
      sizeClass: "size-12 sm:size-14",
      renderIcon: () => (
        <svg viewBox="0 0 54 54" className="size-full">
          <line x1="27" y1="30" x2="27" y2="6" stroke="#38bdf8" strokeWidth="3.2" strokeLinecap="round" />
          <polygon points="27,2 22,8 32,8" fill="#38bdf8" />
          <line x1="27" y1="30" x2="48" y2="42" stroke="#a3e635" strokeWidth="3.2" strokeLinecap="round" />
          <polygon points="51,44 44,42 47,36" fill="#a3e635" />
          <line x1="27" y1="30" x2="6" y2="42" stroke="#fbbf24" strokeWidth="3.2" strokeLinecap="round" />
          <polygon points="3,44 7,36 10,42" fill="#fbbf24" />
          <circle cx="27" cy="30" r="4.5" fill="#ffffff" className="drop-shadow-[0_0_12px_#ffffff]" />
        </svg>
      ),
    },

    // 5. Geodesic Icosahedron (Bottom-Right corner)
    {
      id: "solid-icosahedron",
      name: "العشريني الهندسي (Icosahedron 3D)",
      category: "حساب المثلثات والمجسمات الفضائية",
      formula: "sin²θ + cos²θ = 1 | e^(iπ) + 1 = 0",
      colorClass: "text-emerald-400",
      glowColor: "rgba(52,211,153,0.95)",
      glowDropShadow: "drop-shadow-[0_0_12px_rgba(52,211,153,0.95)] drop-shadow-[0_0_28px_rgba(52,211,153,0.6)]",
      positionClass: "bottom-8 right-6 sm:right-24 lg:right-16",
      animationClass: "animate-cover-float-1",
      sizeClass: "size-12 sm:size-14",
      renderIcon: () => (
        <svg viewBox="0 0 54 54" className="size-full">
          <polygon points="27,4 47,16 47,38 27,50 7,38 7,16" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1.8" />
          <polygon points="27,14 40,34 14,34" fill="rgba(52,211,153,0.3)" stroke="#34d399" strokeWidth="2" />
          <line x1="27" y1="4" x2="27" y2="14" stroke="#6ee7b7" strokeWidth="1.6" />
          <line x1="47" y1="16" x2="40" y2="34" stroke="#6ee7b7" strokeWidth="1.6" />
          <line x1="7" y1="16" x2="14" y2="34" stroke="#6ee7b7" strokeWidth="1.6" />
          <circle cx="27" cy="14" r="2.8" fill="#ecfdf5" className="drop-shadow-[0_0_8px_#34d399]" />
        </svg>
      ),
    },

    // 6. Delta Tetrahedron (Middle Left between text)
    {
      id: "solid-delta-tetra",
      name: "مثلث دلتا ورباعي السطوح (∆)",
      category: "التفاضل ومعدلات التغير",
      formula: "∆y / ∆x = f'(x) | ∆ = b² - 4ac",
      colorClass: "text-rose-400",
      glowColor: "rgba(251,113,133,0.95)",
      glowDropShadow: "drop-shadow-[0_0_12px_rgba(251,113,133,0.95)] drop-shadow-[0_0_28px_rgba(251,113,133,0.6)]",
      positionClass: "top-1/2 -translate-y-12 left-2 sm:left-4 lg:left-6",
      animationClass: "animate-cover-float-2",
      sizeClass: "size-11 sm:size-13",
      renderIcon: () => (
        <svg viewBox="0 0 54 54" className="size-full">
          <polygon points="27,6 7,44 47,44" fill="none" stroke="#f43f5e" strokeWidth="2" />
          <polygon points="27,6 27,30 7,44" fill="rgba(251,113,133,0.4)" stroke="#fb7185" strokeWidth="1.8" />
          <polygon points="27,6 27,30 47,44" fill="rgba(253,164,175,0.3)" stroke="#fda4af" strokeWidth="1.8" />
          <circle cx="27" cy="6" r="3" fill="#ffe4e6" className="drop-shadow-[0_0_10px_#f43f5e]" />
        </svg>
      ),
    },

    // 7. Infinity Torus Ring (Lower Center Stage)
    {
      id: "solid-infinity",
      name: "حلقة التكامل واللانهاية (∫ & ∞)",
      category: "التفاضل والتكامل المتقدم",
      formula: "∫₋∞⁺∞ e^(-x²) dx = √π",
      colorClass: "text-fuchsia-400",
      glowColor: "rgba(232,121,249,0.95)",
      glowDropShadow: "drop-shadow-[0_0_12px_rgba(232,121,249,0.95)] drop-shadow-[0_0_28px_rgba(232,121,249,0.6)]",
      positionClass: "bottom-4 left-1/2 -translate-x-1/2 sm:translate-x-16 lg:translate-x-0",
      animationClass: "animate-cover-float-3",
      sizeClass: "size-12 sm:size-14",
      renderIcon: () => (
        <svg viewBox="0 0 54 54" className="size-full">
          <defs>
            <linearGradient id="fuchTubeCover" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#86198f" />
            </linearGradient>
          </defs>
          <path
            d="M 16,27 C 16,18 6,18 6,27 C 6,36 16,36 27,27 C 38,18 48,18 48,27 C 48,36 38,36 27,27 Z"
            fill="none"
            stroke="url(#fuchTubeCover)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="16" cy="27" r="3" fill="#fdf4ff" className="drop-shadow-[0_0_8px_#e879f9]" />
          <circle cx="38" cy="27" r="3" fill="#a3e635" className="drop-shadow-[0_0_8px_#a3e635]" />
        </svg>
      ),
    },

    // 8. Radical & Exponent Matrix (Middle Right beside cards)
    {
      id: "solid-radical",
      name: "منظومة الجذور والأسس (√ & ^)",
      category: "الجبر والدوال الأسية",
      formula: "√(x² + y²) | aᵐ · aⁿ = aᵐ⁺ⁿ",
      colorClass: "text-violet-400",
      glowColor: "rgba(167,139,250,0.95)",
      glowDropShadow: "drop-shadow-[0_0_12px_rgba(167,139,250,0.95)] drop-shadow-[0_0_28px_rgba(167,139,250,0.6)]",
      positionClass: "top-1/2 -translate-y-8 right-2 sm:right-4 lg:right-4",
      animationClass: "animate-cover-float-4",
      sizeClass: "size-11 sm:size-13",
      renderIcon: () => (
        <svg viewBox="0 0 54 54" className="size-full">
          <path d="M 6,30 L 14,30 L 22,46 L 36,8 L 50,8" fill="none" stroke="#6d28d9" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 6,28 L 14,28 L 22,44 L 36,6 L 50,6" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <text x="27" y="32" fill="#22d3ee" fontSize="13" fontWeight="900" fontFamily="sans-serif">x</text>
          <text x="36" y="24" fill="#bef264" fontSize="10" fontWeight="900" fontFamily="sans-serif">²</text>
          <circle cx="36" cy="6" r="2.5" fill="#fdf4ff" className="drop-shadow-[0_0_8px_#a78bfa]" />
        </svg>
      ),
    },
  ];

  // ── 2. Floating 3D Glowing Mathematical Operators Across Entire Cover ──
  const coverOperators: FloatingOperator[] = [
    {
      id: "op-plus",
      char: "+",
      meaning: "الجمع والإضافة",
      color: "text-lime-300",
      glowColor: "rgba(190,242,100,0.95)",
      bgAuraColor: "bg-lime-400/25",
      positionClass: "top-12 left-1/4",
      animationClass: "animate-cover-float-1",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-paren-l",
      char: "(",
      meaning: "القوس الأيسر",
      color: "text-cyan-300",
      glowColor: "rgba(103,232,249,0.95)",
      bgAuraColor: "bg-cyan-400/25",
      positionClass: "top-28 left-8 sm:left-32",
      animationClass: "animate-cover-float-2",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-divide",
      char: "/",
      meaning: "القسمة والكسر النسبي",
      color: "text-amber-300",
      glowColor: "rgba(252,211,77,0.95)",
      bgAuraColor: "bg-amber-400/25",
      positionClass: "top-36 left-2/3",
      animationClass: "animate-cover-float-3",
      fontSizeClass: "text-2xl sm:text-3xl",
    },
    {
      id: "op-star",
      char: "*",
      meaning: "الضرب والجداء النجمي",
      color: "text-emerald-300",
      glowColor: "rgba(110,231,183,0.95)",
      bgAuraColor: "bg-emerald-400/25",
      positionClass: "bottom-24 left-1/3",
      animationClass: "animate-cover-float-4",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-root",
      char: "√",
      meaning: "الجذر الرياضي",
      color: "text-lime-400",
      glowColor: "rgba(163,230,53,0.95)",
      bgAuraColor: "bg-lime-500/25",
      positionClass: "top-20 right-1/4",
      animationClass: "animate-cover-float-1",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-pi",
      char: "π",
      meaning: "الثابت باي (3.14159)",
      color: "text-teal-300",
      glowColor: "rgba(94,234,212,0.95)",
      bgAuraColor: "bg-teal-400/25",
      positionClass: "top-1/3 right-12 sm:right-28",
      animationClass: "animate-cover-float-2",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-div-std",
      char: "÷",
      meaning: "القسمة القياسية",
      color: "text-amber-400",
      glowColor: "rgba(251,191,36,0.95)",
      bgAuraColor: "bg-amber-500/25",
      positionClass: "bottom-28 right-1/3",
      animationClass: "animate-cover-float-3",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-times",
      char: "×",
      meaning: "الضرب الاتجاهي",
      color: "text-rose-400",
      glowColor: "rgba(251,113,133,0.95)",
      bgAuraColor: "bg-rose-500/25",
      positionClass: "bottom-16 right-1/4",
      animationClass: "animate-cover-float-4",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-delta",
      char: "∆",
      meaning: "معامل دلتا ومقدار التغير",
      color: "text-fuchsia-400",
      glowColor: "rgba(232,121,249,0.95)",
      bgAuraColor: "bg-fuchsia-500/25",
      positionClass: "top-1/2 left-1/3 -translate-y-24",
      animationClass: "animate-cover-float-1",
      fontSizeClass: "text-2xl sm:text-3xl",
    },
    {
      id: "op-brace-l",
      char: "{",
      meaning: "قوس المجموعات",
      color: "text-sky-300",
      glowColor: "rgba(125,211,252,0.95)",
      bgAuraColor: "bg-sky-400/25",
      positionClass: "bottom-36 left-12 sm:left-24",
      animationClass: "animate-cover-float-2",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-brace-r",
      char: "}",
      meaning: "إغلاق المجموعات",
      color: "text-sky-300",
      glowColor: "rgba(125,211,252,0.95)",
      bgAuraColor: "bg-sky-400/25",
      positionClass: "bottom-36 right-12 sm:right-28",
      animationClass: "animate-cover-float-3",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-equal",
      char: "=",
      meaning: "علامة التساوي الرياضي",
      color: "text-neon-lime",
      glowColor: "rgba(163,230,53,0.95)",
      bgAuraColor: "bg-lime-400/25",
      positionClass: "top-14 right-1/3",
      animationClass: "animate-cover-float-4",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-degree",
      char: "°",
      meaning: "الدرجات والزوايا",
      color: "text-amber-300",
      glowColor: "rgba(252,211,77,0.95)",
      bgAuraColor: "bg-amber-400/25",
      positionClass: "bottom-44 left-1/4",
      animationClass: "animate-cover-float-1",
      fontSizeClass: "text-2xl sm:text-3xl",
    },
    {
      id: "op-caret",
      char: "^",
      meaning: "الرفع للأس والقوى",
      color: "text-purple-300",
      glowColor: "rgba(216,180,254,0.95)",
      bgAuraColor: "bg-purple-400/25",
      positionClass: "top-28 right-1/2",
      animationClass: "animate-cover-float-2",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-percent",
      char: "٪",
      meaning: "النسبة المئوية",
      color: "text-emerald-400",
      glowColor: "rgba(52,211,153,0.95)",
      bgAuraColor: "bg-emerald-400/25",
      positionClass: "bottom-12 left-1/2 -translate-x-32",
      animationClass: "animate-cover-float-3",
      fontSizeClass: "text-2xl sm:text-3xl",
    },
    {
      id: "op-integral",
      char: "∫",
      meaning: "رمز التكامل الحسابي",
      color: "text-fuchsia-300",
      glowColor: "rgba(240,171,252,0.95)",
      bgAuraColor: "bg-fuchsia-400/25",
      positionClass: "top-1/2 right-1/3 translate-y-16",
      animationClass: "animate-cover-float-4",
      fontSizeClass: "text-3xl sm:text-4xl font-serif italic",
    },
    {
      id: "op-infinity",
      char: "∞",
      meaning: "اللانهاية الرياضية",
      color: "text-cyan-400",
      glowColor: "rgba(34,211,238,0.95)",
      bgAuraColor: "bg-cyan-400/25",
      positionClass: "bottom-20 right-1/2 translate-x-32",
      animationClass: "animate-cover-float-1",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
    {
      id: "op-paren-r",
      char: ")",
      meaning: "القوس الأيمن",
      color: "text-cyan-300",
      glowColor: "rgba(103,232,249,0.95)",
      bgAuraColor: "bg-cyan-400/25",
      positionClass: "top-44 right-8 sm:right-20",
      animationClass: "animate-cover-float-2",
      fontSizeClass: "text-3xl sm:text-4xl",
    },
  ];

  // ── 3. Floating Mathematical Equation Badges Across Cover ──
  const coverEquations: FloatingEquation[] = [
    {
      id: "eq-euler",
      title: "متطابقة أويلر",
      equation: "e^(iπ) + 1 = 0",
      positionClass: "top-4 left-1/3 hidden md:flex",
      animationClass: "animate-cover-float-1",
      colorClass: "text-lime-300",
      borderClass: "border-lime-400/40 bg-[#091207]/80",
    },
    {
      id: "eq-gaussian",
      title: "تكامل غاوس",
      equation: "∫₋∞⁺∞ e^(-x²) dx = √π",
      positionClass: "bottom-6 left-1/4 hidden lg:flex",
      animationClass: "animate-cover-float-3",
      colorClass: "text-cyan-300",
      borderClass: "border-cyan-400/40 bg-[#041118]/80",
    },
    {
      id: "eq-limit",
      title: "نهايات الدوال المثلثية",
      equation: "lim(x→0) sin(x)/x = 1",
      positionClass: "top-6 right-1/4 hidden md:flex",
      animationClass: "animate-cover-float-2",
      colorClass: "text-amber-300",
      borderClass: "border-amber-400/40 bg-[#161005]/80",
    },
    {
      id: "eq-pythagoras",
      title: "متطابقة فيثاغورس",
      equation: "sin²θ + cos²θ = 1",
      positionClass: "bottom-8 right-1/3 hidden lg:flex",
      animationClass: "animate-cover-float-4",
      colorClass: "text-fuchsia-300",
      borderClass: "border-fuchsia-400/40 bg-[#14061a]/80",
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* ── Background Constellation Laser Rays & Mesh Grid ── */}
      <svg className="absolute inset-0 size-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="laserLineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="laserLineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Dynamic Vector Lines Connecting Zones Across the Cover */}
        <line x1="8%" y1="12%" x2="45%" y2="8%" stroke="url(#laserLineGrad1)" strokeWidth="1" strokeDasharray="4,4" className="animate-laser-pulse" />
        <line x1="45%" y1="8%" x2="90%" y2="15%" stroke="url(#laserLineGrad1)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="10%" y1="85%" x2="50%" y2="92%" stroke="url(#laserLineGrad2)" strokeWidth="1" strokeDasharray="4,4" className="animate-laser-pulse" />
        <line x1="50%" y1="92%" x2="88%" y2="80%" stroke="url(#laserLineGrad2)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="8%" y1="12%" x2="10%" y2="85%" stroke="url(#laserLineGrad1)" strokeWidth="0.8" strokeDasharray="5,5" opacity="0.4" />
        <line x1="90%" y1="15%" x2="88%" y2="80%" stroke="url(#laserLineGrad2)" strokeWidth="0.8" strokeDasharray="5,5" opacity="0.4" />
      </svg>

      {/* ── 1. Render 3D Floating Polyhedra Across Cover ── */}
      {coverSolids.map((solid) => {
        const isHovered = activeItem === solid.id;

        return (
          <div
            key={solid.id}
            className={`absolute ${solid.positionClass} ${solid.animationClass} pointer-events-auto z-10`}
          >
            <div
              className="relative cursor-pointer group flex items-center justify-center"
              onMouseEnter={() => setActiveItem(solid.id)}
              onMouseLeave={() => setActiveItem(null)}
              onClick={() => setActiveItem(activeItem === solid.id ? null : solid.id)}
            >
              {/* Radial Corona Aura Behind Solid */}
              <div 
                className="absolute size-20 sm:size-24 rounded-full blur-xl pointer-events-none animate-corona-pulse transition-all duration-300 group-hover:opacity-100 group-hover:scale-135"
                style={{
                  background: `radial-gradient(circle, ${solid.glowColor} 0%, rgba(0,0,0,0) 70%)`,
                  opacity: 0.5,
                }}
              />

              {/* 3D Polyhedron Graphic */}
              <div
                className={`relative flex items-center justify-center transition-all duration-300 group-hover:scale-140 ${solid.sizeClass} ${solid.colorClass} ${solid.glowDropShadow}`}
              >
                <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
                  {solid.renderIcon()}
                </div>
              </div>

              {/* Interactive HUD Tooltip on Hover */}
              {isHovered && (
                <div className="absolute z-50 bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 p-3 rounded-xl bg-slate-950/95 border border-lime-400/80 shadow-[0_12px_35px_rgba(0,0,0,0.95),0_0_25px_rgba(163,230,53,0.4)] backdrop-blur-2xl text-center pointer-events-none transition-all animate-in fade-in zoom-in-95">
                  <div className="text-[9px] font-bold text-slate-400 flex items-center justify-center gap-1">
                    <span className="size-1.5 rounded-full bg-neon-lime shadow-[0_0_8px_#a3e635]" />
                    <span>{solid.category}</span>
                  </div>
                  <div className="text-xs font-black text-white mt-1">{solid.name}</div>
                  <div className="mt-1.5 px-2 py-0.5 rounded-md bg-[#0a101d] border border-[#1b2a42] font-mono text-[9px] font-black text-neon-lime truncate shadow-[0_0_10px_rgba(163,230,53,0.2)]">
                    {solid.formula}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── 2. Render 3D Extruded Mathematical Operators Across Cover ── */}
      {coverOperators.map((op) => {
        const isHovered = activeItem === op.id;

        return (
          <div
            key={op.id}
            className={`absolute ${op.positionClass} ${op.animationClass} pointer-events-auto z-10`}
          >
            <div
              className="relative cursor-pointer group flex items-center justify-center"
              onMouseEnter={() => setActiveItem(op.id)}
              onMouseLeave={() => setActiveItem(null)}
              onClick={() => setActiveItem(activeItem === op.id ? null : op.id)}
            >
              {/* Operator Glow Aura */}
              <div 
                className={`absolute size-10 sm:size-12 rounded-full blur-md pointer-events-none transition-all duration-300 group-hover:scale-140 ${op.bgAuraColor}`}
                style={{ opacity: 0.55 }}
              />

              {/* 3D Extruded Mathematical Glyph */}
              <div
                style={{
                  textShadow: `
                    0 1px 0 rgba(255,255,255,0.7),
                    0 2px 0 rgba(0,0,0,0.85),
                    0 3px 0 rgba(0,0,0,0.95),
                    0 5px 8px rgba(0,0,0,0.95),
                    0 0 14px ${op.glowColor},
                    0 0 30px ${op.glowColor},
                    0 0 50px ${op.glowColor}
                  `,
                }}
                className={`block select-none font-black ${op.fontSizeClass} transition-all duration-300 group-hover:scale-145 ${op.color}`}
              >
                {op.char}
              </div>

              {/* Quick Badge Tooltip */}
              {isHovered && (
                <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-slate-950/95 border border-cyan-400/80 shadow-[0_6px_25px_rgba(0,0,0,0.95),0_0_20px_rgba(6,182,212,0.5)] backdrop-blur-xl whitespace-nowrap text-center pointer-events-none transition-all animate-in fade-in zoom-in-95">
                  <span className="font-mono text-sm font-black text-cyan-300 mr-1.5 drop-shadow-[0_0_8px_#22d3ee]">{op.char}</span>
                  <span className="text-xs font-bold text-slate-200">{op.meaning}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── 3. Render Floating Equation Badges Across Cover ── */}
      {coverEquations.map((eq) => (
        <div
          key={eq.id}
          className={`absolute ${eq.positionClass} ${eq.animationClass} pointer-events-auto z-10`}
        >
          <div className={`px-3 py-1 rounded-full border ${eq.borderClass} ${eq.colorClass} backdrop-blur-md text-[10px] sm:text-xs font-mono font-black shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center gap-1.5 transition-all duration-300 hover:scale-110`}>
            <span className="size-1.5 rounded-full bg-current animate-ping" />
            <span className="font-sans font-bold text-slate-400 text-[9px]">{eq.title}:</span>
            <span>{eq.equation}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
