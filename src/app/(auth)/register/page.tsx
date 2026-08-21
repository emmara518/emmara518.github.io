import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "إنشاء حساب" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="أنشئ حسابك المجاني"
      sub="دقيقة واحدة تفصلك عن أول درس مجاني وامتحانك التفاعلي الأول."
    >
      <RegisterForm />
    </AuthShell>
  );
}
