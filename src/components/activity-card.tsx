import Link from "next/link";
import { Bell, BookOpen, CheckCircle2, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui";
import type { DashboardActivity } from "@/lib/services/dashboard.service";

const ACTIVITY_ICONS = {
  lesson: CheckCircle2,
  exam: ClipboardList,
  enrolled: BookOpen,
  notification: Bell,
} as const;

export function ActivityCard({
  items,
  limit = 3,
  showHeader = true,
}: {
  items: DashboardActivity[];
  limit?: number;
  showHeader?: boolean;
}) {
  const visible = items.slice(0, limit);
  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="type-section-heading">آخر نشاط</h2>
          {items.length > 0 ? (
            <Link href="/dashboard/activity" className="text-sm font-bold text-brand hover:underline">
              عرض الكل ←
            </Link>
          ) : null}
        </div>
      )}
      <Card className="divide-y divide-line">
        {visible.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm font-semibold text-muted">لا يوجد نشاط بعد.</p>
        ) : (
          visible.map((item) => {
            const Icon = ACTIVITY_ICONS[item.kind];
            return (
              <div key={`${item.kind}-${item.id}`} className="flex items-start gap-2.5 px-4 py-3">
                <Icon
                  size={14}
                  className={item.kind === "lesson" ? "mt-0.5 shrink-0 text-success" : "mt-0.5 shrink-0 text-muted"}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                  {item.meta ? <p className="truncate text-xs text-muted">{item.meta}</p> : null}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </section>
  );
}
