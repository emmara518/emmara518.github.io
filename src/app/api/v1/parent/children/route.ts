import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { getChildren } from "@/lib/services/parent.service";
import { toEnvelope } from "@/lib/errors";

/** Parent portal: overview of every linked child with a results summary. */
export async function GET() {
  const auth = await requireApiUser(["parent", "admin"]);
  if (!("user" in auth)) {
    return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "هذه المنطقة لأولياء الأمور");
  }
  try {
    const data = await getChildren(auth.user.id);
    return ok(data);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
