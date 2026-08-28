import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
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

/** The single most useful thing the student should do next — computed, never mocked. */
export type NextAction =
  | {
      kind: "lesson";
      courseSlug: string;
      courseTitle: string;
      lessonTitle: string;
      videoTitle: string | null;
      /** 1-based lesson position for deep-linking the learning room (?lesson=N). */
      lessonIndex: number;
      href: string;
    }
  | {
      kind: "exam";
      examId: string;
      examTitle: string;
      courseTitle: string;
      href: string;
    };

export type DashboardActivity = {
  id: string;
  kind: "lesson" | "exam" | "enrolled" | "notification";
  title: string;
  meta: string | null;
  at: Date;
};

export async function getNextAction(
  user: SessionUser,
  enrollments: { courseId: string; slug: string; title: string }[],
): Promise<NextAction | null> {
  if (enrollments.length === 0) return null;
  const courseIds = enrollments.map((e) => e.courseId);

  const [videoRows, progressRows] = await Promise.all([
    db
      .select({
        id: videos.id,
        title: videos.title,
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        courseSlug: courses.slug,
        courseTitle: courses.title,
      })
      .from(videos)
      .innerJoin(lessons, eq(videos.lessonId, lessons.id))
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(inArray(lessons.courseId, courseIds))
      .orderBy(asc(lessons.sortOrder), asc(videos.sortOrder)),
    db
      .select({
        videoId: studentProgress.videoId,
        completedAt: studentProgress.completedAt,
        updatedAt: studentProgress.updatedAt,
      })
      .from(studentProgress)
      .where(and(eq(studentProgress.userId, user.id), inArray(studentProgress.courseId, courseIds))),
  ]);

  const progressByVideo = new Map(progressRows.map((p) => [p.videoId, p]));

  // Group curriculum rows per course, order-stable, with 1-based lesson positions.
  const slugToCourseId = new Map(enrollments.map((e) => [e.slug, e.courseId]));
  const perCourse = new Map<string, { rows: typeof videoRows; lessonPositions: Map<string, number> }>();
  for (const cid of courseIds) perCourse.set(cid, { rows: [], lessonPositions: new Map() });
  for (const v of videoRows) {
    const cid = slugToCourseId.get(v.courseSlug);
    const bucket = cid ? perCourse.get(cid) : undefined;
    if (!bucket) continue;
    if (!bucket.lessonPositions.has(v.lessonId)) {
      bucket.lessonPositions.set(v.lessonId, bucket.lessonPositions.size + 1);
    }
    bucket.rows.push(v);
  }

  type IncompleteHit = {
    video: (typeof videoRows)[number];
    lessonIndex: number;
    updatedAt: Date | null;
  };
  const firstIncompleteByCourse = new Map<string, IncompleteHit>();
  let resume: IncompleteHit | null = null;

  for (const cid of courseIds) {
    const bucket = perCourse.get(cid);
    if (!bucket) continue;
    for (const v of bucket.rows) {
      const p = progressByVideo.get(v.id);
      if (p?.completedAt) continue;
      const hit: IncompleteHit = {
        video: v,
        lessonIndex: bucket.lessonPositions.get(v.lessonId) ?? 1,
        updatedAt: p?.updatedAt ?? null,
      };
      firstIncompleteByCourse.set(cid, hit); // first incomplete wins per course
      // Resume point = watched-but-unfinished video touched most recently.
      if (p && (!resume || (hit.updatedAt !== null && resume.updatedAt !== null && hit.updatedAt > resume.updatedAt))) {
        resume = hit;
      }
      break;
    }
  }

  const chosen =
    resume ??
    enrollments.map((e) => firstIncompleteByCourse.get(e.courseId)).find((h): h is IncompleteHit => Boolean(h));
  if (chosen) {
    return {
      kind: "lesson",
      courseSlug: chosen.video.courseSlug,
      courseTitle: chosen.video.courseTitle,
      lessonTitle: chosen.video.lessonTitle,
      videoTitle: chosen.video.title,
      lessonIndex: chosen.lessonIndex,
      href: `/dashboard/courses/${chosen.video.courseSlug}?lesson=${chosen.lessonIndex}`,
    };
  }

  // All lessons complete → point to an available exam of the enrolled courses.
  const examRow = await db
    .select({ id: exams.id, title: exams.title, courseTitle: courses.title })
    .from(exams)
    .innerJoin(courses, eq(exams.courseId, courses.id))
    .where(and(eq(exams.isPublished, true), inArray(exams.courseId, courseIds)))
    .orderBy(asc(exams.sortOrder), desc(exams.createdAt))
    .limit(1);
  if (examRow[0]) {
    return {
      kind: "exam",
      examId: examRow[0].id,
      examTitle: examRow[0].title,
      courseTitle: examRow[0].courseTitle,
      href: `/dashboard/exams/${examRow[0].id}`,
    };
  }
  return null;
}

async function buildRecentActivity(
  user: SessionUser,
  enrollments: { id: string; title: string; startsAt: Date }[],
  limit = 5,
) {
  const [doneVideos, attemptRows, notifRows] = await Promise.all([
    db
      .select({
        id: studentProgress.id,
        at: studentProgress.completedAt,
        videoTitle: videos.title,
        lessonTitle: lessons.title,
        courseTitle: courses.title,
      })
      .from(studentProgress)
      .innerJoin(videos, eq(studentProgress.videoId, videos.id))
      .innerJoin(lessons, eq(videos.lessonId, lessons.id))
      .innerJoin(courses, eq(studentProgress.courseId, courses.id))
      .where(and(eq(studentProgress.userId, user.id), isNotNull(studentProgress.completedAt)))
      .orderBy(desc(studentProgress.completedAt))
      .limit(8),
    db
      .select({
        id: examAttempts.id,
        at: examAttempts.submittedAt,
        score: examAttempts.score,
        totalMarks: examAttempts.totalMarks,
        examTitle: exams.title,
      })
      .from(examAttempts)
      .innerJoin(exams, eq(examAttempts.examId, exams.id))
      .where(eq(examAttempts.userId, user.id))
      .orderBy(desc(examAttempts.submittedAt))
      .limit(5),
    db
      .select({
        id: notifications.id,
        at: notifications.createdAt,
        title: notifications.title,
        body: notifications.body,
        kind: notifications.kind,
      })
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(6),
  ]);

  type Item = DashboardActivity;
  const items: Item[] = [
    ...doneVideos
      .filter((v): v is typeof v & { at: Date } => v.at !== null)
      .map((v) => {
        // Avoid "Lesson X — Lesson X (part 1)" duplication when titles match.
        const title =
          v.videoTitle === v.lessonTitle || v.videoTitle.startsWith(v.lessonTitle)
            ? v.videoTitle
            : `${v.lessonTitle} — ${v.videoTitle}`;
        return {
          id: v.id,
          kind: "lesson" as const,
          title,
          meta: v.courseTitle,
          at: v.at,
        };
      }),
    ...attemptRows.map((a) => ({
      id: a.id,
      kind: "exam" as const,
      title: a.examTitle,
      meta: `النتيجة ${a.score}/${a.totalMarks}`,
      at: a.at,
    })),
    ...enrollments.map((e) => ({
      id: e.id,
      kind: "enrolled" as const,
      title: `الاشتراك في «${e.title}»`,
      meta: null,
      at: e.startsAt,
    })),
    // Exam-result notifications duplicate attempt entries above — skip them.
    ...notifRows
      .filter((n) => n.kind !== "exam")
      .map((n) => ({ id: n.id, kind: "notification" as const, title: n.title, meta: n.body || null, at: n.at })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/** Active enrollments with per-course video progress — shared by dashboard + sub-pages. */
export async function listMyEnrollments(user: SessionUser) {
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

  return enrollments.map((e) => ({
    ...e,
    progress: progressByCourse.get(e.courseId) ?? { total: 0, completed: 0 },
  }));
}

export async function getRecentActivity(user: SessionUser, limit = 5) {
  const enrollments = await listMyEnrollments(user);
  return buildRecentActivity(
    user,
    enrollments.map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt })),
    limit,
  );
}

export async function getStudentDashboard(user: SessionUser) {
  const enrollments = await listMyEnrollments(user);

  const progressByCourse = new Map<string, { total: number; completed: number }>();
  for (const e of enrollments) progressByCourse.set(e.courseId, e.progress);

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
        .orderBy(asc(exams.sortOrder), desc(exams.createdAt))
        .limit(6)
    : [];

  // Real attempt status per listed exam (few rows per student — aggregate in JS).
  const examAttemptsByExam = new Map<string, { attemptsCount: number; bestScore: number; bestTotal: number }>();
  if (upcomingExams.length) {
    const attemptRows = await db
      .select({
        examId: examAttempts.examId,
        score: examAttempts.score,
        totalMarks: examAttempts.totalMarks,
      })
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.userId, user.id),
          inArray(
            examAttempts.examId,
            upcomingExams.map((x) => x.id),
          ),
        ),
      );
    for (const a of attemptRows) {
      const cur = examAttemptsByExam.get(a.examId);
      if (!cur) {
        examAttemptsByExam.set(a.examId, { attemptsCount: 1, bestScore: a.score, bestTotal: a.totalMarks });
      } else {
        cur.attemptsCount += 1;
        if (a.score > cur.bestScore) {
          cur.bestScore = a.score;
          cur.bestTotal = a.totalMarks;
        }
      }
    }
  }

  const [nextAction, recentActivity] = await Promise.all([
    getNextAction(user, enrollments.map((e) => ({ courseId: e.courseId, slug: e.slug, title: e.title }))),
    buildRecentActivity(
      user,
      enrollments.map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt })),
    ),
  ]);

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
    upcomingExams: upcomingExams.map((x) => ({
      ...x,
      status: examAttemptsByExam.get(x.id) ?? null,
    })),
    nextAction,
    recentActivity,
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

  /* Sequential guard: when the course requires it, a video only becomes
     playable after the previous one (in global order) is completed.
     View limits: maxViews=null means unlimited, otherwise remaining = max - count. */
  const flatOrdered = curriculum.lessons.flatMap((l) => l.videos);
  const seqLockedIds = new Set<string>();
  if (course.requireSequentialProgress) {
    let prevCompleted = true;
    for (const v of flatOrdered) {
      if (!prevCompleted) seqLockedIds.add(v.id);
      prevCompleted = progressMap.get(v.id)?.completedAt != null;
    }
  }

  const lessonsModel = curriculum.lessons.map((l) => {
    const unlocked = enrolled || l.isFreePreview;
    return {
      id: l.id,
      title: l.title,
      isFreePreview: l.isFreePreview,
      unlocked,
      videos: l.videos.map((v) => {
        const progress = progressMap.get(v.id);
        const viewsLeft =
          v.maxViews != null ? Math.max(0, v.maxViews - (progress?.viewCount ?? 0)) : null;
        const sequenceLocked = seqLockedIds.has(v.id);
        const playable = unlocked && !sequenceLocked && (viewsLeft == null || viewsLeft > 0);
        const lockReason: string | null = !unlocked
          ? "enroll"
          : sequenceLocked
            ? "sequence"
            : viewsLeft != null && viewsLeft <= 0
              ? "views"
              : null;
        return {
          id: v.id,
          title: v.title,
          youtubeVideoId: playable ? v.youtubeVideoId : null,
          durationSec: v.durationSec,
          completed: progress?.completedAt != null,
          watchedSeconds: progress?.watchedSeconds ?? 0,
          viewCount: progress?.viewCount ?? 0,
          viewsLeft,
          lockReason,
        };
      }),
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
      requireSequentialProgress: course.requireSequentialProgress,
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

/** Counts one view each time the student opens a video, enforcing maxViews. */
export async function recordVideoView(userId: string, videoId: string) {
  const videoRows = await db
    .select({
      id: videos.id,
      courseId: lessons.courseId,
      isFreePreview: lessons.isFreePreview,
      maxViews: videos.maxViews,
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

  const existingRows = await db
    .select()
    .from(studentProgress)
    .where(and(eq(studentProgress.userId, userId), eq(studentProgress.videoId, videoId)))
    .limit(1);
  const existing = existingRows[0];

  if (existing && video.maxViews != null && existing.viewCount >= video.maxViews) {
    throw new ServiceError(403, "VIEW_LIMIT_REACHED", "انتهت عدد المشاهدات المتاحة لهذا الفيديو");
  }

  await db
    .insert(studentProgress)
    .values({
      userId,
      courseId: video.courseId,
      videoId,
      viewCount: 1,
      lastViewedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [studentProgress.userId, studentProgress.videoId],
      set: {
        viewCount: sql`${studentProgress.viewCount} + 1`,
        lastViewedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { videoId, viewsLeft: video.maxViews != null ? video.maxViews - ((existing?.viewCount ?? 0) + 1) : null };
}

export async function markAllNotificationsRead(userId: string) {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  return { marked: rows.length };
}

export async function getUserNotifications(userId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
