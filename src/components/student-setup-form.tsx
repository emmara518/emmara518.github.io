"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle as Loader2, LockKeyhole } from "lucide-react";
import { Button } from "./ui";
import { Field, PasswordInput } from "./ui-field";

export function StudentSetupForm() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const value = params.get("token") ?? "";
    if (value) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    const timer = window.setTimeout(() => {
      setToken(value);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/student-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        setError(
          json?.error?.code === "INVITATION_INVALID"
            ? "رابط إعداد الحساب غير صالح أو منتهي. اطلب رابطاً جديداً من الإدارة."
            : json?.error?.message ?? "تعذر إعداد الحساب",
        );
        return;
      }
      setDone(true);
      setPassword("");
      setConfirm("");
    } catch {
      setError("تعذر الاتصال بالخادم — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <p className="py-6 text-center text-sm text-muted">جارٍ التحقق من الرابط...</p>;
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
          رابط إعداد الحساب غير صالح أو منتهي. اطلب رابطاً جديداً من الإدارة.
        </p>
        <Link href="/login" className="text-sm font-bold text-brand hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto text-success" size={40} />
        <p className="text-sm font-bold leading-relaxed text-ink">
          تم إعداد حسابك بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور التي اخترتها.
        </p>
        <Link href="/login?setup=success" className="font-bold text-brand hover:underline">
          الانتقال لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-semibold leading-relaxed text-brand">
        اختر كلمة مرور قوية خاصة بك. لا تشارك رابط الإعداد مع أي شخص آخر.
      </p>
      <Field label="كلمة المرور الجديدة" hint="8 أحرف على الأقل">
        <PasswordInput
          dir="ltr"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <Field label="تأكيد كلمة المرور">
        <PasswordInput
          dir="ltr"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      {error ? <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger">{error}</p> : null}
      <Button type="submit" disabled={loading} size="lg" className="w-full">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <LockKeyhole size={17} />}
        {loading ? "جارٍ إعداد الحساب..." : "إعداد كلمة المرور"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted">
        بعد الإعداد يمكنك تسجيل الدخول من صفحة الدخول. لن يظهر الرابط مرة أخرى.
      </p>
    </form>
  );
}
