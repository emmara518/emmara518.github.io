"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * DROS MATH UNIVERSE — 3D Rendered PNG Brand Identity
 */
export function LogoMark({
  size = 46,
  className,
  showGlow = true,
}: {
  size?: number;
  className?: string;
  showGlow?: boolean;
}) {
  return (
    <span
      className={cn(
        "group relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-1 shadow-2xl transition-all duration-300 hover:scale-105 border border-slate-700/60 hover:border-lime-400/80 cursor-pointer overflow-hidden",
        showGlow && "shadow-[0_0_25px_rgba(163,230,53,0.25)] hover:shadow-[0_0_35px_rgba(163,230,53,0.45)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Background Micro Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#84cc16_1px,transparent_1px)] [background-size:8px_8px] opacity-20 pointer-events-none" />

      {/* Cyber Specular Light Streak on Hover */}
      <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine pointer-events-none transition-opacity" />

      {/* 3D Rendered Brand Icon PNG */}
      <div className="relative size-full overflow-hidden rounded-xl">
        <Image
          src="/images/math_logo_3d.png"
          alt="Dros Math 3D Logo"
          fill
          sizes="96px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority
        />
      </div>
    </span>
  );
}

export function LogoWordmark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("group inline-flex items-center gap-3 select-none", className)}>
      <LogoMark size={46} />
      {!compact && (
        <div className="flex flex-col text-start">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xl font-black tracking-tight text-ink group-hover:text-white transition-colors">
              DROS
            </span>
            <span className="relative text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-lime-300 to-cyan-400 drop-shadow-[0_0_12px_rgba(163,230,53,0.4)]">
              MATH
            </span>
            <span className="inline-flex items-center rounded-md bg-lime-500/15 border border-lime-400/40 px-1.5 py-0.5 font-mono text-[10px] font-black text-neon-lime">
              3D
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.28em] text-muted group-hover:text-slate-300 transition-colors uppercase">
            <span className="size-1 rounded-full bg-neon-lime animate-pulse" />
            <span>UNIVERSE · منصة الرياضيات</span>
          </div>
        </div>
      )}
    </div>
  );
}
