import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { likePost } from "@/lib/services/community.service";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");
  try {
    const result = await likePost(auth.user, id);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
