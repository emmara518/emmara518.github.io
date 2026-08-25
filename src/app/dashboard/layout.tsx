import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
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

  const [unreadRows, recentRows] = await Promise.all([
    db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
    db
      .select({
        id: notifications.id,
        title: notifications.title,
        body: notifications.body,
        kind: notifications.kind,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(6),
  ]);

  const sessionUser = { name: user.name, role: user.role, avatarUrl: user.avatarUrl };

  return (
    <DashboardShell
      user={sessionUser}
      unreadCount={unreadRows.length}
      notifications={recentRows.map((n) => ({ ...n, read: n.readAt !== null }))}
    >
      {children}
    </DashboardShell>
  );
}
