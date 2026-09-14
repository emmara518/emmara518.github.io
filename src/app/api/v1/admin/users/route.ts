import { requirePermission } from "@/lib/permission-guard";
import { ok } from "@/lib/http";
import { listUsersAdmin } from "@/lib/services/admin.service";

export async function GET() {
  const gate = await requirePermission("students.view");
  if ("response" in gate) return gate.response;
  const users = await listUsersAdmin();
  return ok({ users });
}
