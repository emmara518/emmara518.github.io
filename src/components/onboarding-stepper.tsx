"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  GraduationCap,
  PartyPopper,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react";
import { buttonStyles, Card, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

type StepKey = "stage" | "goal" | "preview";
const STEPS: { key: StepKey; title: string; subtitle: string }[] = [
  { key: "stage", title: "المرحلة الدراسية", subtitle: "تأكدي إن المحتوى المظبوط ظاهر ليكي." },
  { key: "goal", title: "هدفك من المنصة", subtitle: "بنوصّلك بالمحتوى اللي يخدمك أسرع." },
  { key: "preview", title: "جرّبي درسًا تجريبيًا", subtitle: "خطوة صغيرة قبل ما تبدئي رسميًا." },
];

const STAGES = [
  { value: "prep", label: "إعدادي", hint: "الصفوف من الأول إلى الثالث الإعدادي." },
  { value: "sec", label: "ثانوي", hint: "الصف الأول والثاني والثالث الثانوي." },
] as const;

const GOALS = [
  {
    value: "master",
    title: "إتقان المنهج",
    hint: "شرح كل درس + تمارين محلولة + اختبارات قصيرة.",
    icon: Target,
  },
  {
    value: "exam",
    title: "التحضير للامتحان",
    hint: "مراجعات مكثفة واختبارات شاملة على المنهج.",
    icon: GraduationCap,
  },
  {
    value: "follow",
    title: "متابعة الشرح",
    hint: "تكملة الكورسات اللي بدأتِها من قبل.",
    icon: Sparkles,
  },
] as const;

type Stage = (typeof STAGES)[number]["value"];
type Goal = (typeof GOALS)[number]["value"];

/**
 * Three-step welcome flow. State is local — selections are NOT persisted
 * in this v1 (per spec). The "preview" link points at `/courses?welcome=1`
 * as an analytics hint; the always-visible "skip" goes straight to /dashboard.
 */
export function OnboardingStepper({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const current = STEPS[index];
  const total = STEPS.length;
  const progress = ((index + 1) / total) * 100;
  const isLast = index === total - 1;

  function next() {
    if (isLast) {
      router.push("/dashboard");
      return;
    }
    setIndex((i) => Math.min(total - 1, i + 1));
  }
  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-brand">
          <PartyPopper size={14} />
          أهلاً {firstName}!
        </p>
        <h1 className="type-display text-3xl font-black text-ink">خلّينا نعدّي دلوقتي على خطوات سريعة</h1>
        <p className="text-sm font-semibold text-muted">ثلاث خطوات بسيطة قبل ما تبدئي.</p>
      </header>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-bold text-muted">
          <span>
            {index + 1} / {total}
          </span>
          <span>{current.title}</span>
        </div>
        <Progress value={progress} variant="gradient" />
      </div>

      <Card className="space-y-5 p-6">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-black text-ink">{current.title}</h2>
          <p className="text-base text-muted">{current.subtitle}</p>
        </div>

        {current.key === "stage" ? (
          <div className="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
            {STAGES.map((opt) => {
              const active = stage === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStage(opt.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-start transition-all",
                    active
                      ? "border-brand bg-[var(--brand-soft)] shadow-card"
                      : "border-line bg-surface hover:border-brand/50",
                  )}
                >
                  <p className="text-base font-black text-ink">{opt.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{opt.hint}</p>
                </button>
              );
            })}
          </div>
        ) : null}

        {current.key === "goal" ? (
          <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-3">
            {GOALS.map((opt) => {
              const active = goal === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGoal(opt.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-start transition-all",
                    active
                      ? "border-brand bg-[var(--brand-soft)] shadow-card"
                      : "border-line bg-surface hover:border-brand/50",
                  )}
                >
                  <span
                    className={cn(
                      "mb-2 grid size-9 place-items-center rounded-xl",
                      active ? "bg-brand text-white" : "bg-surface2 text-brand",
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <p className="text-base font-black text-ink">{opt.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{opt.hint}</p>
                </button>
              );
            })}
          </div>
        ) : null}

        {current.key === "preview" ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-brand">
              <Compass size={20} />
            </span>
            <p className="text-sm font-semibold text-muted">
              لو حابّة تشوفي شكل الدرس قبل ما تبدئي، ادخلي على درس تجريبي مجاني —
              أو اتخطّي وروحي للوحة التحكم على طول.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/courses?welcome=1" className={buttonStyles("primary", "md")}>
                <PlayCircle size={16} />
                جربي درسًا تجريبيًا
              </Link>
              <Link href="/dashboard" className={buttonStyles("ghost", "md")}>
                تخطّي
              </Link>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className={cn(buttonStyles("ghost", "sm"), index === 0 && "invisible")}
        >
          <ArrowRight size={14} className="rtl:rotate-180" />
          السابق
        </button>
        <Link href="/dashboard" className="text-sm font-bold text-muted hover:text-ink hover:underline">
          تخطّي كل الخطوات
        </Link>
        {isLast ? (
          <Link href="/dashboard" className={buttonStyles("primary", "sm")}>
            ابدأ
            <ArrowLeft size={14} className="rtl:rotate-180" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={next}
            className={buttonStyles("primary", "sm")}
            disabled={current.key === "stage" && stage === null}
          >
            التالي
            <ArrowLeft size={14} className="rtl:rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}
