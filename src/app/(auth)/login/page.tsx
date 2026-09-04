export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <AuthShell
      title="تسجيل الدخول"
      sub="ادخل إلى حسابك لمتابعة رحلتك التعليمية على منصة دروس ماث."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

