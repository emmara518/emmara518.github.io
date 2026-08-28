import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { adminVideoCreateSchema } from "@/lib/contracts";
import { createVideo } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية إضافة فيديو");

  const parsed = await parseJson(request, adminVideoCreateSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const created = await createVideo(auth.user, parsed.data);
    return ok({ video: created }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}