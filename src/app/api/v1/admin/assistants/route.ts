import { z } from "zod";
import { err, ok, parseJson } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/permission-guard";
import { createAssistant, listAssistants, sanitizePermissions } from "@/lib/assistant-permissions";
import { toEnvelope } from "@/lib/errors";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  permissions: z.array(z.string()).optional(),
});

export async function GET() {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  try {
    const assistants = await listAssistants();
    return ok({ assistants });
  } catch (e) {
    const env = toEnvelope(e);
    return err(env.status, env.code, env.message);
  }
}

export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;

  const parsed = await parseJson(request, createSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const assistant = await createAssistant(gate.user, {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      permissions: sanitizePermissions(parsed.data.permissions),
    });
    return ok({ assistant }, { status: 201 });
  } catch (e) {
    const env = toEnvelope(e);
    return err(env.status, env.code, env.message);
  }
}
