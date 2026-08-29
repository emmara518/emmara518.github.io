import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getShellNotifications } from "@/lib/notifications";
import { DashboardShell } from "@/components/dashboard-shell";
import { ParentShell } from "@/components/parent-shell";

/**
 * /notifications — top-level route, accessible to students and parents.
 * Admins keep their own notifications surface in the admin console.
 */
export default async function NotificationsLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/notifications");
  if (isAdminRole(user.role)) redirect("/admin");

  const { unreadCount, notifications } = await getShellNotifications(user.id);
  const sessionUser = { name: user.name, role: user.role, avatarUrl: user.avatarUrl };

  if (user.role === "parent") {
    return (
      <ParentShell user={sessionUser} unreadCount={unreadCount} notifications={notifications}>
        {children}
      </ParentShell>
    );
  }

  return (
    <DashboardShell user={sessionUser} unreadCount={unreadCount} notifications={notifications}>
      {children}
    </DashboardShell>
  );
}
