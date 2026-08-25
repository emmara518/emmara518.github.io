import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { redeemCodeSchema } from "@/lib/contracts";
import { redeemCode } from "@/lib/services/billing.service";
import { toEnvelope } from "@/lib/errors";

/** Student code redemption — balance codes charge the wallet, access codes unlock a course. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "سجل الدخول مطلوب");
  if (!can(auth.user.role, "wallet:use")) return err(403, "FORBIDDEN", "غير مسموح لك بشحن الأكواد");

  const parsed = await parseJson(request, redeemCodeSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const result = await redeemCode(auth.user.id, parsed.data.code);
    return ok(result, { status: 200 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
