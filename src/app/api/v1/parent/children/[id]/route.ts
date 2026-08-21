import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { getChildProgress } from "@/lib/services/parent.service";
import { toEnvelope } from "@/lib/errors";

/** Parent portal: read-only view of a LINKED child's learning. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["parent", "admin"]);
  if (!("user" in auth)) {
    return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "هذه المنطقة لأولياء الأمور");
  }
  const { id } = await params;
  try {
    const data = await getChildProgress(auth.user.id, id);
    return ok(data);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
