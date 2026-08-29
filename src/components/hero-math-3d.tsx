"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Sparkles,
  RotateCw,
  Play,
  Pause,
  Zap,
  Info,
  Layers,
  GraduationCap,
  Star,
  CheckCircle2,
} from "lucide-react";
import { MATH_SYMBOLS_3D, MathSymbolData } from "@/lib/data/math-symbols";
import { cn } from "@/lib/utils";

export { MATH_SYMBOLS_3D };

export function HeroMath3DUniverse() {
  const [angle, setAngle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [hoveredSymbol, setHoveredSymbol] = useState<MathSymbolData | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; startAngle: number }>({ x: 0, startAngle: 0 });
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Smooth continuous 3D Orbit Animation
  useEffect(() => {
    if (!isPlaying || isDragging) return;

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (time - lastTimeRef.current) / 1000;
        // Rotation speed: ~30 deg/sec at 1x
        setAngle((prev) => (prev + delta * 24 * speedMultiplier) % 360);
      }
      lastTimeRef.current = time;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying, speedMultiplier, isDragging]);

  // 3D Parallax Tilt with Mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current || isDragging) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 22, y: -y * 22 });
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setTilt({ x: 0, y: 0 });
    }
  };

  // Drag to rotate orbit manually
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      startAngle: angle,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    setAngle((dragStartRef.current.startAngle - deltaX * 0.6) % 360);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Calculate 3D Orbit Coordinates for all 7 symbols
  const symbolCount = MATH_SYMBOLS_3D.length;
  // Radius of orbit in pixels
  const rx = 175; // horizontal orbit radius
  const ry = 60;  // vertical orbit tilt radius
  const rz = 150; // depth radius

  const orbitalItems = useMemo(() => {
    return MATH_SYMBOLS_3D.map((symbol, index) => {
      const offsetDeg = (360 / symbolCount) * index;
      const currentDeg = (angle + offsetDeg) % 360;
      const rad = (currentDeg * Math.PI) / 180;

      const x = Math.sin(rad) * rx;
      const y = Math.cos(rad) * ry;
      const z = Math.cos(rad) * rz;

      const isBehind = z < 0;
      // Normalizing scale and opacity based on depth Z
      const normalizedZ = (z + rz) / (2 * rz); // 0 (far back) to 1 (front)
      const scale = 0.72 + normalizedZ * 0.45; // 0.72x to 1.17x
      const opacity = 0.75 + normalizedZ * 0.25; // 0.75 to 1
      const zIndex = isBehind ? 10 : 30;

      return {
        ...symbol,
        x,
        y,
        z,
        scale,
        opacity,
        zIndex,
        isBehind,
        currentDeg,
      };
    });
  }, [angle, symbolCount]);

  return (
    <div className="relative w-full max-w-xl mx-auto select-none" id="hero-3d-math-universe">
      {/* Top Interactive HUD Bar */}
      <div className="mb-3 flex items-center justify-between gap-2 px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-neon-lime" />
          </span>
          <span className="font-mono text-xs font-black text-neon-lime">3D MATH ORBIT SYSTEM</span>
        </div>

        {/* Orbit Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isPlaying ? "إيقاف المدار مؤقتًا" : "تشغيل المدار"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 0.5 : 1))}
            className="px-2 py-1 rounded-xl font-mono text-[10px] font-bold text-neon-lime hover:bg-slate-800 transition-colors"
            title="تغيير السرعة"
          >
            {speedMultiplier}x
          </button>
          <button
            type="button"
            onClick={() => setAngle((prev) => (prev + 90) % 360)}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="تدوير ربع دورة"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Main 3D Orbit Stage */}
      <div
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative aspect-square w-full rounded-[2.5rem] bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-4 border border-slate-800/80 shadow-2xl glow-lime overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          perspective: 1200,
        }}
      >
        {/* Background Coordinate Hologram Grid */}
        <div className="absolute inset-0 math-grid-pattern opacity-25 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

        {/* Orbit Rings (3D Ellipses in Background) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: rx * 2 + 50,
            height: ry * 2 + 50,
            transform: `rotateX(${65 + tilt.y * 0.3}deg) rotateZ(${-15 + tilt.x * 0.2}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <div className="size-full rounded-full border border-yellow-400/20 shadow-[0_0_20px_rgba(255,196,0,0.15)] border-dashed animate-spin-slow" />
          <div className="absolute inset-4 rounded-full border border-teal-400/15 border-dotted" />
        </div>

        {/* 3D Transformed Center Stage */}
        <div
          className="relative size-full flex items-center justify-center"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            transition: isDragging ? "none" : "transform 0.25s ease-out",
          }}
        >
          {/* ─── 1. Background Orbiting Symbols (Passing Behind Teacher: z < 0) ─── */}
          {orbitalItems
            .filter((item) => item.isBehind)
            .map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredSymbol(item)}
                onMouseLeave={() => setHoveredSymbol(null)}
                className="absolute flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-125 select-none"
                style={{
                  transform: `translate3d(${item.x}px, ${item.y}px, ${item.z}px) scale(${item.scale})`,
                  zIndex: item.zIndex,
                  opacity: item.opacity,
                  filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.6)) drop-shadow(0 0 12px rgba(255,196,0,0.25))",
                }}
              >
                <div className="relative size-14 sm:size-16 flex items-center justify-center pointer-events-none">
                  <Image
                    src={item.imageSrc}
                    alt={item.label}
                    fill
                    sizes="64px"
                    className="object-contain filter drop-shadow-[0_0_12px_rgba(255,196,0,0.3)] transition-all pointer-events-none"
                  />
                </div>
                <span className="mt-0.5 font-mono text-[9px] font-bold text-yellow-300/80 drop-shadow">
                  {item.glyph}
                </span>
              </div>
            ))}

          {/* ─── 2. Center Focal Point: Mr. Mohamed Saeed (Teacher) ─── */}
          <div
            className="relative z-20 flex flex-col items-center justify-center pointer-events-auto"
            style={{
              transform: "translateZ(10px)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Holographic Glowing Base Pedestal */}
            <div className="absolute -bottom-6 w-56 h-12 rounded-full bg-gradient-to-r from-yellow-500/30 via-yellow-400/50 to-yellow-500/30 blur-md pointer-events-none" />

            {/* Teacher Image Container */}
            <div className="relative size-56 sm:size-64 rounded-3xl border-2 border-yellow-400/40 bg-gradient-to-b from-slate-800/80 via-slate-900 to-slate-950 p-1.5 shadow-[0_20px_50px_rgba(255,196,0,0.3)] overflow-hidden group">
              <div className="relative size-full rounded-2xl overflow-hidden">
                <Image
                  src="/images/assets/teacher.webp"
                  alt="أستاذ محمد سعيد — خبير تدريس الرياضيات"
                  fill
                  priority
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                {/* Dark Vignette at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              </div>

              {/* Floating Verified Badge */}
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-slate-950/90 border border-yellow-400/50 px-2 py-0.5 shadow-lg backdrop-blur-md">
                <CheckCircle2 size={12} className="text-neon-lime" />
                <span className="text-[10px] font-black text-neon-lime">معتمد</span>
              </div>
            </div>

            {/* Teacher Floating Name Plate */}
            <div
              className="mt-2.5 rounded-2xl bg-slate-900/95 border border-yellow-400/40 px-4 py-2 text-center backdrop-blur-md shadow-xl"
              style={{ transform: "translateZ(30px)" }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <GraduationCap size={14} className="text-neon-lime" />
                <h3 className="text-sm sm:text-base font-black text-white">أ/ محمد سعيد</h3>
              </div>
              <p className="text-[11px] font-bold text-slate-300 mt-0.5">
                خبير تدريس الرياضيات للمرحلتين الإعدادية والثانوية
              </p>
            </div>
          </div>

          {/* ─── 3. Foreground Orbiting Symbols (Passing in Front of Teacher: z >= 0) ─── */}
          {orbitalItems
            .filter((item) => !item.isBehind)
            .map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredSymbol(item)}
                onMouseLeave={() => setHoveredSymbol(null)}
                className="absolute flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-135 group select-none"
                style={{
                  transform: `translate3d(${item.x}px, ${item.y}px, ${item.z}px) scale(${item.scale})`,
                  zIndex: item.zIndex,
                  opacity: item.opacity,
                  filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.7)) drop-shadow(0 0 25px rgba(255,196,0,0.55))",
                }}
              >
                {/* Pure 3D Floating Symbol (No Box/Card Background) */}
                <div className="relative size-16 sm:size-20 flex items-center justify-center pointer-events-none">
                  {/* Atmospheric Glow behind the 3D symbol */}
                  <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl opacity-60 group-hover:opacity-100 group-hover:bg-yellow-400/35 transition-all duration-300 pointer-events-none" />
                  <Image
                    src={item.imageSrc}
                    alt={item.label}
                    fill
                    sizes="96px"
                    className="object-contain filter drop-shadow-[0_0_16px_rgba(255,196,0,0.45)] group-hover:drop-shadow-[0_0_28px_rgba(255,196,0,0.85)] transition-all pointer-events-none transform-gpu group-hover:scale-110"
                  />
                </div>
                <span className="mt-0.5 font-mono text-[10px] font-black text-[#FFC400] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-yellow-400/30">
                  {item.glyph}
                </span>
              </div>
            ))}
        </div>

        {/* Drag Hint on Bottom */}
        <div className="absolute bottom-2 inset-x-0 text-center text-[10px] text-slate-400 font-medium pointer-events-none flex items-center justify-center gap-1">
          <Sparkles size={11} className="text-neon-lime animate-spin-slow" />
          <span>اسحب بالماوس للتدوير الحر ثلاثي الأبعاد</span>
        </div>
      </div>

      {/* Dynamic Hover / Active Concept Inspector Card */}
      <div className="mt-3 rounded-2xl border border-line bg-surface p-3.5 shadow-lg transition-all">
        {hoveredSymbol ? (
          <div className="flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative size-11 rounded-xl bg-slate-900 border border-yellow-400/60 p-1 shrink-0">
                <Image
                  src={hoveredSymbol.imageSrc}
                  alt={hoveredSymbol.label}
                  fill
                  sizes="44px"
                  className="object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-neon-lime">{hoveredSymbol.glyph}</span>
                  <span className="text-xs font-bold text-ink">{hoveredSymbol.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-muted">{hoveredSymbol.branch}</span>
              </div>
            </div>
            <div className="text-left font-mono text-xs font-black text-neon-lime bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
              {hoveredSymbol.formula.split("·")[0]}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between font-mono text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="text-neon-lime font-bold">DEMO ACCESS</span>
              <span className="text-slate-300">student@dros-math.com / 12345678</span>
            </div>
            <span className="text-emerald-400 font-bold text-[11px]">متاح للتجربة فوراً</span>
          </div>
        )}
      </div>
    </div>
  );
}
