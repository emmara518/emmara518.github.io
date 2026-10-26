import { err, ok } from "@/lib/http";
import { requirePermission } from "@/lib/permission-guard";
import { db } from "@/db";
import { courseFiles, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteLegacyUpload, deletePrivateObject, isLegacyUploadKey } from "@/lib/storage";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("content.delete");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };

  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");
  try {
    const rows = await db
      .select({ id: courseFiles.id, storageKey: courseFiles.storageKey })
      .from(courseFiles)
      .where(eq(courseFiles.id, id))
      .limit(1);
    const file = rows[0];
    if (!file) return err(404, "NOT_FOUND", "الملف غير موجود");

    if (isLegacyUploadKey(file.storageKey)) {
      await deleteLegacyUpload(file.storageKey);
    } else {
      await deletePrivateObject(file.storageKey);
    }

    // Delete from DB
    await db.delete(courseFiles).where(eq(courseFiles.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "course_files.delete",
      entity: "course_files",
      entityId: id,
    });

    return ok({ deleted: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}