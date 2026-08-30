"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * DROS MATH — Architectural Isometric Geometry Icon
 * Precision mathematical polygon crafted with Teal #287F83, Chrome #E6ECEA & Gunmetal #53605E.
 */
export function LogoMark({
  size = 38,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "group relative inline-flex items-center justify-center shrink-0 rounded-lg transition-transform duration-300 hover:scale-105 select-none",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full"
      >
        <defs>
          <linearGradient id="drosCubeTeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3FA4A7" />
            <stop offset="100%" stopColor="#287F83" />
          </linearGradient>
          <linearGradient id="drosCubeChrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6ECEA" />
            <stop offset="100%" stopColor="#A9B3B0" />
          </linearGradient>
          <linearGradient id="drosCubeGunmetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#53605E" />
            <stop offset="100%" stopColor="#222E2B" />
          </linearGradient>
        </defs>

        {/* Outer Isometric Hexagonal Prism */}
        <polygon
          points="22,3 40,13 40,33 22,43 4,33 4,13"
          stroke="#287F83"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="#0F1413"
        />

        {/* Isometric Coordinate Planes */}
        <polygon points="22,3 40,13 22,23 4,13" fill="url(#drosCubeTeal)" fillOpacity="0.18" stroke="#287F83" strokeWidth="0.8" />
        <polygon points="4,13 22,23 22,43 4,33" fill="url(#drosCubeChrome)" fillOpacity="0.08" stroke="#A9B3B0" strokeWidth="0.8" />
        <polygon points="22,23 40,13 40,33 22,43" fill="url(#drosCubeGunmetal)" fillOpacity="0.4" stroke="#53605E" strokeWidth="0.8" />

        {/* Precision Internal Axes */}
        <line x1="22" y1="23" x2="22" y2="43" stroke="#287F83" strokeWidth="1.4" />
        <line x1="22" y1="23" x2="4" y2="13" stroke="#287F83" strokeWidth="1.4" />
        <line x1="22" y1="23" x2="40" y2="13" stroke="#287F83" strokeWidth="1.4" />

        {/* Mathematical Vertex Points */}
        <circle cx="22" cy="3" r="1.5" fill="#287F83" />
        <circle cx="40" cy="13" r="1.5" fill="#287F83" />
        <circle cx="4" cy="13" r="1.5" fill="#287F83" />
        <circle cx="22" cy="23" r="2" fill="#FFFFFF" />
        <circle cx="22" cy="43" r="1.5" fill="#287F83" />
      </svg>
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
      <LogoMark size={compact ? 30 : 36} />
      {!compact && (
        <div className="flex flex-col text-start">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="inline-block border-b-2 border-brand pb-0.5 text-2xl font-black tracking-tight text-white font-mono">
              DROS
            </span>
            <span className="inline-block border-b-2 border-gold pb-0.5 text-2xl font-black tracking-tight text-[#FFC400] font-mono">
              MATH
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 type-subhead-roman">
            <span>ENGLISH MATH · MR. MOHAMED SAEED</span>
          </div>
        </div>
      )}
    </div>
  );
}
