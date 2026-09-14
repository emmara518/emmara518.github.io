import { z } from "zod";
import { err, ok, parseJson } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/permission-guard";
import { replaceAssistantPermissions, sanitizePermissions } from "@/lib/assistant-permissions";
import { toEnvelope } from "@/lib/errors";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  permissions: z.array(z.string()),
});

/** Replace an assistant's granted permission set (grant + revoke in one call). */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;

  const parsed = await parseJson(request, putSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const permissions = await replaceAssistantPermissions(gate.user, id, sanitizePermissions(parsed.data.permissions));
    return ok({ id, permissions });
  } catch (e) {
    const env = toEnvelope(e);
    return err(env.status, env.code, env.message);
  }
}
