export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { listMyEnrollments } from "@/lib/services/dashboard.service";
import { PageHeader } from "@/components/page-header";
import { EmptyState, buttonStyles } from "@/components/ui";
import { LearningCard } from "@/components/learning-card";

export const metadata: Metadata = { title: "كورساتي" };

export default async function MyCoursesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/courses");
  if (isAdminRole(user.role)) redirect("/admin");

  const enrollments = await listMyEnrollments(user);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="كورساتي" subtitle={`${enrollments.length} كورس نشط`} overline="كورساتي" />

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
          {enrollments.map((e) => (
            <LearningCard key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}

