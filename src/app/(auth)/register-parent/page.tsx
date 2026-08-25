import type { Metadata } from "next";
import { ParentRegisterForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "حساب ولي الأمر" };

export default function ParentRegisterPage() {
  return (
    <AuthShell
      title="بوابة أولياء الأمور"
      sub="أنشئ حسابك برقم الموبايل الذي أدخله ابنك وقت إنشاء حسابه، وتابع نتائجه واختباراته وتقدّمه لحظة بلحظة."
    >
      <ParentRegisterForm />
    </AuthShell>
  );
}
