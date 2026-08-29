import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { markNotificationRead } from "@/lib/services/dashboard.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { id } = await params;
  const result = await markNotificationRead(auth.user.id, id);
  return ok(result);
}
