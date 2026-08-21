import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { adminUserPatchSchema } from "@/lib/contracts";
import { setUserActive, setUserRole } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "users:manage")) return err(403, "FORBIDDEN", "إدارة المستخدمين للمدير فقط");

  const parsed = await parseJson(request, adminUserPatchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    if (parsed.data.role !== undefined) {
      await setUserRole(auth.user, id, parsed.data.role);
    }
    if (parsed.data.isActive !== undefined) {
      await setUserActive(auth.user, id, parsed.data.isActive);
    }
    return ok({ id, ...parsed.data });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
