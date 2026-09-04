import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";
import { MathCanvas } from "@/components/marketing";
import { listCourses, listGrades, listSubjects } from "@/lib/services/catalog.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "الكورسات" };

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;
  const [courses, grades, subjects] = await Promise.all([
    listCourses(grade ? { gradeSlug: grade } : undefined),
    listGrades(),
    listSubjects(),
  ]);

  return (
    <main className="relative">
      <div className="relative overflow-hidden border-b border-line">
        <MathCanvas className="opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="type-eyebrow-display">CATALOG</div>
          <h1 className="mt-3 type-headline-display">كورسات دروس ماث</h1>
          <div className="type-flourish mt-3" aria-hidden />
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">
            اختر صفك وفرع الرياضيات، وابدأ بالدروس المجانية قبل الاشتراك — كل كورس يشمل ملفات واختبارات إلكترونية.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <CatalogBrowser
          initialCourses={courses}
          grades={grades.map((g) => ({ id: g.id, name: g.name, slug: g.slug }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
          initialGrade={grade ?? ""}
        />
      </div>
    </main>
  );
}
