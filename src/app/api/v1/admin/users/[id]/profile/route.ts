import { requireApiUser, hashPassword } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const editStudentSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  newPassword: z.string().min(6).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "users:manage")) return err(403, "FORBIDDEN", "لا تملك صلاحية تعديل بيانات المستخدم");

  const parsed = await parseJson(request, editStudentSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.newPassword) {
      updateData.passwordHash = await hashPassword(parsed.data.newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return err(400, "NO_CHANGES", "لا توجد تعديلات");
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "users.edit_profile",
      entity: "users",
      entityId: id,
      meta: { fields: Object.keys(updateData).filter((k) => k !== "passwordHash") },
    });

    return ok({ id, success: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
