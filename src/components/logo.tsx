import { cn } from "@/lib/utils";

/**
 * DROS MATH UNIVERSE — Monogram & Brand Logo
 * Features the glowing neon Infinity Loop symbol matching the target mockup.
 */
export function LogoMark({ size = 42, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-slate-900/90 p-1.5 shadow-lg border border-slate-700/50 glow-lime",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 50" width="100%" height="100%" fill="none">
        <defs>
          <linearGradient id="infGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
        </defs>
        <path
          d="M 30,25 C 10,25 10,5 30,5 C 50,5 50,45 70,45 C 90,45 90,25 70,25 C 50,25 50,5 30,5 Z"
          stroke="url(#infGlow)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 30,25 C 10,25 10,5 30,5 C 50,5 50,45 70,45 C 90,45 90,25 70,25 C 50,25 50,5 30,5 Z"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeOpacity="0.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function LogoWordmark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3 select-none", className)}>
      <LogoMark />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-black tracking-tight text-ink flex items-center gap-1">
            DROS<span className="text-neon-lime">MATH</span>
          </span>
          <span className="block font-mono text-[9px] font-bold tracking-[0.25em] text-muted uppercase">
            UNIVERSE
          </span>
        </span>
      )}
    </span>
  );
}

