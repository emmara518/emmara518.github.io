import { getSessionUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { permissionsFor } from "@/lib/rbac";
import { getWalletSummary } from "@/lib/services/billing.service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return err(401, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const wallet = await getWalletSummary(user.id);
  return ok({
    user: { ...user, permissions: permissionsFor(user.role) },
    walletBalanceCents: wallet.balanceCents,
  });
}
