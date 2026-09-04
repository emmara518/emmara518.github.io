export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { getUserNotifications } from "@/lib/services/dashboard.service";
import { PageHeader } from "@/components/page-header";
import { NotificationsList } from "@/components/notifications-list";

export const metadata: Metadata = { title: "الإشعارات" };

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const rows = await getUserNotifications(user.id, 50);
  const items = rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    kind: n.kind,
    read: n.readAt !== null,
    createdAt: n.createdAt,
  }));
  const backHref = user.role === "parent" ? "/parent" : "/dashboard";

  return (
    <div className="space-y-6">
      <PageHeader title="الإشعارات" subtitle="كل التنبيهات والتحديثات الخاصة بك." overline="كل الإشعارات" backHref={backHref} />
      <NotificationsList notifications={items} />
    </div>
  );
}

