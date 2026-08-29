import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getShellNotifications } from "@/lib/notifications";
import { DashboardShell } from "@/components/dashboard-shell";

/**
 * Student workspace shell — one compact topbar, one sidebar.
 * Identity, notification counts and the notification list are REAL session data.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (isAdminRole(user.role)) redirect("/admin");
  if (user.role === "parent") redirect("/parent");

  const { unreadCount, notifications } = await getShellNotifications(user.id);

  const sessionUser = { name: user.name, role: user.role, avatarUrl: user.avatarUrl };

  return (
    <DashboardShell
      user={sessionUser}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
