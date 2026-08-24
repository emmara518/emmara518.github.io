import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { coupons, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const couponPatchSchema = z.object({
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية إدارة الأكواد");

  const parsed = await parseJson(request, couponPatchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

    await db.update(coupons).set(updateData).where(eq(coupons.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "coupons.patch",
      entity: "coupons",
      entityId: id,
      meta: updateData,
    });

    return ok({ id, success: true, ...updateData });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية حذف الأكواد");

  const { id } = await params;
  try {
    await db.delete(coupons).where(eq(coupons.id, id));
    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "coupons.delete",
      entity: "coupons",
      entityId: id,
    });
    return ok({ id, deleted: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
