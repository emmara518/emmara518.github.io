import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { adminCourseSchema } from "@/lib/contracts";
import { createCourse, listCoursesAdmin } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  const courses = await listCoursesAdmin();
  return ok({ courses });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإنشاء");

  const parsed = await parseJson(request, adminCourseSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const created = await createCourse(auth.user, parsed.data);
    return ok(created, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
