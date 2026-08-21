import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { getStudentDashboard } from "@/lib/services/dashboard.service";

export async function GET() {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const data = await getStudentDashboard(auth.user);
  return ok(data);
}
