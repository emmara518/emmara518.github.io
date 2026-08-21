import Link from "next/link";
import Image from "next/image";
import {
  Award,
  CirclePlay as PlayCircle,
  GraduationCap,
  Layers,
  ShieldCheck,
  Wallet,
  Play,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Badge, Card, buttonStyles } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { CourseCard, EquationMarquee, SectionHead } from "@/components/marketing";
import { AcademicMapRoadmap } from "@/components/academic-map";
import { featuredCourses, listStagesWithGrades } from "@/lib/services/catalog.service";
import { cn } from "@/lib/utils";

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
    <main className="overflow-x-clip bg-bg text-ink">
      {/* ─── Hero Section: DROS MATH UNIVERSE ─── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Math Grid Background */}
        <div className="absolute inset-0 math-grid-pattern opacity-15 pointer-events-none" />
        <div className="absolute -top-40 right-1/4 size-[35rem] rounded-full bg-lime-500/15 blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/2 left-0 size-[30rem] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Text Column */}
          <div className="space-y-7 text-start">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-500/30 bg-lime-500/10 px-4 py-1.5 text-xs font-bold text-neon-lime">
                <Sparkles size={14} className="animate-spin-slow" />
                <span>إصدار ٢٠٢٦ الجديد كليًا — DROS MATH UNIVERSE</span>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="text-4xl font-black leading-[1.2] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                عالم الرياضيات بين يديك…
                <br />
                <span className="text-gradient-lime">تعلم أعمق .. افهم أذكى</span>
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="max-w-xl text-base leading-8 text-muted sm:text-lg sm:leading-9 font-medium">
                منهج أ/ محمد سعيد كاملًا في مكان واحد: حصص فيديو مرتبة، مذكرات PDF،
                اختبارات إلكترونية بتصحيح فوري، ومتابعة تفصيلية لتقدمك — للمرحلتين الإعدادية والثانوية.
              </p>
            </Reveal>

            <Reveal delay={260}>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-neon-lime px-7 py-4 text-base font-black text-slate-950 shadow-xl shadow-lime-500/25 hover:bg-lime-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Play size={18} fill="currentColor" />
                  <span>ابدأ التعلم الآن</span>
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-6 py-4 text-base font-bold text-ink hover:bg-surface2 transition-colors"
                >
                  <span>تصفح الكورسات</span>
                </Link>
              </div>
            </Reveal>

            {/* Quick Metrics Bar */}
            <Reveal delay={340}>
              <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line/60 pt-6 font-mono">
                {[
                  { v: "+12,000", l: "طالب وطالبة" },
                  { v: "+850", l: "ساعة شرح" },
                  { v: "96%", l: "نسبة رضا" },
                  { v: "6", l: "صفوف دراسية" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-2xl font-black text-neon-lime">{s.v}</div>
                    <div className="mt-0.5 text-xs font-sans font-semibold text-muted">{s.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right Column: Teacher Portrait Card (Mr. Mohamed Saeed) */}
          <Reveal delay={200} className="relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Outer Glowing Neon Frame */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-6 border border-slate-800 shadow-2xl glow-lime">
                <div className="relative aspect-[4/4] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800">
                  <Image
                    src="/images/teacher.webp"
                    alt="أستاذ محمد سعيد — دروس ماث"
                    fill
                    priority
                    className="object-cover object-top hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                </div>

                {/* Floating Info Overlay */}
                <div className="absolute bottom-10 inset-x-10 rounded-2xl bg-slate-900/90 border border-lime-400/30 p-4 backdrop-blur-md shadow-lg text-center space-y-1">
                  <span className="block text-xs font-mono font-bold text-lime-400">FOUNDER & LECTURER</span>
                  <h3 className="text-lg font-black text-white">مستر محمد سعيد</h3>
                  <p className="text-xs font-semibold text-slate-300">كبير معلمي الرياضيات للمرحلة الثانوية</p>
                </div>
              </div>

              {/* Demo Credentials Floating Card */}
              <div className="mt-4 rounded-2xl border border-line bg-surface p-4 text-xs font-semibold text-muted shadow-lg">
                <div className="flex items-center justify-between font-mono text-[11px] text-muted mb-2">
                  <span className="text-neon-lime font-bold">DEMO·ACCESS</span>
                  <ShieldCheck size={16} className="text-emerald-500" />
                </div>
                <p>حسابات تجريبية للاختبار: student@dros-math.com / password: 12345678</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Marquee Math Equations */}
      <EquationMarquee />

      {/* ─── Academic Map Stage Ribbon (01-05) ─── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <AcademicMapRoadmap />
        </Reveal>
      </section>

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
                <Card className="h-full p-6 space-y-3 rounded-3xl border-line">
                  <span className="grid size-12 place-items-center rounded-2xl bg-neon-lime/10 text-lime-600 dark:text-lime-400">
                    <Icon size={22} />
                  </span>
                  <h3 className="text-base font-black text-ink">{f.title}</h3>
                  <p className="text-xs font-semibold leading-relaxed text-muted">{f.text}</p>
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
              <Card className="h-full p-6 space-y-4 rounded-3xl border-line">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-neon-lime font-black text-slate-950">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-ink">{t.name}</h4>
                    <span className="text-[11px] font-bold text-muted">{t.grade}</span>
                  </div>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-muted">&ldquo;{t.text}&rdquo;</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
