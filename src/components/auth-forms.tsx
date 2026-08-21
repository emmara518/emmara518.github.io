"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle as Loader2, LogIn, UserPlus } from "lucide-react";
import { Button, Field, Input } from "./ui";
import { isAdminRole, type Role } from "@/lib/rbac";

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold leading-6 text-danger">{message}</p>
  );
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر تسجيل الدخول");
        return;
      }
      const role = json.data.user.role as Role;
      router.push(next ?? (isAdminRole(role) ? "/admin" : "/dashboard"));
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  const demo = (who: "student" | "admin" | "teacher") => () => {
    setEmail(`${who}@dros-math.com`);
    setPassword("12345678");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="البريد الإلكتروني">
        <Input
          type="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </Field>
      <Field label="كلمة المرور">
        <Input
          type="password"
          dir="ltr"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </Field>
      <ErrorNote message={error} />
      <Button type="submit" disabled={loading} size="lg" className="w-full">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
        تسجيل الدخول
      </Button>

      <div className="space-y-2">
        <p className="text-center font-mono text-[11px] text-muted">— حسابات تجريبية (12345678) —</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ["student", "طالب"],
            ["teacher", "مدرّس"],
            ["admin", "إدارة"],
          ] as const).map(([who, label]) => (
            <button
              key={who}
              type="button"
              onClick={demo(who)}
              className="rounded-lg border border-line bg-surface2 px-2 py-2 text-xs font-bold text-muted transition-colors hover:border-brand hover:text-brand"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="pt-2 text-center text-sm text-muted">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-bold text-brand hover:underline">
          أنشئ حسابك مجانًا
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر إنشاء الحساب");
        return;
      }
      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="الاسم بالكامل">
        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الطالب" autoComplete="name" />
      </Field>
      <Field label="البريد الإلكتروني">
        <Input
          type="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </Field>
      <Field label="رقم الموبايل" hint="اختياري — 11 رقمًا يبدأ بـ 01">
        <Input
          dir="ltr"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01xxxxxxxxx"
          autoComplete="tel"
        />
      </Field>
      <Field label="كلمة المرور" hint="8 أحرف على الأقل">
        <Input
          type="password"
          dir="ltr"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </Field>
      <ErrorNote message={error} />
      <Button type="submit" disabled={loading} size="lg" className="w-full">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
        إنشاء الحساب
      </Button>
      <p className="pt-2 text-center text-sm text-muted">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-bold text-brand hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
