import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { subscriptions, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

const updateSubSchema = z.object({
  status: z.enum(["active", "expired", "cancelled"]).optional(),
  extendDays: z.number().min(1).max(365).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const parsed = await parseJson(request, updateSubSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");

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
