import { z } from "zod";
import { err, ok, parseJson } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/permission-guard";
import { updateAssistant } from "@/lib/assistant-permissions";
import { toEnvelope } from "@/lib/errors";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  newPassword: z.string().min(8).max(200).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;

  const parsed = await parseJson(request, patchSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    await updateAssistant(gate.user, id, parsed.data);
    return ok({ id, success: true });
  } catch (e) {
    const env = toEnvelope(e);
    return err(env.status, env.code, env.message);
  }
}
