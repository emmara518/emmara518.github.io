import Link from "next/link";
import { BookOpen, CirclePlay as PlayCircle, Clock } from "lucide-react";
import { Badge, Card } from "./ui";
import { formatDuration, formatEGP, hueFromId } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Mathematical visual language (pure SVG/CSS)
   ───────────────────────────────────────────── */

/** Full-bleed animated math canvas: grid, drawn curves, orbit, cube, operators. */
export function MathCanvas({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {/* coordinate grid */}
      <div className="grid-paper-lg fade-mask-b absolute inset-0" />

      {/* glow orbs */}
      <div className="orb size-[34rem] -top-40 -start-40 bg-[var(--hero-glow-1)]" />
      <div className="orb size-[28rem] bottom-0 -end-32 bg-[var(--hero-glow-2)]" />

      {/* axes */}
      <svg className="absolute inset-0 h-full w-full opacity-70" preserveAspectRatio="none" viewBox="0 0 1200 800">
        <line x1="0" y1="640" x2="1200" y2="640" stroke="var(--grid-line)" strokeWidth="1.5" />
        <line x1="200" y1="0" x2="200" y2="800" stroke="var(--grid-line)" strokeWidth="1.5" />
        {/* parabola — draws itself */}
        <path
          d="M 40 180 Q 200 700 420 170"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-draw"
          style={{ ["--dash" as string]: 900 }}
        />
        {/* sine wave — drifting dashed */}
        <path
          d="M 480 520 q 60 -130 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-drift"
        />
        {/* tangent line */}
        <line x1="60" y1="340" x2="430" y2="120" stroke="var(--grid-line)" strokeWidth="1.5" className="animate-drift" />
        <circle cx="255" cy="222" r="5" fill="var(--gold)" className="animate-pulse-soft" />
        {/* asymptote circle */}
        <circle cx="960" cy="250" r="120" fill="none" stroke="var(--brand)" strokeWidth="1.4" opacity="0.5" className="animate-drift" />
        <circle cx="960" cy="250" r="70" fill="none" stroke="var(--gold)" strokeWidth="1.2" opacity="0.45" className="animate-drift" />
      </svg>

      {/* orbiting conic + cube */}
      <div className="absolute end-[6%] top-[16%] hidden lg:block">
        <div className="cube-scene relative">
          <div className="cube" style={{ ["--cube-size" as string]: "170px" }}>
            <div className="cube-face" />
            <div className="cube-face" />
            <div className="cube-face" />
            <div className="cube-face" />
            <div className="cube-face" />
            <div className="cube-face" />
          </div>
          <span className="absolute -inset-10 -z-10 rounded-full border border-[var(--gold)]/30" style={{ animation: "orbit-rotate 26s linear infinite" }} />
        </div>
      </div>

      {/* floating operators */}
      {[
        { s: "∫", cls: "start-[8%] top-[22%]", d: "0s" },
        { s: "Σ", cls: "start-[16%] bottom-[24%]", d: "1.2s" },
        { s: "π", cls: "end-[30%] top-[12%]", d: "0.6s" },
        { s: "Δ", cls: "start-[46%] top-[8%]", d: "1.8s" },
        { s: "√", cls: "end-[14%] bottom-[18%]", d: "0.9s" },
        { s: "θ", cls: "start-[38%] bottom-[12%]", d: "1.5s" },
      ].map((op) => (
        <span
          key={op.s}
          className={cn(
            "animate-float absolute font-mono text-3xl font-semibold text-brand/35 select-none",
            op.cls,
          )}
          style={{ animationDelay: op.d }}
        >
          {op.s}
        </span>
      ))}
    </div>
  );
}

/** Infinite equation ticker. */
export function EquationMarquee() {
  const eqs = [
    "d/dx (xⁿ) = n·xⁿ⁻¹",
    "∫ eˣ dx = eˣ + C",
    "جا²θ + جتا²θ = ١",
    "أ² + ب² = ج²",
    "e^{iπ} + 1 = 0",
    "Δ = ب² − 4أج",
    "س = (−ب ± √Δ) ÷ 2أ",
    "نها (sin س ÷ س) = 1 عندما س ← 0",
  ];
  const row = [...eqs, ...eqs];
  return (
    <div className="relative overflow-hidden border-y border-line bg-surface/50 py-3.5" dir="ltr" aria-hidden>
      <div className="marquee-track items-center gap-10">
        {row.map((e, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-sm text-muted">
            <span className="whitespace-nowrap">{e}</span>
            <span className="size-1.5 rounded-full bg-gold/60" />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-e from-bg to-transparent" style={{ background: "linear-gradient(to left, transparent, var(--bg))" }} />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-24" style={{ background: "linear-gradient(to right, transparent, var(--bg))" }} />
    </div>
  );
}

/* ── section heading ── */
export function SectionHead({
  kicker,
  title,
  sub,
  align = "center",
}: {
  kicker: string;
  title: string;
  sub?: string;
  align?: "center" | "start";
}) {
  return (
    <div className={cn("space-y-3", align === "center" ? "text-center mx-auto" : "text-start")}>
      <Badge tone="gold" className="font-mono tracking-wider">
        {kicker}
      </Badge>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {sub ? <p className="max-w-2xl text-base leading-8 text-muted mx-auto">{sub}</p> : null}
    </div>
  );
}

/* ── course card with generative mathematical cover ── */
export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  priceCents: number;
  gradeName: string;
  subjectName: string;
  lessonsCount: number;
  totalSeconds: number;
};

export function CourseCard({ course, owned = false }: { course: CourseCardData; owned?: boolean }) {
  const hue = hueFromId(course.id);
  const operator = ["∑", "∫", "π", "Δ", "√", "θ"][hue % 6];
  const curve = hue % 3;

  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <Card hover className="overflow-hidden">
        {/* generative cover */}
        <div
          className="relative h-44 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 62% 14%) 0%, hsl(${(hue + 40) % 360} 58% 26%) 100%)`,
          }}
        >
          <svg className="absolute inset-0 h-full w-full opacity-90" viewBox="0 0 400 176" preserveAspectRatio="none" aria-hidden>
            <defs>
              <pattern id={`g-${course.id}`} width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="400" height="176" fill={`url(#g-${course.id})`} />
            {curve === 0 && (
              <path d="M0 150 Q 100 -40 200 90 T 400 60" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            )}
            {curve === 1 && (
              <path d="M0 90 Q 50 150 100 90 T 200 90 T 300 90 T 400 90" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            )}
            {curve === 2 && (
              <path d="M40 160 Q 200 -60 360 160" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            )}
            <circle cx="330" cy="46" r="26" fill="none" stroke="rgba(227,176,75,0.75)" strokeWidth="1.6" />
          </svg>
          <span className="absolute end-4 bottom-1 font-mono text-[92px] font-bold leading-none text-white/12 select-none">
            {operator}
          </span>
          <div className="absolute start-4 top-4 flex gap-2">
            <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {course.subjectName}
            </span>
            <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
              {course.gradeName}
            </span>
          </div>
          {owned ? (
            <span className="absolute end-4 top-4 rounded-full bg-[var(--gold)] px-2.5 py-1 text-[11px] font-bold text-[#1a1405]">
              مشترك ✓
            </span>
          ) : null}
        </div>

        <div className="space-y-3 p-5">
          <h3 className="line-clamp-1 text-base font-bold text-ink transition-colors group-hover:text-brand">
            {course.title}
          </h3>
          <p className="line-clamp-2 min-h-11 text-[13px] leading-6 text-muted">{course.summary}</p>
          <div className="flex items-center gap-4 font-mono text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <BookOpen size={13} /> {course.lessonsCount} درس
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> {formatDuration(course.totalSeconds)}
            </span>
            <span className="inline-flex items-center gap-1">
              <PlayCircle size={13} /> فيديو
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3.5">
            <span className="text-lg font-extrabold text-ink">{formatEGP(course.priceCents)}</span>
            <span className="text-sm font-bold text-brand transition-transform duration-300 group-hover:-translate-x-1">
              {owned ? "متابعة التعلم ←" : "التفاصيل ←"}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
