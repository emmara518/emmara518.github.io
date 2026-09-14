import { err, ok, parseJson } from "@/lib/http";
import { requirePermission } from "@/lib/permission-guard";
import { z } from "zod";
import { cancelSubscriptionAdmin } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const cancelSchema = z.object({
  reason: z.string().trim().max(400).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("subscriptions.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const { id } = await params;
  const parsed = await parseJson(request, cancelSchema);
  if ("response" in parsed) return parsed.response;
  try {
    return ok(await cancelSubscriptionAdmin(auth.user, id, parsed.data.reason));
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}