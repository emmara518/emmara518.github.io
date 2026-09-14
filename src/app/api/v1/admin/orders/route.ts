import { err, ok } from "@/lib/http";
import { requirePermission } from "@/lib/permission-guard";
import { listOrdersAdmin } from "@/lib/services/admin.service";

export async function GET() {
  const gate = await requirePermission("orders.view");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const orders = await listOrdersAdmin();
  return ok({ orders });
}
