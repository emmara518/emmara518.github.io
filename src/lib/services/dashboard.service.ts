import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  grades,
  subjects,
  lessons,
  videos,
  subscriptions,
  studentProgress,
  exams,
  examAttempts,
  notifications,
} from "@/db/schema";
import { ServiceError } from "../errors";
import { listInvoices, getWalletSummary, hasActiveSubscription } from "./billing.service";
import { getCourseBySlug, getCourseCurriculum } from "./catalog.service";
import { listMyAttempts } from "./exams.service";
import type { SessionUser } from "../auth";

/** Student dashboard & learning room read models. */

export async function getStudentDashboard(user: SessionUser) {
  const enrollments = await db
    .select({
      id: subscriptions.id,
      startsAt: subscriptions.startsAt,
      courseId: courses.id,
      slug: courses.slug,
      title: courses.title,
      summary: courses.summary,
      gradeName: grades.name,
      subjectName: subjects.name,
    })
    .from(subscriptions)
    .innerJoin(courses, eq(subscriptions.courseId, courses.id))
    .innerJoin(grades, eq(courses.gradeId, grades.id))
    .innerJoin(subjects, eq(courses.subjectId, subjects.id))
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.startsAt));

  // progress per enrolled course (tiny N — fine)
  const progressByCourse = new Map<string, { total: number; completed: number }>();
  for (const e of enrollments) {
    const total = await db
      .select({ id: videos.id })
      .from(videos)
      .innerJoin(lessons, eq(videos.lessonId, lessons.id))
      .where(eq(lessons.courseId, e.courseId));
    const done = await db
      .select({ id: studentProgress.id })
      .from(studentProgress)
      .where(
        and(
          eq(studentProgress.userId, user.id),
          eq(studentProgress.courseId, e.courseId),
          isNotNull(studentProgress.completedAt),
        ),
      );
    progressByCourse.set(e.courseId, { total: total.length, completed: done.length });
  }

  const [wallet, invoiceRows, attempts, notifs] = await Promise.all([
    getWalletSummary(user.id),
    listInvoices(user.id, 6),
    listMyAttempts(user.id),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(6),
  ]);

  const upcomingExams = enrollments.length
    ? await db
        .select({
          id: exams.id,
          title: exams.title,
          durationMin: exams.durationMin,
          courseTitle: courses.title,
          courseSlug: courses.slug,
        })
        .from(exams)
        .innerJoin(courses, eq(exams.courseId, courses.id))
        .where(
          and(
            eq(exams.isPublished, true),
            inArray(exams.courseId, enrollments.map((e) => e.courseId)),
          ),
        )
        .limit(6)
    : [];

  const totals = Array.from(progressByCourse.values()).reduce(
    (acc, p) => ({ total: acc.total + p.total, completed: acc.completed + p.completed }),
    { total: 0, completed: 0 },
  );

  return {
    enrollments: enrollments.map((e) => ({
      ...e,
      progress: progressByCourse.get(e.courseId) ?? { total: 0, completed: 0 },
    })),
    wallet,
    invoices: invoiceRows,
    attempts,
    notifications: notifs,
    upcomingExams,
    stats: {
      coursesCount: enrollments.length,
      videosCompleted: totals.completed,
      avgProgress:
        totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0,
      examsCount: attempts.length,
    },
  };
}

export async function getLearningRoom(user: SessionUser, slug: string) {
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "published") {
    throw new ServiceError(404, "COURSE_NOT_FOUND", "الكورس غير موجود");
  }
  const enrolled = await hasActiveSubscription(user.id, course.id);
  const curriculum = await getCourseCurriculum(course.id);

  const progressRows = await db
    .select()
    .from(studentProgress)
    .where(and(eq(studentProgress.userId, user.id), eq(studentProgress.courseId, course.id)));

  const progressMap = new Map(progressRows.map((p) => [p.videoId, p]));

  const lessonsModel = curriculum.lessons.map((l) => {
    const unlocked = enrolled || l.isFreePreview;
    return {
      id: l.id,
      title: l.title,
      isFreePreview: l.isFreePreview,
      unlocked,
      videos: l.videos.map((v) => ({
        id: v.id,
        title: v.title,
        youtubeVideoId: unlocked ? v.youtubeVideoId : null,
        durationSec: v.durationSec,
        completed: progressMap.get(v.id)?.completedAt != null,
        watchedSeconds: progressMap.get(v.id)?.watchedSeconds ?? 0,
      })),
    };
  });

  const totalVideos = lessonsModel.reduce((s, l) => s + l.videos.length, 0);
  const completedVideos = lessonsModel.reduce(
    (s, l) => s + l.videos.filter((v) => v.completed).length,
    0,
  );

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      gradeName: course.gradeName,
      subjectName: course.subjectName,
      teacherName: course.teacherName,
    },
    enrolled,
    lessons: lessonsModel,
    exams: curriculum.exams,
    files: enrolled ? curriculum.files : curriculum.files.filter((f) => f.isFreePreview),
    stats: {
      totalVideos,
      completedVideos,
      percent: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
    },
  };
}

export async function markVideoProgress(
  userId: string,
  videoId: string,
  watchedSeconds: number,
  completed: boolean,
) {
  const videoRows = await db
    .select({
      id: videos.id,
      courseId: lessons.courseId,
      isFreePreview: lessons.isFreePreview,
    })
    .from(videos)
    .innerJoin(lessons, eq(videos.lessonId, lessons.id))
    .where(eq(videos.id, videoId))
    .limit(1);
  const video = videoRows[0];
  if (!video) throw new ServiceError(404, "VIDEO_NOT_FOUND", "الفيديو غير موجود");

  if (!video.isFreePreview) {
    const enrolled = await hasActiveSubscription(userId, video.courseId);
    if (!enrolled) throw new ServiceError(403, "NOT_ENROLLED", "اشترك في الكورس لمتابعة هذا الدرس");
  }

  await db
    .insert(studentProgress)
    .values({
      userId,
      courseId: video.courseId,
      videoId,
      watchedSeconds,
      completedAt: completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [studentProgress.userId, studentProgress.videoId],
      set: {
        watchedSeconds,
        completedAt: completed ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

  return { videoId, completed };
}

export async function markAllNotificationsRead(userId: string) {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  return { marked: rows.length };
}
