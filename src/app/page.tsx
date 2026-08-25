import { DrosUniverseShowcase } from "@/components/dros-universe-showcase";
import { EquationMarquee } from "@/components/marketing";
import { InteractiveCourses3DSection } from "@/components/interactive-courses-3d";
import { CompactFeaturesSection } from "@/components/compact-features-ticker";
import { featuredCourses, listStagesWithGrades } from "@/lib/services/catalog.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [courses, stages] = await Promise.all([featuredCourses(3), listStagesWithGrades()]);

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
    </main>
  );
}
