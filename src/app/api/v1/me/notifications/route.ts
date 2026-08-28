import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { markAllNotificationsRead, getUserNotifications } from "@/lib/services/dashboard.service";

export async function GET() {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const notifications = await getUserNotifications(auth.user.id, 50);
  return ok({ notifications });
}

export async function PATCH() {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const result = await markAllNotificationsRead(auth.user.id);
  return ok(result);
}
