import { DrosUniverseShowcase } from "@/components/dros-universe-showcase";
import { CourseCard, EquationMarquee, SectionHead } from "@/components/marketing";
import { MathPillarsInteractive } from "@/components/math-pillars-interactive";
import { featuredCourses, listStagesWithGrades } from "@/lib/services/catalog.service";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui";
import { Award, CirclePlay as PlayCircle, Layers, Wallet } from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "منهج منظّم كالبرهان",
    text: "كل كورس مبني بتسلسل منطقي: مفهوم ← مثال محلول ← تدريب ← اختبار، بلا قفزات ولا حشو.",
  },
  {
    icon: PlayCircle,
    title: "فيديوهات عالية الجودة بلا تشتيت",
    text: "الحصص مستضافة داخل غرفة تعلم خاصة بترتيب المنهج مع حفظ نقطة توقفك تلقائيًا.",
  },
  {
    icon: Award,
    title: "اختبارات بتصحيح فوري",
    text: "بنك أسئلة متدرج، تصحيح لحظي، وشرح لكل إجابة — تعرف مستواك الحقيقي قبل الامتحان.",
  },
  {
    icon: Wallet,
    title: "محفظة وكوبونات وفواتير",
    text: "اشحن رصيدك، استخدم كوبون الخصم، واحصل على فاتورة إلكترونية لكل عملية — شفافية كاملة.",
  },
];

const TESTIMONIALS = [
  { name: "يوسف م.", grade: "الصف الثالث الثانوي", text: "أول مرة أحس إن المسألة ليها منطق مش خطوات محفوظة. شرح النهايات غيّر تعاملي مع التفاضل كله." },
  { name: "ملك س.", grade: "الصف الثاني الثانوي", text: "الامتحانات الإلكترونية بعد كل وحدة خلتني أعرف غلطي فورًا. رفعت ١٢ درجة في شهرين." },
  { name: "أم عمر", grade: "ولية أمر", text: "أتابع تقدم ابني بوضوح: كام فيديو اتفرج عليه، ونتيجة كل اختبار. متابعة حقيقية مش وعود." },
];

export default async function HomePage() {
  const [courses, stages] = await Promise.all([featuredCourses(3), listStagesWithGrades()]);

  return (
    <main className="overflow-x-clip bg-[#04060b] text-slate-100 min-h-screen">
      {/* ─── Hero Section & Universe Dashboard: EXACT REPLICA OF DESIGN ─── */}
      <DrosUniverseShowcase />

      {/* ─── 3D Math Pillars Showcase Ribbon ─── */}
      <section className="relative border-y border-[#131b2c] bg-[#070b13] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <MathPillarsInteractive />
        </div>
      </section>

      {/* Marquee Math Equations */}
      <EquationMarquee />

      {/* ─── Featured Courses ─── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <SectionHead
            kicker="FEATURED COURSES"
            title="أبرز المقررات والكورسات"
            sub="مناهج كاملة، مذكرات محلولة، واختبارات قياسية بتصحيح فوري."
          />
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <Reveal key={course.id} delay={i * 100}>
              <CourseCard course={course} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <SectionHead
            kicker="WHY DROS MATH"
            title="لماذا تختار منصة دروس ماث؟"
            sub="صُممت التجربة لتجعل فهم وتفوق الرياضيات أسرع وأبسط."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 100}>
                <Card className="h-full p-6 space-y-3 rounded-3xl border-[#131b2c] bg-[#070c16]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-neon-lime/10 text-lime-400">
                    <Icon size={22} />
                  </span>
                  <h3 className="text-base font-black text-white">{f.title}</h3>
                  <p className="text-xs font-semibold leading-relaxed text-slate-400">{f.text}</p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <SectionHead
            kicker="SUCCESS STORIES"
            title="ماذا يقول طلابنا وأولياء الأمور؟"
            sub="آراء حقيقية من الطلاب الذين أتقنوا الرياضيات مع مستر محمد سعيد."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <Card className="h-full p-6 space-y-4 rounded-3xl border-[#131b2c] bg-[#070c16]">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-neon-lime font-black text-slate-950">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{t.name}</h4>
                    <span className="text-[11px] font-bold text-slate-400">{t.grade}</span>
                  </div>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-300">&ldquo;{t.text}&rdquo;</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
