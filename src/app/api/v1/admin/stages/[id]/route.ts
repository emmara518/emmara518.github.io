import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { academicStages, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية تعديل المراحل");

  const parsed = await parseJson(request, patchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;
    if (Object.keys(updateData).length === 0) return err(400, "NO_CHANGES", "لا توجد تعديلات");

    const [updated] = await db
      .update(academicStages)
      .set(updateData)
      .where(eq(academicStages.id, id))
      .returning({ id: academicStages.id });

    if (!updated) return err(404, "NOT_FOUND", "المرحلة غير موجودة");

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "stages.update",
      entity: "academic_stages",
      entityId: id,
      meta: { fields: Object.keys(updateData) },
    });

    return ok({ id, success: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية حذف المراحل");

  const { id } = await params;
  try {
    const [deleted] = await db
      .delete(academicStages)
      .where(eq(academicStages.id, id))
      .returning({ id: academicStages.id, name: academicStages.name });

    if (!deleted) return err(404, "NOT_FOUND", "المرحلة غير موجودة");

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "stages.delete",
      entity: "academic_stages",
      entityId: id,
      meta: { name: deleted.name },
    });

    return ok({ id, success: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
