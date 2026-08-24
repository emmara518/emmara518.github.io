import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { exams, auditLogs } from "@/db/schema";
import { listExamsAdmin } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const createExamSchema = z.object({
  title: z.string().trim().min(3).max(160),
  courseId: z.string().uuid(),
  durationMin: z.number().int().min(5).max(300).default(60),
  mode: z.enum(["practice", "graded"]).default("graded"),
  isPublished: z.boolean().default(false),
});

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  const examsList = await listExamsAdmin();
  return ok({ exams: examsList });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإنشاء");

  const parsed = await parseJson(request, createExamSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const [created] = await db
      .insert(exams)
      .values({
        title: parsed.data.title,
        courseId: parsed.data.courseId,
        durationMin: parsed.data.durationMin,
        mode: parsed.data.mode,
        isPublished: parsed.data.isPublished,
      })
      .returning({ id: exams.id, title: exams.title });

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "exams.create",
      entity: "exams",
      entityId: created.id,
      meta: { title: created.title },
    });

    return ok(created, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
