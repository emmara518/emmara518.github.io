import { and, asc, count, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import {
  academicStages,
  grades,
  subjects,
  courses,
  lessons,
  videos,
  courseFiles,
  exams,
  examQuestions,
  users,
} from "@/db/schema";

/** Catalog & curriculum read models. SQL lives ONLY here (never in pages/routes). */

export type CourseCardModel = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  priceCents: number;
  gradeName: string;
  stageName: string;
  subjectName: string;
  teacherName: string;
  lessonsCount: number;
  totalSeconds: number;
};

export async function listStagesWithGrades() {
  await ensureDbReady();
  const stages = await db.select().from(academicStages).orderBy(asc(academicStages.sortOrder));
  const gradeRows = await db.select().from(grades).orderBy(asc(grades.sortOrder));
  return stages.map((s) => ({ ...s, grades: gradeRows.filter((g) => g.stageId === s.id) }));
}

export async function listGrades() {
  await ensureDbReady();
  return db.select().from(grades).orderBy(asc(grades.sortOrder));
}

export async function listSubjects() {
  await ensureDbReady();
  return db.select().from(subjects).orderBy(asc(subjects.name));
}

export async function listCourses(filters?: {
  gradeSlug?: string;
  subjectSlug?: string;
  q?: string;
}): Promise<CourseCardModel[]> {
  await ensureDbReady();
  const where = [eq(courses.status, "published")];
  if (filters?.gradeSlug) where.push(eq(grades.slug, filters.gradeSlug));
  if (filters?.subjectSlug) where.push(eq(subjects.slug, filters.subjectSlug));
  if (filters?.q) where.push(ilike(courses.title, `%${filters.q}%`));

  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      summary: courses.summary,
      priceCents: courses.priceCents,
      gradeName: grades.name,
      stageName: academicStages.name,
      subjectName: subjects.name,
      teacherName: users.name,
    })
    .from(courses)
    .innerJoin(grades, eq(courses.gradeId, grades.id))
    .innerJoin(academicStages, eq(grades.stageId, academicStages.id))
    .innerJoin(subjects, eq(courses.subjectId, subjects.id))
    .innerJoin(users, eq(courses.teacherId, users.id))
    .$dynamic()
    .where(and(...where))
    .orderBy(desc(courses.createdAt));

  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const lessonCounts = await db
    .select({ courseId: lessons.courseId, value: count() })
    .from(lessons)
    .where(inArray(lessons.courseId, ids))
    .groupBy(lessons.courseId);

  const secondSums = await db
    .select({
      courseId: lessons.courseId,
      value: sql<number>`COALESCE(sum(${videos.durationSec}), 0)::int`,
    })
    .from(videos)
    .innerJoin(lessons, eq(videos.lessonId, lessons.id))
    .where(inArray(lessons.courseId, ids))
    .groupBy(lessons.courseId);

  const countMap = new Map(lessonCounts.map((m) => [m.courseId, m.value]));
  const secondsMap = new Map(secondSums.map((m) => [m.courseId, m.value]));

  return rows.map((r) => ({
    ...r,
    lessonsCount: countMap.get(r.id) ?? 0,
    totalSeconds: secondsMap.get(r.id) ?? 0,
  }));
}

export async function featuredCourses(limit = 3) {
  const all = await listCourses();
  return all.slice(0, limit);
}

export async function getCourseBySlug(slug: string) {
  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      summary: courses.summary,
      description: courses.description,
      priceCents: courses.priceCents,
      status: courses.status,
      gradeId: courses.gradeId,
      gradeName: grades.name,
      stageName: academicStages.name,
      subjectName: subjects.name,
      subjectId: courses.subjectId,
      teacherName: users.name,
      createdAt: courses.createdAt,
    })
    .from(courses)
    .innerJoin(grades, eq(courses.gradeId, grades.id))
    .innerJoin(academicStages, eq(grades.stageId, academicStages.id))
    .innerJoin(subjects, eq(courses.subjectId, subjects.id))
    .innerJoin(users, eq(courses.teacherId, users.id))
    .where(eq(courses.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCourseCurriculum(courseId: string) {
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.sortOrder));

  const videoRows = lessonRows.length
    ? await db
        .select()
        .from(videos)
        .where(
          inArray(
            videos.lessonId,
            lessonRows.map((l) => l.id),
          ),
        )
        .orderBy(asc(videos.sortOrder))
    : [];

  const fileRows = await db
    .select()
    .from(courseFiles)
    .where(eq(courseFiles.courseId, courseId));

  const examRows = await db
    .select({
      id: exams.id,
      title: exams.title,
      durationMin: exams.durationMin,
      mode: exams.mode,
      questionsCount: count(examQuestions.id),
    })
    .from(exams)
    .leftJoin(examQuestions, eq(examQuestions.examId, exams.id))
    .where(and(eq(exams.courseId, courseId), eq(exams.isPublished, true)))
    .groupBy(exams.id);

  return {
    lessons: lessonRows.map((l) => ({
      ...l,
      videos: videoRows.filter((v) => v.lessonId === l.id),
    })),
    files: fileRows,
    exams: examRows,
  };
}

/** total question count helper used by services */
export async function getPublishedCourseIds(): Promise<string[]> {
  const rows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.status, "published"));
  return rows.map((r) => r.id);
}
