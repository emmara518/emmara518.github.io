export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { StudentSetupForm } from "@/components/student-setup-form";

export const metadata: Metadata = { title: "إعداد كلمة المرور" };

export default function SetupPasswordPage() {
  return (
    <AuthShell
      title="إعداد كلمة المرور"
      sub="اختر كلمة مرور خاصة بك لتفعيل حساب الطالب. رابط الإعداد صالح مرة واحدة ولمدة محدودة."
    >
      <StudentSetupForm />
    </AuthShell>
  );
}
