import { err, ok, parseJson } from "@/lib/http";
import { requirePermission } from "@/lib/permission-guard";
import { adminVideoPatchSchema } from "@/lib/contracts";
import { updateVideoMeta } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("content.edit");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };

  const parsed = await parseJson(request, adminVideoPatchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const result = await updateVideoMeta(auth.user, id, parsed.data);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
