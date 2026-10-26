import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { adminUserPatchSchema } from "@/lib/contracts";
import { setUserActive, setUserRole } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };

  const parsed = await parseJson(request, adminUserPatchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  // Role changes are a privilege-escalation vector — Super Admin only.
  if (parsed.data.role !== undefined && auth.user.role !== "admin") {
    return err(403, "FORBIDDEN", "تغيير الأدوار للمدير العام فقط");
  }

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
