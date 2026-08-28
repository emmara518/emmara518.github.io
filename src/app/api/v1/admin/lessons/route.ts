import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { adminLessonCreateSchema } from "@/lib/contracts";
import { createLesson } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية إضافة درس");

  const parsed = await parseJson(request, adminLessonCreateSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const created = await createLesson(auth.user, parsed.data);
    return ok({ lesson: created }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}