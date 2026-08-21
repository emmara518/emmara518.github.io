import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, subscriptions, orders, exams, examAttempts } from "@/db/schema";

/** Reports & analytics — aggregated read models for the admin console. */

export async function getAdminReports() {
  const courseRows = await db
    .select({ id: courses.id, title: courses.title, slug: courses.slug, status: courses.status, priceCents: courses.priceCents })
    .from(courses)
    .orderBy(desc(courses.createdAt))
    .limit(50);

  const subsAgg = await db
    .select({ courseId: subscriptions.courseId, value: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"))
    .groupBy(subscriptions.courseId);
  const subsMap = new Map(subsAgg.map((r) => [r.courseId, r.value]));

  const revAgg = await db
    .select({ courseId: orders.courseId, value: sql<number>`COALESCE(sum(${orders.totalCents}),0)::int` })
    .from(orders)
    .where(eq(orders.status, "paid"))
    .groupBy(orders.courseId);
  const revMap = new Map(revAgg.map((r) => [r.courseId, r.value]));

  const courseReport = courseRows.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    status: c.status,
    priceCents: c.priceCents,
    enrollments: subsMap.get(c.id) ?? 0,
    revenueCents: revMap.get(c.id) ?? 0,
  }));

  const examRows = await db
    .select({ id: exams.id, title: exams.title, courseTitle: courses.title })
    .from(exams)
    .innerJoin(courses, eq(exams.courseId, courses.id))
    .where(eq(exams.isPublished, true));

  const attempts = await db
    .select({ examId: examAttempts.examId, score: examAttempts.score, totalMarks: examAttempts.totalMarks })
    .from(examAttempts);

  const examReport = examRows.map((e) => {
    const mine = attempts.filter((a) => a.examId === e.id);
    const withPct = mine.map((a) => (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0));
    const passed = withPct.filter((p) => p >= 60).length;
    const avg = withPct.length ? Math.round(withPct.reduce((s, p) => s + p, 0) / withPct.length) : null;
    return {
      id: e.id,
      title: e.title,
      courseTitle: e.courseTitle,
      attemptsCount: mine.length,
      passedCount: passed,
      passRate: mine.length ? Math.round((passed / mine.length) * 100) : null,
      avgPercent: avg,
    };
  });

  return { courseReport, examReport };
}
