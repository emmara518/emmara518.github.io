import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { notifications, users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const broadcastSchema = z.object({
  target: z.enum(["all", "students", "parents", "centers"]),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(3).max(500),
});

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية إرسال إشعارات عامة");

  const parsed = await parseJson(request, broadcastSchema);
  if ("response" in parsed) return parsed.response;

  try {
    let targetUsersQuery = db.select({ id: users.id }).from(users);
    if (parsed.data.target === "students") {
      targetUsersQuery = targetUsersQuery.where(eq(users.role, "student")) as any;
    } else if (parsed.data.target === "parents") {
      targetUsersQuery = targetUsersQuery.where(eq(users.role, "parent")) as any;
    } else if (parsed.data.target === "centers") {
      targetUsersQuery = targetUsersQuery.where(eq(users.role, "center")) as any;
    }

    const recipients = await targetUsersQuery;
    if (recipients.length > 0) {
      await db.insert(notifications).values(
        recipients.map((r) => ({
          userId: r.id,
          title: parsed.data.title,
          body: parsed.data.body,
        }))
      );
    }

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "communications.broadcast_notification",
      entity: "notifications",
      meta: { target: parsed.data.target, count: recipients.length, title: parsed.data.title },
    });

    return ok({ sentCount: recipients.length, message: `تم إرسال الإشعار بنجاح إلى ${recipients.length} مستخدم.` });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
