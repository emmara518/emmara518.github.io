import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { coupons, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

const couponPatchSchema = z.object({
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const parsed = await parseJson(request, couponPatchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");

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
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");
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
