import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export type ShellNotification = {
  id: string;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  createdAt: Date | string;
};

/** Notification payload for the topbar bell — same shape used by `dashboard-shell.tsx`'s local type. */
export async function getShellNotifications(userId: string) {
  const [unreadRows, recentRows] = await Promise.all([
    db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
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
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(6),
  ]);
  return {
    unreadCount: unreadRows.length,
    notifications: recentRows.map((n) => ({ ...n, read: n.readAt !== null })),
  };
}
