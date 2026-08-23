"use client";

import React, { useEffect, useState } from "react";

/**
 * Precision Mathematical Background:
 * Coordinate axes, engineered grid lines, concentric geometric orbital curves.
 * Palette: Carbon #050505, Graphite #15181C, Subdued Grid lines, Chrome / Neon Lime accents.
 */
export function CosmicFluidBackground() {
  return (
    <div
      id="math-precision-universe-background"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#050505]"
    >
      {/* ── 1. Coordinate Grid System (Mathematical Engineering Paper) ── */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #B8FF00 1px, transparent 1px),
            linear-gradient(to bottom, #B8FF00 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Sub-grid with fine 12px division */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #FFFFFF 1px, transparent 1px),
            linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)
          `,
          backgroundSize: "12px 12px",
        }}
      />

      {/* ── 2. Structural Coordinate Axes & Origin Marks ── */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="math-origin-dots" x="0" y="0" width="192" height="192" patternUnits="userSpaceOnUse">
            <circle cx="96" cy="96" r="1.5" fill="#B8FF00" opacity="0.6" />
            <line x1="90" y1="96" x2="102" y2="96" stroke="#B8FF00" strokeWidth="0.5" opacity="0.4" />
            <line x1="96" y1="90" x2="96" y2="102" stroke="#B8FF00" strokeWidth="0.5" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#math-origin-dots)" />
      </svg>

      {/* ── 3. Mathematical Elliptical Orbit Paths (Engineered Geometry) ── */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-30">
        <svg width="800" height="800" viewBox="0 0 800 800" fill="none">
          <ellipse
            cx="400"
            cy="400"
            rx="360"
            ry="180"
            stroke="#B8FF00"
            strokeWidth="0.75"
            strokeDasharray="4 6"
            className="animate-spin-slow origin-center"
            opacity="0.5"
          />
          <ellipse
            cx="400"
            cy="400"
            rx="280"
            ry="120"
            stroke="#E8EAED"
            strokeWidth="0.6"
            strokeDasharray="2 4"
            className="animate-reverse-spin origin-center"
            opacity="0.3"
          />
          <circle cx="400" cy="400" r="220" stroke="#343940" strokeWidth="0.5" opacity="0.4" />
        </svg>
      </div>

      {/* ── 4. Precision Focal Vignette ── */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#050505]/60 to-[#050505] pointer-events-none" />
    </div>
  );
}
