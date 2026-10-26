import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, parentLinks, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { toEnvelope } from "@/lib/errors";

const linkSchema = z.object({
  parentEmail: z.string().email(),
  studentEmail: z.string().email(),
});

/** Super Admin-only manual parent/student linking (replaces silent auto-link). */
export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;

  const parsed = await parseJson(request, linkSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const parentEmail = parsed.data.parentEmail.toLowerCase().trim();
    const studentEmail = parsed.data.studentEmail.toLowerCase().trim();

    const parentRows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, parentEmail))
      .limit(1);
    const parent = parentRows[0];
    if (!parent || parent.role !== "parent") {
      return err(404, "PARENT_NOT_FOUND", "لا يوجد حساب ولي أمر بهذا البريد");
    }

    const studentRows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, studentEmail))
      .limit(1);
    const student = studentRows[0];
    if (!student || student.role !== "student") {
      return err(404, "STUDENT_NOT_FOUND", "لا يوجد حساب طالب بهذا البريد");
    }

    await db
      .insert(parentLinks)
      .values({ parentId: parent.id, studentId: student.id })
      .onConflictDoNothing();

    await db.insert(auditLogs).values({
      actorId: gate.user.id,
      action: "parent_links.link",
      entity: "parent_links",
      entityId: parent.id,
      meta: { parentId: parent.id, studentId: student.id },
    });

    return ok({ linked: true, parentId: parent.id, studentId: student.id });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
