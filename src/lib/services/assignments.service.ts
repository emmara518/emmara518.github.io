import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { assignments, assignmentSubmissions, courses, users, auditLogs } from "@/db/schema";
import { ServiceError } from "../errors";
import { hasActiveSubscription } from "./billing.service";
import { isAdminRole } from "../rbac";
import type { SessionUser } from "../auth";
import type { AssignmentCreateInput } from "../contracts";

/** Assignments — create (admin) → submit (enrolled student) → grade (admin). */

async function requireCourseBySlug(slug: string) {
  const rows = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  const course = rows[0];
  if (!course || course.status !== "published") {
    throw new ServiceError(404, "COURSE_NOT_FOUND", "الكورس غير موجود");
  }
  return course;
}

export async function listStudentAssignments(user: SessionUser, slug: string) {
  const course = await requireCourseBySlug(slug);
  if (!isAdminRole(user.role)) {
    const enrolled = await hasActiveSubscription(user.id, course.id);
    if (!enrolled) throw new ServiceError(403, "NOT_ENROLLED", "اشترك في الكورس للوصول إلى الواجبات");
  }

  const rows = await db
    .select()
    .from(assignments)
    .where(eq(assignments.courseId, course.id))
    .orderBy(asc(assignments.createdAt));

  const ids = rows.map((a) => a.id);
  const subs = ids.length
    ? await db
        .select()
        .from(assignmentSubmissions)
        .where(and(eq(assignmentSubmissions.userId, user.id), inArray(assignmentSubmissions.assignmentId, ids)))
    : [];
  const subMap = new Map(subs.map((s) => [s.assignmentId, s]));

  return rows.map((a) => {
    const sub = subMap.get(a.id);
    return {
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      dueAt: a.dueAt,
      maxScore: a.maxScore,
      mySubmission: sub
        ? { submittedAt: sub.submittedAt, score: sub.score }
        : null,
    };
  });
}

export async function submitAssignment(userId: string, assignmentId: string, textAnswer: string) {
  const rows = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
  const assignment = rows[0];
  if (!assignment) throw new ServiceError(404, "ASSIGNMENT_NOT_FOUND", "الواجب غير موجود");

  const enrolled = await hasActiveSubscription(userId, assignment.courseId);
  if (!enrolled) throw new ServiceError(403, "NOT_ENROLLED", "اشترك في الكورس لتسليم الواجب");

  const existing = await db
    .select()
    .from(assignmentSubmissions)
    .where(and(eq(assignmentSubmissions.assignmentId, assignmentId), eq(assignmentSubmissions.userId, userId)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(assignmentSubmissions)
      .set({ textAnswer, submittedAt: new Date(), score: null })
      .where(eq(assignmentSubmissions.id, existing[0].id));
    return { submissionId: existing[0].id, resubmitted: true };
  }

  const [created] = await db
    .insert(assignmentSubmissions)
    .values({ assignmentId, userId, textAnswer })
    .returning({ id: assignmentSubmissions.id });
  return { submissionId: created.id, resubmitted: false };
}

export async function listAssignmentsAdmin() {
  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      maxScore: assignments.maxScore,
      dueAt: assignments.dueAt,
      createdAt: assignments.createdAt,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .orderBy(desc(assignments.createdAt))
    .limit(100);

  const counts = await db
    .select({ assignmentId: assignmentSubmissions.assignmentId })
    .from(assignmentSubmissions);
  const countMap = new Map<string, number>();
  for (const c of counts) countMap.set(c.assignmentId, (countMap.get(c.assignmentId) ?? 0) + 1);

  return rows.map((r) => ({ ...r, submissionsCount: countMap.get(r.id) ?? 0 }));
}

export async function createAssignment(actor: SessionUser, input: AssignmentCreateInput) {
  const courseRows = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
  if (!courseRows[0]) throw new ServiceError(404, "COURSE_NOT_FOUND", "الكورس غير موجود");

  const [created] = await db
    .insert(assignments)
    .values({
      courseId: input.courseId,
      title: input.title,
      instructions: input.instructions,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      maxScore: input.maxScore,
    })
    .returning({ id: assignments.id });

  await db.insert(auditLogs).values({
    actorId: actor.id,
    action: "assignments.create",
    entity: "assignments",
    entityId: created.id,
    meta: { courseId: input.courseId, title: input.title },
  });
  return created;
}

export async function gradeSubmission(actor: SessionUser, submissionId: string, score: number) {
  const rows = await db
    .select({
      id: assignmentSubmissions.id,
      studentName: users.name,
      maxScore: assignments.maxScore,
      title: assignments.title,
    })
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignmentSubmissions.assignmentId, assignments.id))
    .innerJoin(users, eq(assignmentSubmissions.userId, users.id))
    .where(eq(assignmentSubmissions.id, submissionId))
    .limit(1);
  const sub = rows[0];
  if (!sub) throw new ServiceError(404, "SUBMISSION_NOT_FOUND", "التسليم غير موجود");
  if (score > sub.maxScore) {
    throw new ServiceError(422, "SCORE_OVERFLOW", `الدرجة القصوى لهذا الواجب ${sub.maxScore}`);
  }

  await db.update(assignmentSubmissions).set({ score }).where(eq(assignmentSubmissions.id, submissionId));
  await db.insert(auditLogs).values({
    actorId: actor.id,
    action: "assignments.grade",
    entity: "assignment_submissions",
    entityId: submissionId,
    meta: { score, maxScore: sub.maxScore, student: sub.studentName },
  });
  return { submissionId, score, maxScore: sub.maxScore };
}
