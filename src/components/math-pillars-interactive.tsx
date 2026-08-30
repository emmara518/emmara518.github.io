"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { RotateCcw, Sparkles, Info, RefreshCw } from "lucide-react";
import { MATH_SYMBOLS_3D, MathSymbolData } from "@/lib/data/math-symbols";
import { cn } from "@/lib/utils";

/**
 * Individual Interactive 3D Math Pillar Card
 * Supports:
 * - Ambient floating & gentle animation
 * - Instant hover 3D tilt & dynamic light follow
 * - Click to trigger 360° spin
 * - Click & Drag to freely rotate the 3D symbol on X and Y axes
 * - Modal inspection
 */
function PillarCard({
  item,
  onSelect,
}: {
  item: MathSymbolData;
  onSelect: (item: MathSymbolData) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const dragStartRef = useRef<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: 0,
    startRotY: 0,
  });

  // Handle Mouse Move for 3D Tilt when hovering
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || isSpinning) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;

    setRotY(deltaX * 35); // Rotate around Y axis
    setRotX(-deltaY * 35); // Rotate around X axis
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isDragging && !isSpinning) {
      setRotX(0);
      setRotY(0);
    }
  };

  // Pointer Drag to Rotate
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY,
    };
    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setRotY(dragStartRef.current.startRotY + deltaX * 1.1);
    setRotX(dragStartRef.current.startRotX - deltaY * 1.1);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Trigger quick 360 spin on click
  const triggerSpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinAngle((prev) => prev + 360);
    setTimeout(() => {
      setIsSpinning(false);
    }, 700);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-3 sm:p-3.5 text-center select-none cursor-grab active:cursor-grabbing transition-all duration-300 hover:border-yellow-400 hover:bg-surface2 hover:shadow-[0_15px_35px_rgba(255,196,0,0.25)] overflow-hidden",
        isDragging && "border-yellow-400 bg-surface2 shadow-2xl scale-[1.03]"
      )}
      style={{
        perspective: 900,
      }}
    >
      {/* Top Action Controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        <button
          type="button"
          onClick={triggerSpin}
          title="تدوير 360°"
          className="rounded-lg bg-slate-900/80 p-1.5 text-muted hover:text-neon-lime hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className={cn("size-3.5", isSpinning && "animate-spin")} />
        </button>
      </div>

      {/* 3D Symbol Stage - Fills Card Top Half */}
      <div className="relative w-full aspect-square rounded-xl bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-transparent border border-slate-800/40 p-2 flex items-center justify-center overflow-hidden mb-2">
        {/* 3D Interactive Rotating Symbol Container with floating animation when not hovered */}
        <div
          className={cn(
            "relative size-full flex items-center justify-center",
            !isHovered && !isDragging && "animate-float-gentle"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotX}deg) rotateY(${rotY + spinAngle}deg) scale(${isHovered ? 1.08 : 1})`,
            transition: isDragging
              ? "none"
              : isSpinning
              ? "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "transform 0.22s ease-out",
          }}
        >
          {/* Glowing aura under the symbol */}
              <div className="absolute inset-2 rounded-full bg-yellow-400/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="relative size-full flex items-center justify-center p-1">
            <Image
              src={item.imageSrc}
              alt={item.label}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 180px"
              className="object-contain drop-shadow-[0_12px_24px_rgba(255,196,0,0.35)] pointer-events-none rounded-xl"
              priority={false}
            />
          </div>
        </div>

        {/* Drag Helper Tip on Hover */}
        <div className="absolute bottom-1.5 inset-x-0 text-center text-xs text-yellow-400/90 font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          اسحب للتدوير 3D
        </div>
      </div>

      {/* Pillar Info */}
      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-black text-ink group-hover:text-neon-lime transition-colors">
          {item.label.split("—")[0].trim()}
        </h3>
        <span className="block text-xs font-bold text-muted truncate">
          {item.branch}
        </span>

        {/* Formula Button / Click Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
          }}
          className="mt-1.5 flex items-center justify-center gap-1 w-full rounded-lg bg-slate-900/70 border border-slate-700/60 px-2 py-1.5 text-xs font-mono font-semibold text-slate-200 hover:text-neon-lime hover:border-yellow-400/80 transition-colors cursor-pointer"
        >
          <Sparkles className="size-2.5 text-neon-lime shrink-0" />
          <span className="truncate">{item.formula.split("·")[0]}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Main Interactive Math Pillars Section
 */
export function MathPillarsInteractive() {
  const [selectedSymbol, setSelectedSymbol] = useState<MathSymbolData | null>(null);
  const [modalRotY, setModalRotY] = useState(0);
  const [modalRotX, setModalRotX] = useState(0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="type-eyebrow-display">3D MATHEMATICAL PILLARS</span>
            <span className="inline-flex items-center rounded-full bg-yellow-500/15 border border-yellow-400/40 px-2.5 py-0.5 text-xs font-black text-neon-lime">
              تفاعلي 3D حر
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-ink mt-1">ركائز الرياضيات وفروع المنهج</h2>
        </div>
        <p className="text-sm font-medium text-slate-300 max-w-md">
          حرّك الماوس فوق الرموز أو اسحبها لتدويرها 3D في الفراغ، واضغط على أي رمز لفتحه واستكشاف قوانينه بالتفصيل.
        </p>
      </div>

      {/* 7 Pillars Grid / Mobile Horizontal Snap Track */}
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-7 gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scroll-smooth snap-x snap-mandatory no-scrollbar">
        {MATH_SYMBOLS_3D.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-36 sm:w-auto snap-center">
            <PillarCard item={item} onSelect={setSelectedSymbol} />
          </div>
        ))}
      </div>

      {/* Detail Modal / Drawer for active symbol inspection */}
      {selectedSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-yellow-500/50 bg-slate-950 p-6 shadow-2xl overflow-hidden"
            style={{ perspective: 1000 }}
          >
            {/* Ambient Background Lights */}
            <div className="absolute top-0 right-0 size-60 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 size-60 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedSymbol(null)}
              className="absolute top-4 left-4 z-10 size-8 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-neon-lime uppercase">
                {selectedSymbol.branch}
              </span>
            </div>
            <h3 className="mt-1 text-2xl font-black text-white">{selectedSymbol.label}</h3>

            {/* Large 3D Rotating Preview in Modal */}
            <div
              className="relative my-6 size-52 mx-auto flex items-center justify-center cursor-grab active:cursor-grabbing"
              onPointerMove={(e) => {
                if (e.buttons === 1) {
                  setModalRotY((prev) => prev + e.movementX * 1.2);
                  setModalRotX((prev) => prev - e.movementY * 1.2);
                }
              }}
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${modalRotX}deg) rotateY(${modalRotY}deg)`,
                transition: "transform 0.08s ease-out",
              }}
            >
              <div className="absolute inset-4 rounded-full bg-yellow-400/25 blur-2xl pointer-events-none" />
              <Image
                src={selectedSymbol.imageSrc}
                alt={selectedSymbol.label}
                fill
                sizes="208px"
                className="object-contain drop-shadow-[0_20px_35px_rgba(255,196,0,0.45)] pointer-events-none"
              />
            </div>

            <div className="text-center text-xs text-slate-300 mb-4 flex items-center justify-center gap-1.5 font-semibold">
              <Info className="size-3.5 text-neon-lime" />
              <span>اضغط واسحب بالماوس للتدوير الحر في جميع الاتجاهات</span>
            </div>

            {/* Formula Block */}
            <div className="rounded-2xl border border-line bg-surface/80 p-4 font-mono text-center mb-4">
              <span className="block text-xs text-muted font-bold mb-1">الصيغة الرياضية والقانون الأساسي</span>
              <span className="text-base sm:text-lg font-black text-neon-lime tracking-wide dir-ltr inline-block">
                {selectedSymbol.formula}
              </span>
            </div>

            {/* Concept Description */}
            <p className="text-base text-slate-200 leading-relaxed text-center mb-6 font-medium">
              {selectedSymbol.desc}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalRotY((prev) => prev + 360);
                }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>تدوير كامل 360°</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSymbol(null)}
                className="flex-1 rounded-xl bg-neon-lime px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-yellow-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
