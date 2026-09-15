import { requirePermission } from "@/lib/permission-guard";
import { err, ok } from "@/lib/http";
import { db } from "@/db";
import { courses, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("courses.delete");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };

  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");
  try {
    const existing = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, id)).limit(1);
    if (!existing[0]) return err(404, "NOT_FOUND", "الكورس غير موجود");

    await db.delete(courses).where(eq(courses.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "courses.delete",
      entity: "courses",
      entityId: id,
      meta: { title: existing[0].title },
    });

    return ok({ id, deleted: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
