import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { examSubmitSchema } from "@/lib/contracts";
import { submitAttempt } from "@/lib/services/exams.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "exam:attempt")) return err(403, "FORBIDDEN", "حسابك لا يملك دخول الامتحانات");

  const parsed = await parseJson(request, examSubmitSchema);
  if ("response" in parsed) return parsed.response;

  const { id } = await params;
  try {
    const result = await submitAttempt(id, auth.user.id, parsed.data.answers);
    return ok(result, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
