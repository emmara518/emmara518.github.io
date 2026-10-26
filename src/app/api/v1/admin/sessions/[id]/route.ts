import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok } from "@/lib/http";
import { revokeSessionAdmin } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const { id } = await params;
  try {
    return ok(await revokeSessionAdmin(auth.user, id));
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}