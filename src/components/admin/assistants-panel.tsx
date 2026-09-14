"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Card, Button, Input, Field, Badge, EmptyState } from "@/components/ui";
import { PERMISSION_GROUPS, HIGH_RISK_PERMISSIONS, type GranularPermission } from "@/lib/rbac";

type Assistant = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  permissions: string[];
};

const HIGH_RISK = new Set<string>(HIGH_RISK_PERMISSIONS);

/**
 * Super-Admin-only panel to create assistants and grant/revoke their granular
 * permissions. All calls hit the super-admin API; enforcement is server-side.
 */
export function AssistantsPanel() {
  const [list, setList] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/admin/assistants", { credentials: "include" });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر تحميل المساعدين");
        return;
      }
      setList(json.data.assistants);
      setError(null);
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/assistants", { credentials: "include" })
      .then((r) => r.json())
      .then((json: { ok: boolean; data?: { assistants: Assistant[] }; error?: { message?: string } }) => {
        if (cancelled) return;
        if (json.ok && json.data) setList(json.data.assistants);
        else setError(json.error?.message ?? "تعذر تحميل المساعدين");
      })
      .catch(() => {
        if (!cancelled) setError("مشكلة في الاتصال");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createAssistant(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/v1/admin/assistants", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, permissions: [] }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر إنشاء المساعد");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      setNotice("تم إنشاء حساب المساعد مع صلاحيات فارغة (لا يملك أي صلاحية حتى تمنحها).");
      await load();
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(a: Assistant) {
    setEditingId(a.id);
    setDraft(a.permissions);
    setNotice(null);
    setError(null);
  }

  function toggle(p: string) {
    setDraft((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function savePermissions(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/assistants/${id}/permissions`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: draft }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر حفظ الصلاحيات");
        return;
      }
      setNotice(`تم تحديث الصلاحيات (${draft.length} صلاحية).`);
      setEditingId(null);
      await load();
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(a: Assistant) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/assistants/${a.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "تعذر تحديث الحالة");
        return;
      }
      setNotice(a.isActive ? "تم تعطيل المساعد." : "تم تنشيط المساعد.");
      await load();
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-ink">إنشاء حساب مساعد</h2>
          <Badge tone="outline">صلاحيات مبدئية فارغة</Badge>
        </div>
        <form onSubmit={createAssistant} className="grid gap-3 sm:grid-cols-3">
          <Field label="الاسم">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المساعد" />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="assistant@example.com" />
          </Field>
          <Field label="كلمة المرور (8+ أحرف)">
            <Input required type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={busy}>إنشاء المساعد</Button>
          </div>
        </form>
      </Card>

      {error ? <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger">{error}</p> : null}
      {notice ? <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-bold text-ink">{notice}</p> : null}

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-black text-ink">المساعدون ({list.length})</h2>
        {loading ? (
          <p className="text-sm text-muted">جارٍ التحميل…</p>
        ) : list.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={22} />} title="لا يوجد مساعدون" hint="أنشئ أول حساب مساعد ثم امنحه الصلاحيات المطلوبة." />
        ) : (
          <ul className="space-y-3">
            {list.map((a) => (
              <li key={a.id} className="rounded-2xl border border-line bg-surface2/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{a.name}</p>
                    <p className="font-mono text-xs text-muted" dir="ltr">{a.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={a.isActive ? "brand" : "outline"}>{a.isActive ? "نشط" : "معطّل"}</Badge>
                    <Badge tone="outline">{a.permissions.length} صلاحية</Badge>
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(a)}>تعديل الصلاحيات</Button>
                    <Button type="button" size="sm" variant={a.isActive ? "danger" : "primary"} disabled={busy} onClick={() => toggleActive(a)}>
                      {a.isActive ? "تعطيل" : "تنشيط"}
                    </Button>
                  </div>
                </div>

                {a.permissions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.permissions.map((p) => (
                      <Badge key={p} tone={HIGH_RISK.has(p) ? "danger" : "outline"}>{p}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted">لا يملك أي صلاحية (منع افتراضي).</p>
                )}

                {editingId === a.id ? (
                  <div className="mt-4 space-y-4 rounded-xl border border-line bg-surface p-4">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.key} className="space-y-2">
                        <p className="text-xs font-black text-ink">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.permissions.map((p) => {
                            const on = draft.includes(p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => toggle(p)}
                                aria-pressed={on}
                                className={
                                  "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors " +
                                  (on
                                    ? HIGH_RISK.has(p)
                                      ? "border-danger/40 bg-danger/10 text-danger"
                                      : "border-brand/40 bg-brand/10 text-brand"
                                    : "border-line bg-surface2 text-muted hover:text-ink")
                                }
                              >
                                {p}
                                {HIGH_RISK.has(p) ? " ⚠" : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button type="button" size="sm" disabled={busy} onClick={() => savePermissions(a.id)}>
                        حفظ الصلاحيات ({draft.length})
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>إلغاء</Button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
