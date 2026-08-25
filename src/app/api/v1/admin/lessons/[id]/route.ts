import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { adminLessonPatchSchema } from "@/lib/contracts";
import { updateLessonTitle } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية التعديل");

  const parsed = await parseJson(request, adminLessonPatchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const result = await updateLessonTitle(auth.user, id, parsed.data.title);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
