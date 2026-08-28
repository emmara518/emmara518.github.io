import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { db } from "@/db";
import { courseFiles, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { toEnvelope } from "@/lib/errors";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الحذف");

  const { id } = await params;
  try {
    const rows = await db
      .select({ id: courseFiles.id, storageKey: courseFiles.storageKey })
      .from(courseFiles)
      .where(eq(courseFiles.id, id))
      .limit(1);
    const file = rows[0];
    if (!file) return err(404, "NOT_FOUND", "الملف غير موجود");

    // Delete from disk
    const abs = path.join(process.cwd(), "public", file.storageKey);
    try {
      await fsp.unlink(abs);
    } catch {
      // ignore - file might not exist
    }

    // Delete from DB
    await db.delete(courseFiles).where(eq(courseFiles.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "course_files.delete",
      entity: "course_files",
      entityId: id,
    });

    return ok({ deleted: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}