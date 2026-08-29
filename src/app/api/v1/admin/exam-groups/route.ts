import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { listExamGroupsAdmin, createExamGroup } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const groupSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير").max(80),
  courseId: z.string().uuid(),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  try {
    const groups = await listExamGroupsAdmin();
    return ok({ groups });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإنشاء");

  const parsed = await parseJson(request, groupSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const created = await createExamGroup(auth.user, parsed.data);
    return ok({ group: created }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}