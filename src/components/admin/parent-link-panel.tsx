"use client";

import { useState, type FormEvent } from "react";
import { Link2, Loader2 } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { Field } from "@/components/ui-field";

/** Super Admin-only manual parent/student linking for UAT. */
export function ParentLinkPanel() {
  const [parentEmail, setParentEmail] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/v1/admin/parent-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentEmail, studentEmail }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        setError(json?.error?.message ?? "تعذّر ربط الحسابين");
        return;
      }
      setNotice("تم ربط ولي الأمر بالطالب بنجاح.");
      setParentEmail("");
      setStudentEmail("");
    } catch {
      setError("مشكلة في الاتصال بالسيرفر");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Link2 size={18} className="text-brand" />
        <h2 className="text-base font-black text-ink">ربط ولي أمر بطالب</h2>
      </div>
      <p className="text-sm leading-relaxed text-muted">
        الربط اليدوي متاح للمدير العام فقط. استخدمه بعد التحقق من هوية ولي الأمر.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="بريد ولي الأمر">
          <Input
            required
            type="email"
            dir="ltr"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="parent@example.com"
          />
        </Field>
        <Field label="بريد الطالب">
          <Input
            required
            type="email"
            dir="ltr"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            placeholder="student@example.com"
          />
        </Field>
        {error ? (
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-bold text-success">
            {notice}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} variant="primary" className="w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
          ربط الحسابين
        </Button>
      </form>
    </Card>
  );
}
