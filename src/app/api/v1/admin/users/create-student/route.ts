import { requireSuperAdmin } from "@/lib/permission-guard";
import { err } from "@/lib/http";

export async function POST() {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;

  return err(
    503,
    "STUDENT_PROVISIONING_DISABLED",
    "إنشاء حساب الطالب معطّل حتى يتم تفعيل تدفق آمن لتعيين كلمة المرور.",
  );
}
