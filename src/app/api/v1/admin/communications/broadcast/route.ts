import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { notifications, users, auditLogs, subscriptions } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const broadcastSchema = z.object({
  target: z.enum(["all", "students", "parents", "centers", "specific_students", "course_students"]),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(3).max(500),
  studentIds: z.array(z.string().uuid()).optional(),
  studentEmails: z.array(z.string().email()).optional(),
  courseId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية إرسال إشعارات عامة");

  const parsed = await parseJson(request, broadcastSchema);
  if ("response" in parsed) return parsed.response;

  try {
    let targetUserIds: string[] = [];

    switch (parsed.data.target) {
      case "all": {
        const allUsers = await db.select({ id: users.id }).from(users);
        targetUserIds = allUsers.map((u) => u.id);
        break;
      }
      case "students": {
        const students = await db.select({ id: users.id }).from(users).where(eq(users.role, "student"));
        targetUserIds = students.map((u) => u.id);
        break;
      }
      case "parents": {
        const parents = await db.select({ id: users.id }).from(users).where(eq(users.role, "parent"));
        targetUserIds = parents.map((u) => u.id);
        break;
      }
      case "centers": {
        const centers = await db.select({ id: users.id }).from(users).where(eq(users.role, "center"));
        targetUserIds = centers.map((u) => u.id);
        break;
      }
      case "specific_students": {
        const ids = parsed.data.studentIds || [];
        const emails = parsed.data.studentEmails || [];
        let idsFound: string[] = [];
        
        if (ids.length > 0) {
          const usersById = await db.select({ id: users.id }).from(users).where(inArray(users.id, ids));
          idsFound.push(...usersById.map((u) => u.id));
        }
        if (emails.length > 0) {
          const usersByEmail = await db.select({ id: users.id }).from(users).where(inArray(users.email, emails));
          idsFound.push(...usersByEmail.map((u) => u.id));
        }
        targetUserIds = [...new Set(idsFound)];
        break;
      }
      case "course_students": {
        if (!parsed.data.courseId) {
          return err(422, "COURSE_REQUIRED", "يجب تحديد الكورس");
        }
        const subs = await db
          .select({ userId: subscriptions.userId })
          .from(subscriptions)
          .where(and(eq(subscriptions.courseId, parsed.data.courseId), eq(subscriptions.status, "active")));
        targetUserIds = subs.map((s) => s.userId);
        break;
      }
    }

    if (targetUserIds.length === 0) {
      return err(422, "NO_RECIPIENTS", "لا يوجد مستلمون للإشعار");
    }

    await db.insert(notifications).values(
      targetUserIds.map((userId) => ({
        userId,
        title: parsed.data.title,
        body: parsed.data.body,
      }))
    );

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "communications.broadcast_notification",
      entity: "notifications",
      meta: { target: parsed.data.target, count: targetUserIds.length, title: parsed.data.title },
    });

    return ok({ sentCount: targetUserIds.length, message: `تم إرسال الإشعار بنجاح إلى ${targetUserIds.length} مستخدم.` });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}