import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok } from "@/lib/http";
import { listOrdersAdmin } from "@/lib/services/admin.service";

export async function GET() {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const orders = await listOrdersAdmin();
  return ok({ orders });
}
