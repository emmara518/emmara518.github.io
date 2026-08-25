import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { adminCoursePatchSchema } from "@/lib/contracts";
import { db } from "@/db";
import { courses, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية التعديل");

  const parsed = await parseJson(request, adminCoursePatchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.priceEgp !== undefined) updateData.priceCents = Math.round(parsed.data.priceEgp * 100);
    if (parsed.data.coverUrl !== undefined) updateData.coverImageUrl = parsed.data.coverUrl || null;
    if (parsed.data.requireSequential !== undefined) updateData.requireSequentialProgress = parsed.data.requireSequential;

    if (Object.keys(updateData).length === 0) {
      return err(400, "BAD_REQUEST", "لا توجد تعديلات محددة");
    }

    await db.update(courses).set(updateData).where(eq(courses.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "courses.patch",
      entity: "courses",
      entityId: id,
      meta: updateData,
    });

    return ok({ id, ...updateData });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
