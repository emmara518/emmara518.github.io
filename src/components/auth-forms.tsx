"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle as Loader2, LogIn, UserPlus } from "lucide-react";
import { Button, Field, Input } from "./ui";
import { isAdminRole, type Role } from "@/lib/rbac";
import { safeNext } from "@/lib/safe-next";

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold leading-6 text-danger">{message}</p>
  );
}

export function LoginForm({ authDisabled = false }: { authDisabled?: boolean }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performLogin(targetEmail: string, targetPass: string, redirectPath?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر تسجيل الدخول");
        return;
      }
      const role = json.data.user.role as Role;
      const safeOverride = safeNext(redirectPath ?? null);
      const target =
        safeOverride ??
        next ??
        (isAdminRole(role) ? "/admin" : role === "parent" ? "/parent" : "/dashboard");
      router.push(target);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  const IS_DEV = process.env.NODE_ENV === "development";

  const quickLogin = (who: "student" | "teacher") => async () => {
    if (!IS_DEV) return;
    const targetEmail = `${who}@dros-math.com`;
    setEmail(targetEmail);
    setPassword("12345678");
    await performLogin(targetEmail, "12345678");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {authDisabled && (
        <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-[13px] font-medium leading-relaxed text-brand">
          وضع التطوير: المصادقة معطّلة مؤقتاً — جميع صفحات المنصة تُفتح تلقائياً بصلاحيات مدير النظام.
        </div>
      )}

      <Field label="البريد الإلكتروني / رقم موبايل ولي الأمر">
        <Input
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="username"
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

      {IS_DEV && (
        <div className="space-y-2 pt-2">
          <p className="text-center font-mono text-[11px] text-muted">— تسجيل دخول فوري بنقرة واحدة —</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["student", "طالب"],
              ["teacher", "مدرّس"],
            ] as const).map(([who, label]) => (
              <button
                key={who}
                type="button"
                disabled={loading}
                onClick={quickLogin(who)}
                className="rounded-lg border border-line bg-surface2 px-2 py-2 text-xs font-bold text-ink transition-colors hover:border-neon-lime hover:text-neon-lime cursor-pointer disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="pt-2 text-center text-sm text-muted">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-bold text-brand hover:underline">
          أنشئ حسابك مجانًا
        </Link>
        <span className="mx-1.5 text-line">|</span>
        <Link href="/register-parent" className="font-bold text-gold hover:underline">
          ولي أمر؟ سجّل برقم موبايلك
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
  const [guardianPhone, setGuardianPhone] = useState("");
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
        body: JSON.stringify({ name, email, phone, guardianPhone, password }),
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
      <Field
        label="رقم موبايل ولي الأمر"
        hint="يُستخدم لربط حساب ولي الأمر بنتائجك — سيتمكن من متابعة نتائجك واختباراتك به"
      >
        <Input
          dir="ltr"
          inputMode="numeric"
          required
          pattern="01[0-9]{9}"
          title="11 رقمًا يبدأ بـ 01"
          value={guardianPhone}
          onChange={(e) => setGuardianPhone(e.target.value)}
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

export function ParentRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/register-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر إنشاء الحساب");
        return;
      }
      router.push("/parent");
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl bg-[var(--gold-soft)] px-4 py-3 text-[13px] font-semibold leading-6 text-gold">
        أدخل رقم الموبايل الذي أدخله ابنك في خانة «رقم موبايل ولي الأمر» وقت إنشاء حسابه — سنربط حسابك بكل أبنائه المشتركين تلقائيًا.
      </div>
      <Field label="اسم ولي الأمر">
        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم بالكامل" autoComplete="name" />
      </Field>
      <Field label="رقم موبايل ولي الأمر" hint="نفس الرقم الذي سجّله ابنك — 11 رقمًا يبدأ بـ 01">
        <Input
          dir="ltr"
          inputMode="numeric"
          required
          pattern="01[0-9]{9}"
          title="11 رقمًا يبدأ بـ 01"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01xxxxxxxxx"
          autoComplete="tel"
        />
      </Field>
      <Field label="كلمة المرور" hint="8 أحرف على الأقل — ستدخل بها لاحقًا برقم موبايلك">
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
      <Button type="submit" disabled={loading} size="lg" variant="gold" className="w-full">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
        إنشاء حساب ولي الأمر
      </Button>
      <p className="pt-2 text-center text-sm text-muted">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-bold text-brand hover:underline">
          سجّل الدخول برقم موبايلك
        </Link>
      </p>
    </form>
  );
}
