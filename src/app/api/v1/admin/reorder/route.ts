import { requirePermission } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { adminReorderSchema } from "@/lib/contracts";
import { reorderEntities } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request) {
  const gate = await requirePermission("content.edit");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };

  const parsed = await parseJson(request, adminReorderSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const result = await reorderEntities(auth.user, parsed.data.entity, parsed.data.ids);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
