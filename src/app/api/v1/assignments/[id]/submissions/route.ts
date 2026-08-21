import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { submissionSchema } from "@/lib/contracts";
import { submitAssignment } from "@/lib/services/assignments.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "course:learn")) return err(403, "FORBIDDEN", "حسابك لا يملك تسليم الواجبات");

  const parsed = await parseJson(request, submissionSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const result = await submitAssignment(auth.user.id, id, parsed.data.textAnswer);
    return ok(result, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
