import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { cancelSubscriptionAdmin } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const cancelSchema = z.object({
  reason: z.string().trim().max(400).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإلغاء");
  const { id } = await params;
  const parsed = await parseJson(request, cancelSchema);
  if ("response" in parsed) return parsed.response;
  try {
    return ok(await cancelSubscriptionAdmin(auth.user, id, parsed.data.reason));
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}