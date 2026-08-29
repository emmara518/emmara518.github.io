"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle as Loader2, Send } from "lucide-react";
import { Button, Card, Field, Select, Textarea } from "./ui";

export function CommunityComposer({
  courses,
  groups = [],
}: {
  courses: { slug: string; title: string }[];
  groups?: { id: string; name: string; scope: string }[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(courses[0]?.slug ?? "");
  const [groupId, setGroupId] = useState<string>("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || body.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const url = new URL(`/api/v1/courses/${slug}/posts`, window.location.origin);
      if (groupId) url.searchParams.set("groupId", groupId);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (json.ok) {
        setBody("");
        setDone(true);
        router.refresh();
      } else {
        setError(json.error?.message ?? "تعذّر نشر السؤال");
      }
    } catch {
      setError("مشكلة في الاتصال بالسيرفر");
    } finally {
      setBusy(false);
    }
  }

  if (courses.length === 0) {
    return (
      <Card className="space-y-2 p-5 text-center">
        <p className="text-sm font-bold">مجتمع الطلاب</p>
        <p className="text-xs leading-relaxed text-muted">
          اشترك في أي كورس لتستطيع طرح أسئلتك على مستر محمد سعيد وفريق المساعدين.
        </p>
      </Card>
    );
  }

  return (
    <Card className="fixed inset-x-0 bottom-0 z-20 space-y-3 rounded-none border-x-0 border-b-0 bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lift lg:static lg:inset-auto lg:z-auto lg:space-y-3 lg:rounded-2xl lg:border lg:bg-surface lg:p-5 lg:pb-5 lg:shadow-none">
      <p className="text-sm font-bold">اسأل مستر محمد سعيد وفريق المساعدين</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="الكورس">
          <Select value={slug} onChange={(e) => setSlug(e.target.value)} className="h-10 text-xs">
            {courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </Select>
        </Field>
        {groups.length > 0 && (
          <Field label="مجموعة النقاش (اختياري)">
            <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-10 text-xs">
              <option value="">— بدون مجموعة (عام) —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.scope === "public" ? "عام" : g.scope === "course" ? "كورس" : g.scope === "stage" ? "مرحلة" : "خاص"})
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="سؤالك">
          <Textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب سؤالك أو الجزء الذي تريد شرحه بالتفصيل..."
          />
        </Field>
        {done && !busy && (
          <p className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-[11px] font-semibold text-gold">
            تم إرسال سؤالك — سيظهر هنا للجميع بعد مراجعة المشرفين.
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] leading-relaxed text-muted">
            يُنشر السؤال بعد مراجعة المشرفين، وسيصلك الحل كتعليق من فريق المساعدين.
          </p>
          <Button type="submit" disabled={busy || body.trim().length < 2} variant="primary" size="sm">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            إرسال
          </Button>
        </div>
      </form>
    </Card>
  );
}
