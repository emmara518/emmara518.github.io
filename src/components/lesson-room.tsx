"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheckBig as CircleOkIcon,
  CirclePlay,
  ClipboardList,
  FileText,
  LoaderCircle as Loader2,
  Lock,
} from "lucide-react";
import { Badge, Card, Progress, buttonStyles } from "./ui";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type RoomVideo = {
  id: string;
  title: string;
  youtubeVideoId: string | null;
  durationSec: number;
  completed: boolean;
};
type RoomLesson = {
  id: string;
  title: string;
  isFreePreview: boolean;
  unlocked: boolean;
  videos: RoomVideo[];
};
export type LearningRoomData = {
  course: { id: string; slug: string; title: string; gradeName: string; subjectName: string; teacherName: string };
  enrolled: boolean;
  lessons: RoomLesson[];
  exams: { id: string; title: string; durationMin: number; mode: string; questionsCount: number }[];
  files: { id: string; title: string; kind: string; storageKey: string; sizeBytes: number; isFreePreview: boolean }[];
  stats: { totalVideos: number; completedVideos: number; percent: number };
};

export function LessonRoom({ room, initialVideoId }: { room: LearningRoomData; initialVideoId: string | null }) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState<string | null>(initialVideoId);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(room.lessons.flatMap((l) => l.videos.filter((v) => v.completed).map((v) => v.id))),
  );
  const [busy, setBusy] = useState(false);

  const flat: RoomVideo[] = room.lessons.flatMap((l) => l.videos);
  const current = flat.find((v) => v.id === currentId) ?? null;
  const unlockedFlat = flat.filter((v) => v.youtubeVideoId);

  const doneCount = completedIds.size;
  const total = room.stats.totalVideos;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  async function markComplete() {
    if (!current) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/videos/${current.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: current.id, watchedSeconds: current.durationSec, completed: true }),
      });
      const json = await res.json();
      if (json.ok) {
        setCompletedIds((prev) => new Set(prev).add(current.id));
        const idx = unlockedFlat.findIndex((v) => v.id === current.id);
        const next = unlockedFlat[idx + 1];
        if (next) setCurrentId(next.id);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{room.course.subjectName}</Badge>
            <Badge tone="gold">{room.course.gradeName}</Badge>
            {!room.enrolled ? <Badge tone="success">وضع المعاينة المجانية</Badge> : null}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{room.course.title}</h1>
        </div>
        <Link href="/dashboard" className={buttonStyles("outline", "sm")}>
          ← عودة للوحة
        </Link>
      </div>

      {/* progress strip */}
      <Card className="flex flex-wrap items-center gap-4 p-4">
        <span className="font-mono text-sm font-bold text-brand">{pct}%</span>
        <Progress value={pct} className="min-w-40 flex-1" />
        <span className="font-mono text-xs text-muted">
          {doneCount} / {total} فيديو
        </span>
      </Card>

      {flat.length === 0 || unlockedFlat.length === 0 ? (
        <Card className="grid place-items-center gap-4 p-14 text-center">
          <Lock size={26} className="text-muted" />
          <p className="font-bold">هذا الكورس مقفل</p>
          <p className="max-w-sm text-sm leading-7 text-muted">اشترك في الكورس للوصول إلى جميع الدروس والفيديوهات والاختبارات.</p>
          <Link href={`/courses/${room.course.slug}`} className={buttonStyles("primary", "md")}>
            الاشتراك في الكورس
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* player column */}
          <div className="space-y-4">
            {current?.youtubeVideoId ? (
              <>
                <div className="video-frame">
                  <iframe
                    key={current.id}
                    src={`https://www.youtube-nocookie.com/embed/${current.youtubeVideoId}?rel=0&modestbranding=1`}
                    title={current.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{current.title}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {formatDuration(current.durationSec)} · بث خارجي عبر YouTube
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {completedIds.has(current.id) ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-success">
                        <CircleOkIcon size={16} /> مكتمل
                      </span>
                    ) : null}
                    <button
                      onClick={markComplete}
                      disabled={busy || completedIds.has(current.id)}
                      className={buttonStyles("gold", "sm")}
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <CircleOkIcon size={14} />}
                      {completedIds.has(current.id) ? "تم الإكمال" : "إكمال والتالي"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Card className="grid place-items-center p-14 text-muted">اختر درسًا من القائمة</Card>
            )}

            {/* exams + files */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="space-y-3 p-5">
                <h3 className="inline-flex items-center gap-2 font-extrabold">
                  <ClipboardList size={16} className="text-gold" /> اختبارات الكورس
                </h3>
                <ul className="space-y-2 text-sm">
                  {room.exams.map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-xl bg-surface2/60 px-3.5 py-2.5">
                      <span>{e.title}</span>
                      {room.enrolled ? (
                        <Link href={`/dashboard/exams/${e.id}`} className="text-xs font-bold text-brand hover:underline">
                          ابدأ ←
                        </Link>
                      ) : (
                        <Lock size={13} className="text-muted" />
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="space-y-3 p-5">
                <h3 className="inline-flex items-center gap-2 font-extrabold">
                  <FileText size={16} className="text-brand" /> الملفات والمذكرات
                </h3>
                <ul className="space-y-2 text-sm">
                  {room.files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between rounded-xl bg-surface2/60 px-3.5 py-2.5">
                      <span>{f.title}</span>
                      <span className="font-mono text-[10px] text-muted">
                        {(f.sizeBytes / 1_000_000).toFixed(1)}MB
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          {/* playlist column */}
          <Card className="h-fit max-h-[72vh] overflow-y-auto lg:sticky lg:top-24">
            <div className="border-b border-line p-4">
              <p className="font-mono text-[10px] tracking-[0.24em] text-muted">PLAYLIST · {room.course.teacherName}</p>
            </div>
            <div className="divide-y divide-line">
              {room.lessons.map((lesson, li) => (
                <div key={lesson.id}>
                  <div className="flex items-center gap-2 bg-surface2/50 px-4 py-3">
                    <span className="font-mono text-[10px] font-bold text-muted">{String(li + 1).padStart(2, "0")}</span>
                    <p className="flex-1 text-xs font-bold">{lesson.title}</p>
                    {lesson.isFreePreview && !room.enrolled ? <Badge tone="success">مجاني</Badge> : null}
                    {!lesson.unlocked ? <Lock size={12} className="text-muted" /> : null}
                  </div>
                  {lesson.videos.map((v) => {
                    const isCurrent = v.id === currentId;
                    const done = completedIds.has(v.id);
                    const playable = Boolean(v.youtubeVideoId);
                    return (
                      <button
                        key={v.id}
                        disabled={!playable}
                        onClick={() => setCurrentId(v.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-start transition-colors",
                          isCurrent ? "bg-[var(--brand-soft)]" : "hover:bg-surface2/60",
                          !playable && "cursor-not-allowed opacity-50",
                        )}
                      >
                        {done ? (
                          <CircleOkIcon size={15} className="shrink-0 text-success" />
                        ) : playable ? (
                          <CirclePlay size={15} className={cn("shrink-0", isCurrent ? "text-brand" : "text-muted")} />
                        ) : (
                          <Lock size={13} className="shrink-0 text-muted" />
                        )}
                        <span className={cn("flex-1 text-xs leading-5", isCurrent && "font-bold text-brand")}>{v.title}</span>
                        <span className="font-mono text-[10px] text-muted">{formatDuration(v.durationSec)}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
