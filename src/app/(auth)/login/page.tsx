import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <AuthShell
      title="أهلًا بعودتك"
      sub="سجّل دخولك لمتابعة دروسك واختباراتك من حيث توقفت."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
