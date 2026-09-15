import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { getExamRoom } from "@/lib/services/exams.service";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "exam:attempt")) return err(403, "FORBIDDEN", "حسابك لا يملك دخول الامتحانات");

  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");
  try {
    const room = await getExamRoom(id, auth.user.id);
    return ok(room);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
