import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { exams, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const patchExamSchema = z.object({
  isPublished: z.boolean().optional(),
  durationMin: z.number().int().min(5).max(300).optional(),
  title: z.string().trim().min(3).max(160).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية التعديل");

  const parsed = await parseJson(request, patchExamSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.isPublished !== undefined) updateData.isPublished = parsed.data.isPublished;
    if (parsed.data.durationMin !== undefined) updateData.durationMin = parsed.data.durationMin;
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;

    if (Object.keys(updateData).length === 0) {
      return err(400, "BAD_REQUEST", "لا توجد تعديلات محددة");
    }

    await db.update(exams).set(updateData).where(eq(exams.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "exams.patch",
      entity: "exams",
      entityId: id,
      meta: updateData,
    });

    return ok({ id, ...updateData });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
