import { DrosUniverseShowcase } from "@/components/dros-universe-showcase";
import { EquationMarquee, SectionHead } from "@/components/marketing";
import { InteractiveCourses3DSection } from "@/components/interactive-courses-3d";
import { CompactFeaturesSection } from "@/components/compact-features-ticker";
import { featuredCourses, listStagesWithGrades } from "@/lib/services/catalog.service";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui";

const TESTIMONIALS = [
  { name: "يوسف م.", grade: "الصف الثالث الثانوي", text: "أول مرة أحس إن المسألة ليها منطق مش خطوات محفوظة. شرح النهايات غيّر تعاملي مع التفاضل كله." },
  { name: "ملك س.", grade: "الصف الثاني الثانوي", text: "الامتحانات الإلكترونية بعد كل وحدة خلتني أعرف غلطي فورًا. رفعت ١٢ درجة في شهرين." },
  { name: "أم عمر", grade: "ولية أمر", text: "أتابع تقدم ابني بوضوح: كام فيديو اتفرج عليه، ونتيجة كل اختبار. متابعة حقيقية مش وعود." },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [courses, stages] = await Promise.all([featuredCourses(6), listStagesWithGrades()]);

  return (
    <main className="overflow-x-clip bg-bg text-ink min-h-screen">
      {/* ─── Hero Section & Universe Dashboard: Strict Mathematical Architecture ─── */}
      <DrosUniverseShowcase />

      {/* Marquee Math Equations */}
      <EquationMarquee />

      {/* ─── 3D Interactive Featured Courses (Hero Card Focus on Hover) ─── */}
      <InteractiveCourses3DSection courses={courses} />

      {/* ─── Features Animated Compact Ticker ─── */}
      <CompactFeaturesSection />

      {/* ─── Testimonials ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 border-t border-line">
        <Reveal>
          <SectionHead
            kicker="STUDENT REVIEWS"
            title="آراء الطلاب وأولياء الأمور"
            sub="تجارب حقيقية لطلاب مدارس اللغات والثانوية العامة مع مستر محمد سعيد."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <Card className="h-full p-6 space-y-4 rounded-2xl border-line bg-surface shadow-card">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-neon-lime font-black text-black">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-ink">{t.name}</h4>
                    <span className="text-[11px] font-bold text-muted">{t.grade}</span>
                  </div>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-ink/90">&ldquo;{t.text}&rdquo;</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
