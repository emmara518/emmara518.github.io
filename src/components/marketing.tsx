import Image from "next/image";
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
      <div className="math-grid-pattern absolute inset-0 opacity-20" />

      {/* axes */}
      <svg className="absolute inset-0 h-full w-full opacity-60" preserveAspectRatio="none" viewBox="0 0 1200 800">
        <line x1="0" y1="640" x2="1200" y2="640" stroke="currentColor" className="text-line" strokeWidth="1.5" />
        <line x1="200" y1="0" x2="200" y2="800" stroke="currentColor" className="text-line" strokeWidth="1.5" />
        {/* parabola */}
        <path
          d="M 40 180 Q 200 700 420 170"
          fill="none"
          stroke="var(--neon-lime)"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-draw"
          style={{ ["--dash" as string]: 900 }}
        />
        {/* sine wave */}
        <path
          d="M 480 520 q 60 -130 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0"
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* tangent line */}
        <line x1="60" y1="340" x2="430" y2="120" stroke="currentColor" className="text-line-strong" strokeWidth="1.5" />
        <circle cx="255" cy="222" r="4" fill="var(--neon-lime)" />
        {/* asymptote circle */}
        <circle cx="960" cy="250" r="120" fill="none" stroke="currentColor" className="text-line" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="960" cy="250" r="70" fill="none" stroke="currentColor" className="text-line-strong" strokeWidth="1" />
      </svg>

      {/* orbiting conic + cube */}
      <div className="absolute end-[6%] top-[16%] hidden lg:block opacity-40">
        <div className="cube-scene relative">
          <div className="cube" style={{ ["--cube-size" as string]: "170px" }}>
            <div className="cube-face border border-line-strong bg-surface" />
            <div className="cube-face border border-line-strong bg-surface" />
            <div className="cube-face border border-line-strong bg-surface" />
            <div className="cube-face border border-line-strong bg-surface" />
            <div className="cube-face border border-line-strong bg-surface" />
            <div className="cube-face border border-line-strong bg-surface" />
          </div>
          <span className="absolute -inset-10 -z-10 rounded-full border border-line" style={{ animation: "spin-slow 26s linear infinite" }} />
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
            "animate-float absolute font-mono text-3xl font-semibold text-muted/30 select-none",
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
    "sin²θ + cos²θ = 1",
    "a² + b² = c²",
    "e^{iπ} + 1 = 0",
    "Δ = b² − 4ac",
    "x = (−b ± √Δ) / 2a",
    "lim_{x→0} (sin x / x) = 1",
  ];
  const row = [...eqs, ...eqs];
  return (
    <div className="relative overflow-hidden border-y border-line bg-surface py-3.5" dir="ltr" aria-hidden>
      <div className="marquee-track items-center gap-10">
        {row.map((e, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-xs font-semibold text-muted">
            <span className="whitespace-nowrap">{e}</span>
            <span className="size-1.5 rounded-full bg-neon-lime" />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-surface to-transparent" />
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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface2 border border-line font-mono text-xs font-bold text-neon-lime">
        <span>{kicker}</span>
      </div>
      <h2 className="text-2xl font-black tracking-tight text-ink sm:text-4xl">{title}</h2>
      {sub ? <p className="max-w-2xl text-sm leading-relaxed text-muted mx-auto">{sub}</p> : null}
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
  coverImageUrl?: string | null;
  gradeName: string;
  subjectName: string;
  lessonsCount: number;
  totalSeconds: number;
};

function getCourseCoverImage(course: CourseCardData): string {
  // Admin-assigned cover wins over the keyword heuristic.
  if (course.coverImageUrl) return course.coverImageUrl;

  const s = (course.slug || "").toLowerCase();
  const sub = (course.subjectName || "").toLowerCase();
  const t = (course.title || "").toLowerCase();

  if (s.includes("calculus") || sub.includes("تفاضل") || t.includes("تفاضل") || s.includes("diff") || sub.includes("calculus")) {
    return "/images/courses/calculus.jpg";
  }
  if (s.includes("trig") || sub.includes("مثلثات") || t.includes("مثلثات")) {
    return "/images/courses/trigonometry.jpg";
  }
  if (s.includes("geom") || sub.includes("هندسة") || t.includes("هندسة") || s.includes("solid")) {
    return "/images/courses/geometry.jpg";
  }
  if (s.includes("revision") || s.includes("final") || t.includes("مراجعة") || t.includes("شاملة")) {
    return "/images/courses/algebra.jpg";
  }
  // Default for algebra and general secondary mathematics
  return "/images/courses/algebra.jpg";
}

export function CourseCard({ course, owned = false }: { course: CourseCardData; owned?: boolean }) {
  const coverImage = getCourseCoverImage(course);

  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface hover:border-neon-lime transition-all duration-300 shadow-card hover:shadow-[0_0_30px_rgba(255,196,0,0.12)] flex flex-col justify-between h-full">
        {/* Visual Course AI Cover: Mr. Mohamed Saeed & Mathematical Topic */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-surface2 border-b border-line">
          <Image
            src={coverImage}
            alt={`${course.title} - مستر محمد سعيد`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
          {/* Vignette Overlay for Crisp Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-black/20 to-black/50 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute start-3.5 top-3.5 flex gap-1.5 z-10">
            <span className="rounded-full bg-surface/90 dark:bg-black/90 backdrop-blur-md border border-neon-lime/40 px-3 py-1 text-xs font-extrabold text-neon-lime shadow-md">
              {course.subjectName}
            </span>
            <span className="rounded-full bg-surface2/90 backdrop-blur-md border border-line px-2.5 py-1 text-xs font-semibold text-ink">
              {course.gradeName}
            </span>
          </div>

          {owned ? (
            <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-neon-lime px-3 py-1 text-xs font-black text-black shadow-[0_0_12px_rgba(255,196,0,0.4)]">
              مشترك ✓
            </span>
          ) : (
            <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-surface/80 dark:bg-black/80 backdrop-blur-md border border-line px-2.5 py-0.5 text-xs font-mono text-muted">
              أ/ محمد سعيد
            </span>
          )}
        </div>

        <div className="space-y-3 p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="line-clamp-1 text-base font-bold text-ink transition-colors group-hover:text-neon-lime">
              {course.title}
            </h3>
            <p className="line-clamp-2 min-h-10 text-xs leading-relaxed text-muted">{course.summary}</p>
          </div>

          <div className="space-y-3 mt-auto">
            <div className="flex items-center gap-4 font-mono text-xs text-muted pt-1">
              <span className="inline-flex items-center gap-1">
                <BookOpen size={13} className="text-neon-lime" /> {course.lessonsCount} درس
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {formatDuration(course.totalSeconds)}
              </span>
              <span className="inline-flex items-center gap-1">
                <PlayCircle size={13} /> فيديو HD
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3.5">
              <span className="text-base font-black text-ink">{formatEGP(course.priceCents)}</span>
              <span className="text-xs font-bold text-ink group-hover:text-black transition-transform duration-300 group-hover:-translate-x-1 flex items-center gap-1 bg-surface2 group-hover:bg-neon-lime px-2.5 py-1 rounded-lg border border-line group-hover:border-neon-lime">
                {owned ? "متابعة التعلم ←" : "عرض تفاصيل الكورس ←"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
