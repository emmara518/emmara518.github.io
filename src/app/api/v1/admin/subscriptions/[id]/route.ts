import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { subscriptions, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const updateSubSchema = z.object({
  status: z.enum(["active", "expired", "cancelled"]).optional(),
  extendDays: z.number().min(1).max(365).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية إدارة الاشتراكات");

  const parsed = await parseJson(request, updateSubSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const existing = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    if (!existing[0]) return err(404, "NOT_FOUND", "الاشتراك غير موجود");

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) {
      updateData.status = parsed.data.status;
    }
    if (parsed.data.extendDays) {
      const currentEnd = existing[0].endsAt ? new Date(existing[0].endsAt).getTime() : Date.now();
      const newEnd = new Date(Math.max(Date.now(), currentEnd) + parsed.data.extendDays * 86400000);
      updateData.endsAt = newEnd;
      updateData.status = "active";
    }

    await db.update(subscriptions).set(updateData).where(eq(subscriptions.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "subscriptions.modify",
      entity: "subscriptions",
      entityId: id,
      meta: updateData,
    });

    return ok({ id, success: true, ...updateData });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
