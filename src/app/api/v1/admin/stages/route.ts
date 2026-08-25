import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { academicStages, auditLogs } from "@/db/schema";
import { toEnvelope } from "@/lib/errors";

const stageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "الرابط اللاتيني يقبل حروف إنجليزية وأرقام وشرطات فقط")
    .optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية تعديل المراحل");

  const parsed = await parseJson(request, stageSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const slug = parsed.data.slug ?? `stage-${Date.now().toString(36)}`;
    const [created] = await db
      .insert(academicStages)
      .values({ name: parsed.data.name, slug, sortOrder: parsed.data.sortOrder })
      .returning({ id: academicStages.id, name: academicStages.name, slug: academicStages.slug, sortOrder: academicStages.sortOrder });

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "stages.create",
      entity: "academic_stages",
      entityId: created.id,
      meta: { name: created.name },
    });

    return ok(created, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
