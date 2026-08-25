import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell, BookOpen, CheckCircle2, ClipboardList } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getRecentActivity } from "@/lib/services/dashboard.service";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "النشاط" };

const ICONS = {
  lesson: { icon: CheckCircle2, cls: "text-success" },
  exam: { icon: ClipboardList, cls: "text-muted" },
  enrolled: { icon: BookOpen, cls: "text-muted" },
  notification: { icon: Bell, cls: "text-muted" },
} as const;

export default async function ActivityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/activity");
  if (isAdminRole(user.role)) redirect("/admin");

  const items = await getRecentActivity(user, 20);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="النشاط" subtitle="آخر ما قمت به على المنصة" />

      <Card className="divide-y divide-line">
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs font-semibold text-muted">لا يوجد نشاط بعد.</p>
        ) : (
          items.map((item) => {
            const meta = ICONS[item.kind];
            const Icon = meta.icon;
            return (
              <div key={`${item.kind}-${item.id}`} className="flex items-start gap-3 px-4 py-3.5">
                <Icon size={16} className={`mt-0.5 shrink-0 ${meta.cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{item.title}</p>
                  {item.meta ? <p className="mt-0.5 truncate text-[11px] text-muted">{item.meta}</p> : null}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
