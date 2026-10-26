import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok } from "@/lib/http";
import { listPaymentRequestsAdmin } from "@/lib/services/payment-requests.service";

export async function GET(request: Request) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const requests = await listPaymentRequestsAdmin(status);
  return ok({ requests });
}
