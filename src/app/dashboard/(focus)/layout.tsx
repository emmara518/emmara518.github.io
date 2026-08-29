import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getShellNotifications } from "@/lib/notifications";
import { DashboardShell } from "@/components/dashboard-shell";

/**
 * Focus-mode shell — same identity/notifications data as the regular dashboard,
 * but the sidebar and mobile drawer are hidden so the lesson room / exam room
 * can use the full viewport width.
 *
 * Lives in the (focus) route group so the URL is unchanged.
 */
export default async function FocusLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (isAdminRole(user.role)) redirect("/admin");
  if (user.role === "parent") redirect("/parent");

  const { unreadCount, notifications } = await getShellNotifications(user.id);
  const sessionUser = { name: user.name, role: user.role, avatarUrl: user.avatarUrl };

  return (
    <DashboardShell
      focus
      user={sessionUser}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
