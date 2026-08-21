import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { markAllNotificationsRead } from "@/lib/services/dashboard.service";

export async function PATCH() {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const result = await markAllNotificationsRead(auth.user.id);
  return ok(result);
}
