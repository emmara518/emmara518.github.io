"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Search } from "lucide-react";
import { CourseCard, type CourseCardData } from "./marketing";
import { EmptyState, Input, Select, Skeleton } from "./ui";
import { cn } from "@/lib/utils";

type Grade = { id: string; name: string; slug: string };
type Subject = { id: string; name: string; slug: string };

async function fetchCourses(params: { grade: string; subject: string; q: string }) {
  const sp = new URLSearchParams();
  if (params.grade) sp.set("grade", params.grade);
  if (params.subject) sp.set("subject", params.subject);
  if (params.q) sp.set("q", params.q);
  const res = await fetch(`/api/v1/courses?${sp.toString()}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message ?? "فشل التحميل");
  return json.data.courses as CourseCardData[];
}

export function CatalogBrowser({
  initialCourses,
  grades,
  subjects,
  initialGrade = "",
}: {
  initialCourses: CourseCardData[];
  grades: Grade[];
  subjects: Subject[];
  initialGrade?: string;
}) {
  const [grade, setGrade] = useState(initialGrade);
  const [subject, setSubject] = useState("");
  const [q, setQ] = useState("");
  const [courses, setCourses] = useState<CourseCardData[]>(initialCourses);
  const [loading, setLoading] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current && grade === initialGrade && !subject && !q) {
      firstRun.current = false;
      return;
    }
    firstRun.current = false;
    setLoading(true);
    const t = setTimeout(() => {
      fetchCourses({ grade, subject, q })
        .then(setCourses)
        .catch(() => setCourses([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [grade, subject, q, initialGrade]);

  return (
    <div className="space-y-8">
      {/* filter bar */}
      <div className="grid gap-3 rounded-2xl border border-line bg-surface/70 p-3 backdrop-blur sm:grid-cols-[1fr_220px_220px]">
        <div className="relative">
          {loading ? (
            <Loader2
              size={16}
              aria-hidden
              className="absolute end-3.5 top-1/2 -translate-y-1/2 animate-spin text-brand"
            />
          ) : (
            <Search
              size={16}
              aria-hidden
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
          )}
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم الكورس…"
            className="pe-10"
            aria-label="بحث"
          />
        </div>
        <Select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="الصف">
          <option value="">كل الصفوف</option>
          {grades.map((g) => (
            <option key={g.id} value={g.slug}>
              {g.name}
            </option>
          ))}
        </Select>
        <Select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="الفرع">
          <option value="">كل فروع الرياضيات</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>
          {courses.length} كورس {loading ? "· جارٍ التحديث…" : ""}
        </span>
        <span>{grade || subject || q ? "نتائج مفلترة" : "كل الكورسات المنشورة"}</span>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={22} />}
          title="لا توجد كورسات مطابقة"
          hint="جرّب توسيع البحث أو إزالة بعض عوامل التصفية."
          action={
            <button
              onClick={() => {
                setGrade("");
                setSubject("");
                setQ("");
              }}
              className="text-sm font-bold text-brand hover:underline"
            >
              إعادة ضبط التصفية
            </button>
          }
        />
      ) : (
        <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3")}>
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
