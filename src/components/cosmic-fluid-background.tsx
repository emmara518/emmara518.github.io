"use client";

import React, { useEffect, useState } from "react";

export function CosmicFluidBackground() {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let frameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setMousePos({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      id="cosmic-fluid-universe-background"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* ── SVG Distortion & Displacement Filter Engine ── */}
      <svg className="absolute w-0 h-0 invisible pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="cosmic-fluid-warp" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves="3"
              seed="42"
              result="turbulence"
            >
              <animate
                attributeName="baseFrequency"
                dur="30s"
                values="0.012 0.018; 0.016 0.024; 0.010 0.014; 0.012 0.018"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="26"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacement"
            />
          </filter>

          <filter id="cosmic-ripple-subtle" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.02 0.02"
              numOctaves="2"
              result="noise"
            >
              <animate
                attributeName="seed"
                dur="18s"
                from="1"
                to="100"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="15"
              xChannelSelector="B"
              yChannelSelector="R"
            />
          </filter>
        </defs>
      </svg>

      {/* ── 1. Cosmic Fluid Warp Mesh (Liquid Nebula Layers) ── */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-1000"
        style={{ filter: "url(#cosmic-fluid-warp)" }}
      >
        {/* Swirling Liquid Plasma Orb 1 - Neon Lime Cosmic Fluid */}
        <div
          className="absolute -top-32 -left-32 w-[48rem] h-[48rem] rounded-full bg-gradient-to-br from-lime-500/18 via-emerald-600/10 to-transparent blur-[90px] animate-cosmic-fluid-swirl"
          style={{ animationDuration: "28s" }}
        />

        {/* Swirling Liquid Plasma Orb 2 - Deep Cyan / Electric Ocean */}
        <div
          className="absolute top-1/3 -right-36 w-[52rem] h-[52rem] rounded-full bg-gradient-to-tl from-cyan-500/18 via-teal-600/10 to-transparent blur-[100px] animate-cosmic-fluid-drift"
          style={{ animationDuration: "34s" }}
        />

        {/* Swirling Liquid Plasma Orb 3 - Deep Astral Indigo / Violet */}
        <div
          className="absolute -bottom-40 left-1/4 w-[45rem] h-[45rem] rounded-full bg-gradient-to-tr from-purple-600/15 via-blue-600/10 to-transparent blur-[95px] animate-cosmic-fluid-pulse"
          style={{ animationDuration: "24s" }}
        />

        {/* Swirling Liquid Plasma Orb 4 - Quantum Gold Plasma Fluid */}
        <div
          className="absolute top-2/3 right-1/4 w-[38rem] h-[38rem] rounded-full bg-gradient-to-bl from-amber-500/12 via-rose-500/8 to-transparent blur-[85px] animate-cosmic-fluid-swirl"
          style={{ animationDuration: "38s", animationDirection: "reverse" }}
        />
      </div>

      {/* ── 2. Concentric Spacetime Gravitational Ripples (أمواج الزمكان السائلة) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 mix-blend-screen">
        {/* Ripple Wave 1 */}
        <div className="absolute size-[35rem] rounded-full border border-lime-400/25 animate-spacetime-ripple-1" />
        {/* Ripple Wave 2 */}
        <div className="absolute size-[55rem] rounded-full border border-cyan-400/20 animate-spacetime-ripple-2" />
        {/* Ripple Wave 3 */}
        <div className="absolute size-[75rem] rounded-full border border-indigo-400/15 animate-spacetime-ripple-3" />
        {/* Ripple Wave 4 */}
        <div className="absolute size-[95rem] rounded-full border border-amber-400/10 animate-spacetime-ripple-4" />
      </div>

      {/* ── 3. Subtle Interactive Fluid Flare on Cursor Movement ── */}
      {mousePos && (
        <div
          className="absolute size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-700 ease-out opacity-25 blur-3xl mix-blend-screen"
          style={{
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            background:
              "radial-gradient(circle, rgba(163,230,53,0.18) 0%, rgba(6,182,212,0.14) 40%, rgba(147,51,234,0.06) 70%, transparent 100%)",
          }}
        />
      )}

      {/* ── 4. Spacetime Grid Fluid Warp Overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%)",
        }}
      />
    </div>
  );
}
