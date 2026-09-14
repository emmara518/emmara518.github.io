import { err, ok } from "@/lib/http";
import { requirePermission } from "@/lib/permission-guard";
import { listActiveSessionsAdmin } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function GET() {
  const gate = await requirePermission("students.view");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  try {
    const sessions = await listActiveSessionsAdmin(200);
    return ok({ sessions });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}