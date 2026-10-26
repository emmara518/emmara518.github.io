import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { reorderPaymentChannels } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;

  const parsed = await parseJson(request, reorderSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const result = await reorderPaymentChannels(gate.user, parsed.data.ids);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
