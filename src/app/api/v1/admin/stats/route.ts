import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { getAdminOverview } from "@/lib/services/admin.service";

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  const overview = await getAdminOverview();
  return ok(overview);
}
