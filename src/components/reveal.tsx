"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Scroll reveal — CSS animations ensuring instant readability and smooth entrance. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("reveal reveal-in", className)}
      style={{
        animationDelay: `${delay}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
