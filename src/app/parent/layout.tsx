import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getShellNotifications } from "@/lib/notifications";
import { ParentShell } from "@/components/parent-shell";

/** Guardian portal shell — parents only (admins may preview). Students go to their workspace. */
export default async function ParentLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/parent");
  const isGuardianOrAdmin = user.role === "parent" || isAdminRole(user.role);
  if (!isGuardianOrAdmin) redirect("/dashboard");

  const { unreadCount, notifications } = await getShellNotifications(user.id);

  const sessionUser = { name: user.name, role: user.role, avatarUrl: user.avatarUrl };

  return (
    <ParentShell
      user={sessionUser}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </ParentShell>
  );
}
