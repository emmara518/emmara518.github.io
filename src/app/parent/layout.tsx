import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { ParentShell } from "@/components/parent-shell";

/** Guardian portal shell — parents only (admins may preview). Students go to their workspace. */
export default async function ParentLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/parent");
  const isGuardianOrAdmin = user.role === "parent" || isAdminRole(user.role);
  if (!isGuardianOrAdmin) redirect("/dashboard");

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
    <ParentShell
      user={sessionUser}
      unreadCount={unreadRows.length}
      notifications={recentRows.map((n) => ({ ...n, read: n.readAt !== null }))}
    >
      {children}
    </ParentShell>
  );
}
