import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { listStudentAssignments } from "@/lib/services/assignments.service";
import { toEnvelope } from "@/lib/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { slug } = await params;
  try {
    const assignments = await listStudentAssignments(auth.user, slug);
    return ok({ assignments });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
