import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { progressSchema } from "@/lib/contracts";
import { markVideoProgress } from "@/lib/services/dashboard.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "progress:write")) return err(403, "FORBIDDEN", "لا تملك هذه الصلاحية");

  const parsed = await parseJson(request, progressSchema);
  if ("response" in parsed) return parsed.response;

  const { id } = await params;
  if (parsed.data.videoId !== id) return err(422, "MISMATCH", "معرّف الفيديو غير متطابق");

  try {
    const result = await markVideoProgress(auth.user.id, id, parsed.data.watchedSeconds, parsed.data.completed);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
