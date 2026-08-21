import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  parentLinks,
  users,
  subscriptions,
  courses,
  grades,
  lessons,
  videos,
  studentProgress,
  examAttempts,
  exams,
} from "@/db/schema";
import { ServiceError } from "../errors";

/** Parent portal — read-only visibility over a linked child's learning.
 *  The link row is the authorization boundary: no link, no access. */

export async function getChildProgress(parentId: string, childId: string) {
  const links = await db
    .select()
    .from(parentLinks)
    .where(and(eq(parentLinks.parentId, parentId), eq(parentLinks.studentId, childId)))
    .limit(1);
  if (!links[0]) {
    throw new ServiceError(403, "NOT_LINKED", "هذا الطالب غير مرتبط بحسابك");
  }

  const childRows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, childId))
    .limit(1);
  const child = childRows[0];
  if (!child) throw new ServiceError(404, "CHILD_NOT_FOUND", "الطالب غير موجود");

  const enrollments = await db
    .select({
      courseId: courses.id,
      title: courses.title,
      slug: courses.slug,
      gradeName: grades.name,
      startsAt: subscriptions.startsAt,
    })
    .from(subscriptions)
    .innerJoin(courses, eq(subscriptions.courseId, courses.id))
    .innerJoin(grades, eq(courses.gradeId, grades.id))
    .where(and(eq(subscriptions.userId, childId), eq(subscriptions.status, "active")));

  const enriched = [];
  for (const e of enrollments) {
    const [totalRow] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(videos)
      .innerJoin(lessons, eq(videos.lessonId, lessons.id))
      .where(eq(lessons.courseId, e.courseId));
    const [doneRow] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(studentProgress)
      .where(
        and(
          eq(studentProgress.userId, childId),
          eq(studentProgress.courseId, e.courseId),
          isNotNull(studentProgress.completedAt),
        ),
      );
    const total = totalRow?.value ?? 0;
    const completed = doneRow?.value ?? 0;
    enriched.push({
      ...e,
      videosTotal: total,
      videosCompleted: completed,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }

  const courseIds = enrollments.map((e) => e.courseId);
  const attempts = courseIds.length
    ? await db
        .select({
          examTitle: exams.title,
          score: examAttempts.score,
          totalMarks: examAttempts.totalMarks,
          submittedAt: examAttempts.submittedAt,
        })
        .from(examAttempts)
        .innerJoin(exams, eq(examAttempts.examId, exams.id))
        .where(and(eq(examAttempts.userId, childId), inArray(exams.courseId, courseIds)))
        .orderBy(desc(examAttempts.submittedAt))
        .limit(6)
    : [];

  return { child: { id: child.id, name: child.name, email: child.email }, enrollments: enriched, recentAttempts: attempts };
}
