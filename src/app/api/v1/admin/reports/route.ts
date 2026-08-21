import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { getAdminReports } from "@/lib/services/reports.service";

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  const reports = await getAdminReports();
  return ok(reports);
}
