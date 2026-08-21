"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MATH_SYMBOLS_3D, MathSymbolData } from "@/lib/data/math-symbols";

export { MATH_SYMBOLS_3D };
export type { MathSymbolData };

export interface MathSymbolProps {
  className?: string;
  size?: number | string;
  animate?: boolean;
}

export type MathSymbolId = string;

/** Interactive 3D Math Symbol with Floating, Hover 3D Tilt & Spin on Click */
export function MathSymbolPng({
  id,
  size = 280,
  className,
  animate = true,
  alt,
}: {
  id: string;
  size?: number | string;
  className?: string;
  animate?: boolean;
  alt?: string;
}) {
  const symbol = MATH_SYMBOLS_3D.find((s) => s.id === id) || MATH_SYMBOLS_3D[0];
  const dimension = typeof size === "number" ? `${size}px` : size;

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = boxRef.current;
    if (!el || isSpinning) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 35, y: -y * 35 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isSpinning) {
      setTilt({ x: 0, y: 0 });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinDeg((prev) => prev + 360);
    setTimeout(() => {
      setIsSpinning(false);
    }, 700);
  };

  return (
    <div
      ref={boxRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex items-center justify-center select-none shrink-0 cursor-pointer",
        animate && !isHovered && "animate-float-gentle",
        className
      )}
      style={{
        width: dimension,
        height: dimension,
        perspective: 1000,
      }}
      title="انقر لتدوير الرمز 360°"
    >
      {/* 3D Transform Wrapper */}
      <div
        className="relative size-full rounded-3xl transition-transform"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${tilt.x + spinDeg}deg) rotateX(${tilt.y}deg) scale(${isHovered ? 1.08 : 1})`,
          transition: isSpinning
            ? "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "transform 0.2s ease-out",
        }}
      >
        <Image
          src={symbol.imageSrc}
          alt={alt || symbol.label}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-contain drop-shadow-[0_15px_30px_rgba(132,204,22,0.4)] rounded-3xl"
          priority
        />
      </div>
    </div>
  );
}

/** Individual 3D Symbol PNG Components for direct imports */
export function MathSymbolPi({ className, size = 320, animate = true }: MathSymbolProps) {
  return <MathSymbolPng id="pi" size={size} className={className} animate={animate} alt="3D Pi Symbol" />;
}

export function MathSymbolSigma({ className, size = 320, animate = true }: MathSymbolProps) {
  return <MathSymbolPng id="sigma" size={size} className={className} animate={animate} alt="3D Sigma Symbol" />;
}

export function MathSymbolSqrt({ className, size = 320, animate = true }: MathSymbolProps) {
  return <MathSymbolPng id="sqrt" size={size} className={className} animate={animate} alt="3D Square Root Radical" />;
}

export function MathSymbolFx({ className, size = 320, animate = true }: MathSymbolProps) {
  return <MathSymbolPng id="fx" size={size} className={className} animate={animate} alt="3D f(x) Function Notation" />;
}

export function MathSymbolIntegral({ className, size = 320, animate = true }: MathSymbolProps) {
  return <MathSymbolPng id="integral" size={size} className={className} animate={animate} alt="3D Integral Calculus Symbol" />;
}

export function MathSymbolX2({ className, size = 320, animate = true }: MathSymbolProps) {
  return <MathSymbolPng id="x2" size={size} className={className} animate={animate} alt="3D x² Exponent Algebra" />;
}

export function MathSymbolDelta({ className, size = 320, animate = true }: MathSymbolProps) {
  return <MathSymbolPng id="delta" size={size} className={className} animate={animate} alt="3D Delta Triangle Discriminant" />;
}
