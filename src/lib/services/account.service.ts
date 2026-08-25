import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { courses, grades, sessions, subscriptions, users } from "@/db/schema";
import type { SessionUser } from "../auth";

/**
 * Student account read models — profile, subscriptions, active sessions.
 * All queries are strictly scoped to the authenticated user id.
 */

export async function getAccountOverview(userId: string, currentToken: string | null) {
  const [profileRows, subscriptionRows, sessionRows] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        gradeName: grades.name,
      })
      .from(users)
      .leftJoin(grades, eq(users.gradeId, grades.id))
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        startsAt: subscriptions.startsAt,
        endsAt: subscriptions.endsAt,
        courseTitle: courses.title,
        courseSlug: courses.slug,
      })
      .from(subscriptions)
      .innerJoin(courses, eq(subscriptions.courseId, courses.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.startsAt)),
    db
      .select({
        id: sessions.id,
        createdAt: sessions.createdAt,
        expiresAt: sessions.expiresAt,
        token: sessions.token,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt))
      .limit(20),
  ]);

  const profile = profileRows[0] ?? null;

  return {
    profile,
    subscriptions: subscriptionRows,
    sessions: sessionRows.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: currentToken !== null && s.token === currentToken,
    })),
  };
}

/** Logs out every device except the current session. */
export async function destroyOtherSessions(userId: string, currentToken: string) {
  const rows = await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.token, currentToken)))
    .returning({ id: sessions.id });
  return { revoked: rows.length };
}
