"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChartColumn,
  LoaderCircle as Loader2,
  Plus,
  Receipt,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge, Button, Card, Divider, Field, Input, Select, Textarea } from "./ui";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/rbac";
import { formatDate, formatEGP } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── DTOs (server-serialized) ── */
type Overview = {
  stats: { students: number; publishedCourses: number; revenueCents: number; activeSubscriptions: number };
  revenueByMonth: { month: string; total: number }[];
  recentOrders: { id: string; totalCents: number; status: string; createdAt: string; studentName: string; courseTitle: string }[];
  recentAudit: { id: string; action: string; entity: string; createdAt: string; actorName: string | null }[];
};
type CourseRow = {
  id: string; slug: string; title: string; status: "draft" | "published" | "archived";
  priceCents: number; createdAt: string; gradeName: string; subjectName: string; lessonsCount: number;
};
type UserRow = { id: string; name: string; email: string; role: Role; isActive: boolean; createdAt: string; balanceCents: number };
type CouponRow = { id: string; code: string; percentOff: number; maxUses: number; usedCount: number; isActive: boolean; createdAt: string; expiresAt: string | null };
type OrderRow = { id: string; totalCents: number; discountCents: number; status: string; createdAt: string; studentName: string; studentEmail: string; courseTitle: string };

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: ChartColumn },
  { id: "courses", label: "الكورسات", icon: BookOpen },
  { id: "users", label: "المستخدمون", icon: Users },
  { id: "finance", label: "المدفوعات", icon: Receipt },
  { id: "coupons", label: "الكوبونات", icon: Ticket },
] as const;
type TabId = (typeof TABS)[number]["id"];

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "muted" | "danger" | "gold" }> = {
  draft: { label: "مسودة", tone: "muted" },
  published: { label: "منشور", tone: "success" },
  archived: { label: "مؤرشف", tone: "danger" },
  paid: { label: "مدفوع", tone: "success" },
  pending: { label: "معلق", tone: "gold" },
  failed: { label: "فاشل", tone: "danger" },
  refunded: { label: "مسترد", tone: "muted" },
};

export function AdminConsole({
  actor,
  canManageUsers,
  overview,
  courses,
  users,
  coupons,
  orders,
  grades,
  subjects,
}: {
  actor: { name: string; role: Role };
  canManageUsers: boolean;
  overview: Overview;
  courses: CourseRow[];
  users: UserRow[];
  coupons: CouponRow[];
  orders: OrderRow[];
  grades: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // course form
  const [cTitle, setCTitle] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cGrade, setCGrade] = useState(grades[0]?.id ?? "");
  const [cSubject, setCSubject] = useState(subjects[0]?.id ?? "");
  const [cPrice, setCPrice] = useState("199");
  const [cSummary, setCSummary] = useState("");

  // coupon form
  const [kCode, setKCode] = useState("");
  const [kPercent, setKPercent] = useState("20");
  const [kMax, setKMax] = useState("100");

  async function api(path: string, init?: RequestInit): Promise<boolean> {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const json = await res.json();
      if (!json.ok) {
        setNote({ kind: "err", text: json.error?.message ?? "فشلت العملية" });
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setNote({ kind: "err", text: "مشكلة في الاتصال" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createCourse(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/courses", {
      method: "POST",
      body: JSON.stringify({
        title: cTitle,
        slug: cSlug,
        summary: cSummary,
        description: cSummary,
        gradeId: cGrade,
        subjectId: cSubject,
        priceEgp: Number(cPrice || "0"),
      }),
    });
    if (done) {
      setNote({ kind: "ok", text: "أُنشئ الكورس كمسودة — انشره عند جاهزيته." });
      setCTitle(""); setCSlug(""); setCSummary("");
    }
  }

  async function createCoupon(e: FormEvent) {
    e.preventDefault();
    const done = await api("/api/v1/admin/coupons", {
      method: "POST",
      body: JSON.stringify({ code: kCode, percentOff: Number(kPercent), maxUses: Number(kMax) }),
    });
    if (done) {
      setNote({ kind: "ok", text: "أُنشئ الكوبون بنجاح." });
      setKCode("");
    }
  }

  const maxRevenue = Math.max(1, ...overview.revenueByMonth.map((m) => m.total));
  const kpis = [
    { icon: TrendingUp, label: "إجمالي الإيرادات", value: formatEGP(overview.stats.revenueCents) },
    { icon: Users, label: "الطلاب المسجلون", value: overview.stats.students },
    { icon: BookOpen, label: "كورسات منشورة", value: overview.stats.publishedCourses },
    { icon: ShieldCheck, label: "اشتراكات نشطة", value: overview.stats.activeSubscriptions },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs tracking-[0.3em] text-gold">CONTROL·ROOM</p>
          <h1 className="text-3xl font-extrabold tracking-tight">لوحة الإدارة</h1>
          <p className="text-sm text-muted">
            {actor.name} · {ROLE_LABELS[actor.role]}
          </p>
        </div>
      </header>

      {/* tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
              tab === t.id ? "bg-brand text-white" : "text-muted hover:text-ink hover:bg-surface2",
            )}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {note ? (
        <p
          className={cn(
            "rounded-xl px-4 py-3 text-sm font-bold",
            note.kind === "ok" ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
          )}
        >
          {note.text}
        </p>
      ) : null}

      {/* ── overview ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label} className="flex items-center gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-brand">
                  <k.icon size={19} />
                </span>
                <div>
                  <p className="font-mono text-lg font-bold">{k.value}</p>
                  <p className="text-xs text-muted">{k.label}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-4 p-6">
              <h2 className="text-base font-extrabold">الإيرادات الشهرية</h2>
              <div className="flex h-44 items-end gap-3">
                {overview.revenueByMonth.length === 0 ? (
                  <p className="text-sm text-muted">لا بيانات بعد.</p>
                ) : (
                  overview.revenueByMonth.map((m) => (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                      <span className="font-mono text-[10px] text-muted">{formatEGP(m.total)}</span>
                      <div
                        className="w-full rounded-t-lg bg-[linear-gradient(180deg,var(--brand),var(--gold))] transition-all duration-700"
                        style={{ height: `${Math.max(6, (m.total / maxRevenue) * 100)}%` }}
                      />
                      <span className="font-mono text-[10px] text-muted" dir="ltr">{m.month}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="space-y-3 p-6">
              <h2 className="text-base font-extrabold">سجل التدقيق الأخير</h2>
              <ul className="space-y-2">
                {overview.recentAudit.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-xl bg-surface2/60 px-3.5 py-2.5 text-xs">
                    <span className="font-mono font-bold text-brand" dir="ltr">{a.action}</span>
                    <span className="text-muted">{a.actorName ?? "النظام"} · {formatDate(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="p-4 text-start font-semibold">الطالب</th>
                  <th className="p-4 text-start font-semibold">الكورس</th>
                  <th className="p-4 text-start font-semibold">الإجمالي</th>
                  <th className="p-4 text-start font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-line/60 last:border-0">
                    <td className="p-4 font-bold">{o.studentName}</td>
                    <td className="p-4 text-muted">{o.courseTitle}</td>
                    <td className="p-4 font-mono">{formatEGP(o.totalCents)}</td>
                    <td className="p-4">
                      <Badge tone={STATUS_LABEL[o.status]?.tone ?? "muted"}>{STATUS_LABEL[o.status]?.label ?? o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── courses ── */}
      {tab === "courses" && (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card ticks className="h-fit space-y-4 p-6 lg:sticky lg:top-24">
            <h2 className="inline-flex items-center gap-2 text-base font-extrabold">
              <Plus size={16} className="text-brand" /> كورس جديد
            </h2>
            <form onSubmit={createCourse} className="space-y-3.5">
              <Field label="عنوان الكورس">
                <Input required value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="الجبر — الصف الأول الثانوي" />
              </Field>
              <Field label="الرابط اللاتيني (slug)" hint="حروف لاتينية صغيرة وشرطات">
                <Input required dir="ltr" value={cSlug} onChange={(e) => setCSlug(e.target.value)} placeholder="algebra-1sec-term2" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="الصف">
                  <Select value={cGrade} onChange={(e) => setCGrade(e.target.value)}>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="الفرع">
                  <Select value={cSubject} onChange={(e) => setCSubject(e.target.value)}>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="السعر (جنيه مصري)">
                <Input required dir="ltr" type="number" min={0} value={cPrice} onChange={(e) => setCPrice(e.target.value)} />
              </Field>
              <Field label="وصف مختصر">
                <Textarea value={cSummary} onChange={(e) => setCSummary(e.target.value)} />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                إنشاء كمسودة
              </Button>
            </form>
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="p-4 text-start font-semibold">الكورس</th>
                  <th className="p-4 text-start font-semibold">السعر</th>
                  <th className="p-4 text-start font-semibold">الدروس</th>
                  <th className="p-4 text-start font-semibold">الحالة</th>
                  <th className="p-4 text-start font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-line/60 last:border-0">
                    <td className="p-4">
                      <p className="font-bold">{c.title}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted" dir="ltr">/courses/{c.slug}</p>
                    </td>
                    <td className="p-4 font-mono">{formatEGP(c.priceCents)}</td>
                    <td className="p-4 font-mono">{c.lessonsCount}</td>
                    <td className="p-4">
                      <Badge tone={STATUS_LABEL[c.status].tone}>{STATUS_LABEL[c.status].label}</Badge>
                    </td>
                    <td className="p-4">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void api(`/api/v1/admin/courses/${c.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ status: c.status === "published" ? "draft" : "published" }),
                          })
                        }
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                          c.status === "published"
                            ? "bg-surface2 text-muted hover:text-danger"
                            : "bg-[var(--brand-soft)] text-brand hover:bg-brand hover:text-white",
                        )}
                      >
                        {c.status === "published" ? "إيقاف" : "نشر"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── users ── */}
      {tab === "users" && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-4 text-start font-semibold">الاسم</th>
                <th className="p-4 text-start font-semibold">البريد</th>
                <th className="p-4 text-start font-semibold">الدور</th>
                <th className="p-4 text-start font-semibold">رصيد المحفظة</th>
                <th className="p-4 text-start font-semibold">التسجيل</th>
                <th className="p-4 text-start font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0">
                  <td className="p-4">
                    <span className="inline-flex items-center gap-2 font-bold">
                      <span className="grid size-7 place-items-center rounded-lg bg-[var(--brand-soft)] text-[11px] font-bold text-brand">
                        {u.name.trim().charAt(0)}
                      </span>
                      {u.name}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-muted" dir="ltr">{u.email}</td>
                  <td className="p-4">
                    {canManageUsers ? (
                      <Select
                        className="h-9 w-32 text-xs"
                        value={u.role}
                        onChange={(e) =>
                          void api(`/api/v1/admin/users/${u.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ role: e.target.value }),
                          }).then((done) => done && setNote({ kind: "ok", text: `حُدّث دور «${u.name}».` }))
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </Select>
                    ) : (
                      <Badge tone="muted">{ROLE_LABELS[u.role]}</Badge>
                    )}
                  </td>
                  <td className="p-4 font-mono text-xs">{formatEGP(u.balanceCents)}</td>
                  <td className="p-4 text-muted">{formatDate(u.createdAt)}</td>
                  <td className="p-4">
                    <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "نشط" : "معطل"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── finance ── */}
      {tab === "finance" && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-4 text-start font-semibold">الطالب</th>
                <th className="p-4 text-start font-semibold">الكورس</th>
                <th className="p-4 text-start font-semibold">الخصم</th>
                <th className="p-4 text-start font-semibold">الإجمالي</th>
                <th className="p-4 text-start font-semibold">الحالة</th>
                <th className="p-4 text-start font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line/60 last:border-0">
                  <td className="p-4">
                    <p className="font-bold">{o.studentName}</p>
                    <p className="font-mono text-[10px] text-muted" dir="ltr">{o.studentEmail}</p>
                  </td>
                  <td className="p-4 text-muted">{o.courseTitle}</td>
                  <td className="p-4 font-mono text-xs text-success">{o.discountCents ? `-${formatEGP(o.discountCents)}` : "—"}</td>
                  <td className="p-4 font-mono font-bold">{formatEGP(o.totalCents)}</td>
                  <td className="p-4">
                    <Badge tone={STATUS_LABEL[o.status]?.tone ?? "muted"}>{STATUS_LABEL[o.status]?.label ?? o.status}</Badge>
                  </td>
                  <td className="p-4 text-muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── coupons ── */}
      {tab === "coupons" && (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card ticks className="h-fit space-y-4 p-6 lg:sticky lg:top-24">
            <h2 className="inline-flex items-center gap-2 text-base font-extrabold">
              <Ticket size={16} className="text-gold" /> كوبون جديد
            </h2>
            <form onSubmit={createCoupon} className="space-y-3.5">
              <Field label="كود الكوبون">
                <Input required dir="ltr" value={kCode} onChange={(e) => setKCode(e.target.value.toUpperCase())} placeholder="DROS50" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="نسبة الخصم %">
                  <Input required dir="ltr" type="number" min={1} max={90} value={kPercent} onChange={(e) => setKPercent(e.target.value)} />
                </Field>
                <Field label="أقصى استخدام">
                  <Input required dir="ltr" type="number" min={1} value={kMax} onChange={(e) => setKMax(e.target.value)} />
                </Field>
              </div>
              <Button type="submit" disabled={busy} variant="gold" className="w-full">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                إنشاء الكوبون
              </Button>
            </form>
          </Card>

          <div className="grid gap-3">
            {coupons.map((c) => (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-[var(--gold-soft)] font-mono text-xs font-extrabold text-gold">
                    {c.percentOff}%
                  </span>
                  <div>
                    <p className="font-mono font-bold" dir="ltr">{c.code}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      استُخدم {c.usedCount} من {c.maxUses} مرة · أُنشئ {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge tone={c.isActive ? "success" : "danger"}>{c.isActive ? "نشط" : "موقوف"}</Badge>
              </Card>
            ))}
            {coupons.length === 0 ? <p className="text-sm text-muted">لا كوبونات بعد.</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
