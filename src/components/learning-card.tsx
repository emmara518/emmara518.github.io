import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, Card } from "@/components/ui";

export type LearningCardEnrollment = {
  id: string;
  slug: string;
  title: string;
  gradeName: string;
  subjectName: string;
  progress: { total: number; completed: number };
};

export function LearningCard({ e }: { e: LearningCardEnrollment }) {
  const pct = e.progress.total > 0 ? Math.round((e.progress.completed / e.progress.total) * 100) : 0;
  return (
    <Card hover className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-ink">{e.title}</p>
          <div className="mt-1.5 flex gap-1.5">
            <Badge tone="brand">{e.subjectName}</Badge>
            <Badge tone="muted">{e.gradeName}</Badge>
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm font-black text-brand">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold text-muted">
          {e.progress.completed}/{e.progress.total} فيديو
        </span>
        <Link
          href={`/dashboard/courses/${e.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          كمل
          <ArrowLeft size={13} />
        </Link>
      </div>
    </Card>
  );
}
