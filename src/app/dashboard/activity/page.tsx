import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getRecentActivity } from "@/lib/services/dashboard.service";
import { PageHeader } from "@/components/page-header";
import { ActivityCard } from "@/components/activity-card";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "النشاط" };

export default async function ActivityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/activity");
  if (isAdminRole(user.role)) redirect("/admin");

  const items = await getRecentActivity(user, 20);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader
        title="النشاط"
        subtitle="آخر ما قمت به على المنصة"
        overline="نشاط الطالب"
      />

      {items.length === 0 ? (
        <EmptyState icon={<Bell size={22} />} title="لا يوجد نشاط بعد." />
      ) : (
        <ActivityCard items={items} limit={20} showHeader={false} />
      )}
    </div>
  );
}
