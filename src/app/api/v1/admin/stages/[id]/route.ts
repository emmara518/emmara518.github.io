import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { academicStages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const patchSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(80).optional(),
  slug: z.string().trim().max(80).regex(/^[a-z0-9-]*$/i).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية التعديل");

  const { id } = await params;
  const parsed = await parseJson(request, patchSchema);
  if ("response" in parsed) return parsed.response;

  if (Object.keys(parsed.data).length === 0) {
    return err(400, "BAD_REQUEST", "لا توجد تعديلات");
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.slug !== undefined) updateData.slug = parsed.data.slug || null;
    if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;
    await db.update(academicStages).set(updateData).where(eq(academicStages.id, id));
    return ok({ id });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!["admin"].includes(auth.user.role)) return err(403, "FORBIDDEN", "لا تملك صلاحية الحذف");

  const { id } = await params;
  try {
    await db.delete(academicStages).where(eq(academicStages.id, id));
    return ok({ deleted: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}