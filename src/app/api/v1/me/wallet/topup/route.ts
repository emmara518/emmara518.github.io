import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { topUpSchema } from "@/lib/contracts";
import { topUpWallet } from "@/lib/services/billing.service";

/** Demo top-up (manual provider). A real PSP adapter plugs in behind this boundary. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "wallet:use")) return err(403, "FORBIDDEN", "لا تملك استخدام المحفظة");

  const parsed = await parseJson(request, topUpSchema);
  if ("response" in parsed) return parsed.response;

  const result = await topUpWallet(auth.user.id, Math.round(parsed.data.amountEgp * 100));
  return ok({ balanceCents: result.balanceCents });
}
