import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { questionBank, subjects, auditLogs } from "@/db/schema";
import { toEnvelope } from "@/lib/errors";

const questionSchema = z.object({
  subjectId: z.string().uuid(),
  topic: z.string().trim().min(2).max(120),
  prompt: z.string().trim().min(3).max(4000),
  options: z.array(z.string().trim().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0).max(5),
  explanation: z.string().trim().max(4000).default(""),
  marks: z.number().int().min(1).max(100).default(1),
  difficulty: z.number().int().min(1).max(5).default(2),
});

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإنشاء");

  const parsed = await parseJson(request, questionSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const [created] = await db
      .insert(questionBank)
      .values({
        subjectId: parsed.data.subjectId,
        topic: parsed.data.topic,
        kind: "mcq",
        prompt: parsed.data.prompt,
        options: parsed.data.options,
        correctIndex: parsed.data.correctIndex,
        explanation: parsed.data.explanation,
        marks: parsed.data.marks,
        difficulty: parsed.data.difficulty,
      })
      .returning({ id: questionBank.id });

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "questions.create",
      entity: "question_bank",
      entityId: created.id,
      meta: { topic: parsed.data.topic },
    });

    return ok(created, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
