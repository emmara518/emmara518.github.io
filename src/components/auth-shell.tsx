import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMark } from "./logo";
import { Card } from "./ui";

/** Split-screen auth layout: form + animated math panel. */
export function AuthShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-stretch">
      {/* math panel */}
      <div className="relative hidden overflow-hidden rounded-3xl border border-line bg-surface lg:block">
        <div className="grid-paper-lg absolute inset-0" aria-hidden />
        <div className="orb size-80 -top-20 -start-20 bg-[var(--hero-glow-1)]" aria-hidden />
        <div className="orb size-72 -bottom-16 -end-16 bg-[var(--hero-glow-2)]" aria-hidden />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 600" preserveAspectRatio="none" aria-hidden>
          <path d="M -20 470 Q 120 120 250 330 T 520 210" fill="none" stroke="var(--brand)" strokeWidth="2.5" className="animate-draw" style={{ ["--dash" as string]: 980 }} />
          <path d="M -20 300 q 70 -110 140 0 t 140 0 t 140 0 t 140 0" fill="none" stroke="var(--gold)" strokeWidth="2" className="animate-drift" />
        </svg>
        <div className="relative flex h-full flex-col justify-between p-9">
          <Link href="/" aria-label="دروس ماث">
            <LogoMark size={44} />
          </Link>
          <div className="space-y-4">
            <div className="type-eyebrow-display">EQUALS · 2026</div>
            <p className="type-headline-display text-ink leading-relaxed">
              «المسألة الصعبة ما هي إلا <span className="text-gradient font-extrabold">خطوات صغيرة</span> مرتبة صح.»
            </p>
            <div className="type-flourish" aria-hidden />
            <p className="text-base text-muted">— فلسفة دروس ماث في التعليم</p>
          </div>
          <div className="flex gap-6 font-mono text-sm font-bold text-muted">
            <span>∫ تعلم</span>
            <span>Σ تدريب</span>
            <span>π إتقان</span>
          </div>
        </div>
      </div>

      {/* form side */}
      <Card className="p-7 sm:p-9">
        <div className="mb-7 space-y-2">
          <h1 className="type-headline-display">{title}</h1>
          <p className="text-base leading-7 text-muted">{sub}</p>
        </div>
        {children}
      </Card>
    </main>
  );
}
