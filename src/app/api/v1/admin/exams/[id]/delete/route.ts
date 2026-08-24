import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { db } from "@/db";
import { exams, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية حذف الامتحانات");

  const { id } = await params;
  try {
    const existing = await db.select({ title: exams.title }).from(exams).where(eq(exams.id, id)).limit(1);
    if (!existing[0]) return err(404, "NOT_FOUND", "الامتحان غير موجود");

    await db.delete(exams).where(eq(exams.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "exams.delete",
      entity: "exams",
      entityId: id,
      meta: { title: existing[0].title },
    });

    return ok({ id, deleted: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
