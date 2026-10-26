import { requirePermission } from "@/lib/permission-guard";
import { err, ok } from "@/lib/http";
import { db } from "@/db";
import { questionBank, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("exams.edit");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");
  try {
    await db.delete(questionBank).where(eq(questionBank.id, id));

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "questions.delete",
      entity: "question_bank",
      entityId: id,
    });

    return ok({ id, deleted: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
