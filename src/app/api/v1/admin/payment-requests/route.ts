import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { listPaymentRequestsAdmin } from "@/lib/services/payment-requests.service";

export async function GET(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "صلاحيات الإدارة مطلوبة");
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const requests = await listPaymentRequestsAdmin(status);
  return ok({ requests });
}
