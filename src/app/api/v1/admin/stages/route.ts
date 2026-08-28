import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { academicStages } from "@/db/schema";
import { asc } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const stageSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  slug: z.string().trim().max(80).regex(/^[a-z0-9-]*$/i, "السلاج بحروف لاتينية صغيرة وأرقام وشرطات فقط").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  try {
    const rows = await db.select().from(academicStages).orderBy(asc(academicStages.sortOrder));
    return ok({ stages: rows });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإضافة");

  const parsed = await parseJson(request, stageSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const slug = parsed.data.slug || parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [created] = await db
      .insert(academicStages)
      .values({ name: parsed.data.name, slug, sortOrder: parsed.data.sortOrder })
      .returning();
    return ok({ stage: created }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}