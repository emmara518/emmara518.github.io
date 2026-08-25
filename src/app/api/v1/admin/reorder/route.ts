import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { adminReorderSchema } from "@/lib/contracts";
import { reorderEntities } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية التعديل");

  const parsed = await parseJson(request, adminReorderSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const result = await reorderEntities(auth.user, parsed.data.entity, parsed.data.ids);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
