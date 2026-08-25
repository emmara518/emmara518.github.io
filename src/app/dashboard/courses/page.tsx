import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { listMyEnrollments } from "@/lib/services/dashboard.service";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, EmptyState, buttonStyles } from "@/components/ui";
import { ProgressBar } from "@/components/dashboard-widgets";
import Link from "next/link";

export const metadata: Metadata = { title: "كورساتي" };

export default async function MyCoursesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/courses");
  if (isAdminRole(user.role)) redirect("/admin");

  const enrollments = await listMyEnrollments(user);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="كورساتي" subtitle={`${enrollments.length} كورس نشط`} />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={22} />}
          title="لسه مفيش كورسات."
          hint="اشترك في كورس وابدأ الحصص من محفظتك مباشرة."
          action={
            <Link href="/courses" className={buttonStyles("primary", "sm")}>
              تصفح الكورسات
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {enrollments.map((e) => {
            const pct = e.progress.total > 0 ? Math.round((e.progress.completed / e.progress.total) * 100) : 0;
            return (
              <Card key={e.id} hover className="flex flex-col gap-3 p-4">
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
                <ProgressBar value={pct} />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold text-muted">
                    {e.progress.completed}/{e.progress.total} فيديو
                  </span>
                  <Link
                    href={`/dashboard/courses/${e.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                  >
                    كمل
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
