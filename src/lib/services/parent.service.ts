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

/** Link a parent account to EVERY student registered with this guardian mobile.
 *  Called at parent registration; the guardian phone entered by the student
 *  at signup is the matching key. Returns the linked student ids. */
export async function linkParentByGuardianPhone(
  parentId: string,
  guardianPhone: string,
): Promise<string[]> {
  const students = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.guardianPhone, guardianPhone), eq(users.role, "student")));
  if (!students.length) return [];
  await db
    .insert(parentLinks)
    .values(students.map((s) => ({ parentId, studentId: s.id })))
    .onConflictDoNothing();
  return students.map((s) => s.id);
}

/** Overview of every linked child — results summary per child. */
export async function getChildren(parentId: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      gradeName: grades.name,
      linkedAt: parentLinks.createdAt,
    })
    .from(parentLinks)
    .innerJoin(users, eq(parentLinks.studentId, users.id))
    .leftJoin(grades, eq(users.gradeId, grades.id))
    .where(eq(parentLinks.parentId, parentId))
    .orderBy(desc(parentLinks.createdAt));

  const children = [];
  for (const child of rows) {
    const [coursesRow] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, child.id), eq(subscriptions.status, "active")));

    const attempts = await db
      .select({ score: examAttempts.score, totalMarks: examAttempts.totalMarks })
      .from(examAttempts)
      .where(eq(examAttempts.userId, child.id));

    const percents = attempts
      .filter((a) => a.totalMarks > 0)
      .map((a) => Math.round((a.score / a.totalMarks) * 100));
    const avgPercent = percents.length
      ? Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length)
      : null;

    children.push({
      id: child.id,
      name: child.name,
      email: child.email,
      avatarUrl: child.avatarUrl,
      gradeName: child.gradeName,
      activeCourses: coursesRow?.value ?? 0,
      attemptsCount: attempts.length,
      avgPercent,
    });
  }
  return children;
}

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
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, gradeName: grades.name })
    .from(users)
    .leftJoin(grades, eq(users.gradeId, grades.id))
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
          courseTitle: courses.title,
          score: examAttempts.score,
          totalMarks: examAttempts.totalMarks,
          submittedAt: examAttempts.submittedAt,
        })
        .from(examAttempts)
        .innerJoin(exams, eq(examAttempts.examId, exams.id))
        .innerJoin(courses, eq(exams.courseId, courses.id))
        .where(and(eq(examAttempts.userId, childId), inArray(exams.courseId, courseIds)))
        .orderBy(desc(examAttempts.submittedAt))
        .limit(20)
    : [];

  return {
    child: { id: child.id, name: child.name, email: child.email, gradeName: child.gradeName },
    enrollments: enriched,
    recentAttempts: attempts,
  };
}
