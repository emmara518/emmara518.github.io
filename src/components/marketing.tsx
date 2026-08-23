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
        <line x1="0" y1="640" x2="1200" y2="640" stroke="#22262E" strokeWidth="1.5" />
        <line x1="200" y1="0" x2="200" y2="800" stroke="#22262E" strokeWidth="1.5" />
        {/* parabola */}
        <path
          d="M 40 180 Q 200 700 420 170"
          fill="none"
          stroke="#B8FF00"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-draw"
          style={{ ["--dash" as string]: 900 }}
        />
        {/* sine wave */}
        <path
          d="M 480 520 q 60 -130 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0"
          fill="none"
          stroke="#8E98A5"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* tangent line */}
        <line x1="60" y1="340" x2="430" y2="120" stroke="#343940" strokeWidth="1.5" />
        <circle cx="255" cy="222" r="4" fill="#B8FF00" />
        {/* asymptote circle */}
        <circle cx="960" cy="250" r="120" fill="none" stroke="#22262E" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="960" cy="250" r="70" fill="none" stroke="#343940" strokeWidth="1" />
      </svg>

      {/* orbiting conic + cube */}
      <div className="absolute end-[6%] top-[16%] hidden lg:block opacity-40">
        <div className="cube-scene relative">
          <div className="cube" style={{ ["--cube-size" as string]: "170px" }}>
            <div className="cube-face border border-[#343940] bg-[#0C0E10]" />
            <div className="cube-face border border-[#343940] bg-[#0C0E10]" />
            <div className="cube-face border border-[#343940] bg-[#0C0E10]" />
            <div className="cube-face border border-[#343940] bg-[#0C0E10]" />
            <div className="cube-face border border-[#343940] bg-[#0C0E10]" />
            <div className="cube-face border border-[#343940] bg-[#0C0E10]" />
          </div>
          <span className="absolute -inset-10 -z-10 rounded-full border border-[#22262E]" style={{ animation: "spin-slow 26s linear infinite" }} />
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
            "animate-float absolute font-mono text-3xl font-semibold text-[#8E98A5]/30 select-none",
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
    <div className="relative overflow-hidden border-y border-[#22262E] bg-[#0C0E10] py-3.5" dir="ltr" aria-hidden>
      <div className="marquee-track items-center gap-10">
        {row.map((e, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-xs font-semibold text-[#8E98A5]">
            <span className="whitespace-nowrap">{e}</span>
            <span className="size-1.5 rounded-full bg-[#B8FF00]" />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-[#0C0E10] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-[#0C0E10] to-transparent" />
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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#15181C] border border-[#22262E] font-mono text-[11px] font-bold text-[#B8FF00]">
        <span>{kicker}</span>
      </div>
      <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
      {sub ? <p className="max-w-2xl text-sm leading-relaxed text-[#8E98A5] mx-auto">{sub}</p> : null}
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

function getCourseCoverImage(course: CourseCardData): string {
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
    return "/images/courses/final_revision.jpg";
  }
  // Default for algebra and general secondary mathematics
  return "/images/courses/algebra.jpg";
}

export function CourseCard({ course, owned = false }: { course: CourseCardData; owned?: boolean }) {
  const coverImage = getCourseCoverImage(course);

  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-[#22262E] bg-[#0C0E10] hover:border-[#B8FF00]/80 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(184,255,0,0.12)] flex flex-col justify-between h-full">
        {/* Visual Course AI Cover: Mr. Mohamed Saeed & Mathematical Topic */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#050505] border-b border-[#22262E]">
          <Image
            src={coverImage}
            alt={`${course.title} - مستر محمد سعيد`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
          {/* Vignette Overlay for Crisp Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E10] via-black/30 to-black/60 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute start-3.5 top-3.5 flex gap-1.5 z-10">
            <span className="rounded-full bg-[#050505]/90 backdrop-blur-md border border-[#B8FF00]/40 px-3 py-1 text-[11px] font-extrabold text-[#B8FF00] shadow-md">
              {course.subjectName}
            </span>
            <span className="rounded-full bg-[#14181E]/90 backdrop-blur-md border border-[#22262E] px-2.5 py-1 text-[11px] font-semibold text-[#E8EAED]">
              {course.gradeName}
            </span>
          </div>

          {owned ? (
            <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-[#B8FF00] px-3 py-1 text-[11px] font-black text-[#050505] shadow-[0_0_12px_rgba(184,255,0,0.4)]">
              مشترك ✓
            </span>
          ) : (
            <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-[#050505]/80 backdrop-blur-md border border-[#2B313A] px-2.5 py-0.5 text-[10px] font-mono text-[#D0D5DD]">
              أ/ محمد سعيد
            </span>
          )}
        </div>

        <div className="space-y-3 p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-[#B8FF00]">
              {course.title}
            </h3>
            <p className="line-clamp-2 min-h-10 text-xs leading-relaxed text-[#8E98A5]">{course.summary}</p>
          </div>

          <div className="space-y-3 mt-auto">
            <div className="flex items-center gap-4 font-mono text-[11px] text-[#8E98A5] pt-1">
              <span className="inline-flex items-center gap-1">
                <BookOpen size={13} className="text-[#B8FF00]" /> {course.lessonsCount} درس
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {formatDuration(course.totalSeconds)}
              </span>
              <span className="inline-flex items-center gap-1">
                <PlayCircle size={13} /> فيديو HD
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#22262E] pt-3.5">
              <span className="text-base font-black text-white">{formatEGP(course.priceCents)}</span>
              <span className="text-xs font-bold text-[#B8FF00] transition-transform duration-300 group-hover:-translate-x-1 flex items-center gap-1 bg-[#14181E] px-2.5 py-1 rounded-lg border border-[#B8FF00]/30 group-hover:border-[#B8FF00]">
                {owned ? "متابعة التعلم ←" : "عرض تفاصيل الكورس ←"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
