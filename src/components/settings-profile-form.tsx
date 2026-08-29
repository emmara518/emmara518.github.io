"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge, buttonStyles, Card, Field, Input } from "@/components/ui";
import { formatDate } from "@/lib/format";

export type ProfileShape = {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  gradeName: string | null;
  createdAt: Date | string;
};

/**
 * Profile card with an inline "edit" toggle.
 *
 * In v1 the server doesn't expose a profile PATCH route, so saving
 * surfaces an inline "coming soon" message and leaves the form intact.
 * The shape and validation mirror what a real route would accept so
 * swapping it in later is a one-line change.
 */
export function SettingsProfileForm({ profile }: { profile: ProfileShape }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/v1/me/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.status === 404) {
        setInfo("تحديث البيانات قيد التجهيز — حاول لاحقًا.");
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message ?? "تعذر الحفظ");
        return;
      }
      setInfo("تم الحفظ");
      setEditing(false);
      router.refresh();
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setName(profile.name);
    setEmail(profile.email);
    setPhone(profile.phone ?? "");
    setError(null);
    setInfo(null);
    setEditing(false);
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar
          name={profile.name}
          src={profile.avatarUrl}
          size="lg"
          tone="brand-soft"
          className="size-14 text-lg"
        />
        <div className="min-w-0 space-y-0.5">
          <p className="text-base font-black text-ink">{profile.name}</p>
          <p className="font-mono text-xs text-muted" dir="ltr">
            {profile.email}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.phone ? (
              <Badge tone="muted">
                <span dir="ltr">{profile.phone}</span>
              </Badge>
            ) : null}
            {profile.gradeName ? <Badge tone="brand">{profile.gradeName}</Badge> : null}
            <Badge tone="outline">عضو منذ {formatDate(profile.createdAt)}</Badge>
          </div>
        </div>
        <div className="ms-auto">
          {editing ? null : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={buttonStyles("outline", "sm")}
            >
              <Pencil size={14} />
              تعديل
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <form
          className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Field label="الاسم">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              required
            />
          </Field>
          <Field label="رقم الموبايل" hint="اتركه فارغًا لإزالته.">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              inputMode="tel"
              placeholder="01xxxxxxxxx"
            />
          </Field>
          <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-2">
            {error ? (
              <span className="ms-auto text-xs font-semibold text-danger">{error}</span>
            ) : info ? (
              <span className="ms-auto text-xs font-semibold text-success">{info}</span>
            ) : null}
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className={buttonStyles("ghost", "sm")}
            >
              <X size={14} />
              إلغاء
            </button>
            <button
              type="submit"
              disabled={busy}
              className={buttonStyles("primary", "sm")}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              حفظ
            </button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
