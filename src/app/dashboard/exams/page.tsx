import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardList, Clock } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getStudentDashboard } from "@/lib/services/dashboard.service";
import { Badge, Card, EmptyState, buttonStyles } from "@/components/ui";

export const metadata: Metadata = { title: "اختباراتي" };

export default async function StudentExamsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/exams");
  if (isAdminRole(user.role)) redirect("/admin");

  const data = await getStudentDashboard(user);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-lg font-black text-ink">اختباراتي</h1>
        <p className="text-xs font-semibold text-muted">الاختبارات المتاحة لكورساتك المشترك بها</p>
      </header>

      {data.upcomingExams.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="لا توجد اختبارات قريبة."
          hint="ستظهر هنا اختبارات الكورسات التي اشتركت بها."
          action={
            data.enrollments.length === 0 ? (
              <Link href="/courses" className={buttonStyles("primary", "sm")}>
                تصفح الكورسات
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.upcomingExams.map((exam) => {
            const attempted = exam.status !== null;
            return (
              <Card key={exam.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-extrabold text-ink">{exam.title}</p>
                    <p className="truncate text-[11px] font-semibold text-muted">{exam.courseTitle}</p>
                  </div>
                  {attempted ? (
                    <Badge tone="success">
                      أفضل نتيجة {exam.status!.bestScore}/{exam.status!.bestTotal}
                    </Badge>
                  ) : (
                    <Badge tone="outline">لم يُختبر</Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {exam.durationMin} دقيقة
                  </span>
                  {attempted && (
                    <span className="font-mono">
                      {exam.status!.attemptsCount} {exam.status!.attemptsCount === 1 ? "محاولة" : "محاولات"}
                    </span>
                  )}
                </div>

                <Link
                  href={`/dashboard/exams/${exam.id}`}
                  className={buttonStyles(attempted ? "surface" : "primary", "sm")}
                >
                  {attempted ? "إعادة الاختبار" : "ابدأ الاختبار"}
                  <ArrowLeft size={14} />
                </Link>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
