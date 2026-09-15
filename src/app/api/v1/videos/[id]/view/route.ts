import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { recordVideoView } from "@/lib/services/dashboard.service";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

/** Counts one view when the student opens a video — enforces videos.max_views. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "progress:write")) return err(403, "FORBIDDEN", "غير مسموح");
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");

  try {
    const result = await recordVideoView(auth.user.id, id);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
