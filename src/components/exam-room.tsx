"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Award, CircleCheckBig, CircleX, Clock, LoaderCircle as Loader2, RotateCcw } from "lucide-react";
import { Badge, Button, Card, buttonStyles } from "./ui";
import { cn } from "@/lib/utils";

export type ExamRoomData = {
  exam: {
    id: string;
    title: string;
    type: string;
    durationMin: number;
    courseTitle: string;
    courseSlug: string;
    totalMarks: number;
  };
  questions: {
    id: string;
    prompt: string;
    options: string[];
    marks: number;
    kind: string;
    topic: string;
  }[];
  attemptsCount: number;
  bestScore: number | null;
};

type ResultData = {
  score: number;
  totalMarks: number;
  results: {
    questionId: string;
    prompt: string;
    options: string[];
    chosen: number | null;
    correctIndex: number;
    correct: boolean;
    explanation: string;
    marks: number;
  }[];
};

export function ExamRoom({ room }: { room: ExamRoomData }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(room.exam.durationMin * 60);
  const [phase, setPhase] = useState<"running" | "submitting" | "result">("running");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const answersRef = useRef<Record<string, number>>({});

  // Keep answersRef in sync with answers state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  async function submit(current: Record<string, number>) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("submitting");
    try {
      const res = await fetch(`/api/v1/exams/${room.exam.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: room.questions.map((q) => ({
            questionId: q.id,
            choiceIndex: current[q.id] ?? null,
          })),
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر تسليم الاختبار");
        submittedRef.current = false;
        setPhase("running");
        return;
      }
      setResult(json.data);
      setPhase("result");
    } catch {
      setError("مشكلة في الاتصال — حاول مجددًا");
      submittedRef.current = false;
      setPhase("running");
    }
  }

  // Auto-submit when time runs out - use ref to avoid stale closure
  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) {
      submit(answersRef.current);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, room.exam.id]);

  const answeredCount = Object.keys(answers).length;
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const urgent = secondsLeft < 60;

  const pct = useMemo(
    () => (result ? Math.round((result.score / Math.max(result.totalMarks, 1)) * 100) : 0),
    [result],
  );

  /* ── result view ── */
  if (phase === "result" && result) {
    const C = 2 * Math.PI * 44;
    return (
      <div className="space-y-8">
        <Card className="flex flex-col items-center gap-5 p-10 text-center">
          <div className="relative grid size-36 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={pct >= 60 ? "var(--success)" : "var(--danger)"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C - (C * pct) / 100}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="font-mono text-3xl font-extrabold">{pct}%</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">
              {pct >= 85 ? "ممتاز — أداء يليق بمتفوق" : pct >= 60 ? "جيد — وراجع أخطاءك بالأسفل" : "لا بأس — المحاولة تُبنى عليها"}
            </h1>
            <p className="mt-2 text-muted">
              حصلت على <b className="font-mono text-ink">{result.score}</b> من{" "}
              <b className="font-mono text-ink">{result.totalMarks}</b> درجة في «{room.exam.title}»
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/exams" className={buttonStyles("primary", "md")}>
              <Award size={16} /> العودة للاختبارات
            </Link>
            <button
              onClick={() => {
                submittedRef.current = false;
                setAnswers({});
                setResult(null);
                setSecondsLeft(room.exam.durationMin * 60);
                setPhase("running");
              }}
              className={buttonStyles("outline", "md")}
            >
              <RotateCcw size={15} /> إعادة الاختبار
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-extrabold">مراجعة الإجابات</h2>
          {result.results.map((r, i) => (
            <Card key={r.questionId} className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                {r.correct ? (
                  <CircleCheckBig size={19} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <CircleX size={19} className="mt-0.5 shrink-0 text-danger" />
                )}
                <p className="font-bold leading-7">
                  {i + 1}. {r.prompt}
                </p>
              </div>
              <ul className="grid gap-2 ps-9 sm:grid-cols-2">
                {r.options.map((opt, oi) => (
                  <li
                    key={oi}
                    className={cn(
                      "rounded-xl border px-3.5 py-2.5 text-sm",
                      oi === r.correctIndex
                        ? "border-success/50 bg-success/10 font-bold text-success"
                        : oi === r.chosen
                          ? "border-danger/50 bg-danger/10 text-danger"
                          : "border-line text-muted",
                    )}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
              {r.explanation ? <p className="ps-9 text-xs leading-6 text-muted">{r.explanation}</p> : null}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ── running view ── */
  return (
    <div className="space-y-6">
      <Card className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="space-y-0.5">
          <h1 className="font-extrabold">{room.exam.title}</h1>
          <p className="font-mono text-[11px] text-muted">
            {room.exam.courseTitle} · {room.questions.length} سؤال · {room.exam.totalMarks} درجة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={urgent ? "danger" : "brand"} className="font-mono text-sm">
            <Clock size={13} />
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </Badge>
          <span className="font-mono text-xs text-muted">
            {answeredCount}/{room.questions.length} مُجاب
          </span>
        </div>
      </Card>

      {error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p>
      ) : null}

      {room.questions.map((q, i) => (
        <Card key={q.id} className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold leading-7">
              <span className="font-mono text-brand">{String(i + 1).padStart(2, "0")} · </span>
              {q.prompt}
            </p>
            <Badge tone="outline" className="shrink-0 font-mono">
              {q.marks} درجة
            </Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={`سؤال ${i + 1}`}>
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi;
              return (
                <button
                  key={oi}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-start text-sm transition-all",
                    selected
                      ? "border-brand bg-[var(--brand-soft)] font-bold text-brand"
                      : "border-line text-ink hover:border-brand/40 hover:bg-surface2/50",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="flex justify-center pb-8">
        <Button size="lg" disabled={phase === "submitting" || answeredCount === 0} onClick={() => void submit(answers)}>
          {phase === "submitting" ? <Loader2 size={17} className="animate-spin" /> : <Award size={17} />}
          {phase === "submitting" ? "جارٍ التصحيح…" : "تسليم الاختبار وتصحيحه فورًا"}
        </Button>
      </div>
    </div>
  );
}
