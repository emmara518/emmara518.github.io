import { desc, eq, sql, and } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  courses,
  grades,
  subjects,
  lessons,
  videos,
  courseFiles,
  questionBank,
  exams,
  examAttempts,
  orders,
  invoices,
  coupons,
  walletAccounts,
  subscriptions,
  communityPosts,
  communityReplies,
  academicStages,
  auditLogs,
  paymentChannels,
  paymentChannelTypeEnum,
  examGroups,
} from "@/db/schema";
import { ServiceError } from "../errors";
import type { SessionUser } from "../auth";
import type { Role } from "../rbac";
import type { AdminCourseInput, CouponInput } from "../contracts";

/** Admin operations — every mutation writes an audit trail. */

async function audit(actor: SessionUser, action: string, entity: string, entityId: string | null, meta?: Record<string, unknown>) {
  await db.insert(auditLogs).values({ actorId: actor.id, action, entity, entityId, meta });
}

export async function getAdminOverview() {
  try {
    const [studentsCount] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "student"));
    const [coursesCount] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(courses)
      .where(eq(courses.status, "published"));
    const [revenue] = await db
      .select({ value: sql<number>`COALESCE(sum(${invoices.totalCents}),0)::int` })
      .from(invoices);
    const [subsCount] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    const revenueByMonth = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${invoices.issuedAt}), 'YYYY-MM')`,
        total: sql<number>`COALESCE(sum(${invoices.totalCents}),0)::int`,
      })
      .from(invoices)
      .groupBy(sql`date_trunc('month', ${invoices.issuedAt})`)
      .orderBy(sql`date_trunc('month', ${invoices.issuedAt})`);

    const recentOrders = await db
      .select({
        id: orders.id,
        totalCents: orders.totalCents,
        status: orders.status,
        createdAt: orders.createdAt,
        studentName: users.name,
        courseTitle: courses.title,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(courses, eq(orders.courseId, courses.id))
      .orderBy(desc(orders.createdAt))
      .limit(8);

    const recentAudit = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        createdAt: auditLogs.createdAt,
        actorName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8);

    return {
      stats: {
        students: Number(studentsCount?.value ?? 0),
        publishedCourses: Number(coursesCount?.value ?? 0),
        revenueCents: Number(revenue?.value ?? 0),
        activeSubscriptions: Number(subsCount?.value ?? 0),
      },
      revenueByMonth: revenueByMonth || [],
      recentOrders: recentOrders || [],
      recentAudit: recentAudit || [],
    };
  } catch (err) {
    console.error("[admin.service] getAdminOverview error:", err);
    return {
      stats: {
        students: 0,
        publishedCourses: 0,
        revenueCents: 0,
        activeSubscriptions: 0,
      },
      revenueByMonth: [],
      recentOrders: [],
      recentAudit: [],
    };
  }
}

export async function listUsersAdmin() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      balanceCents: sql<number>`COALESCE(${walletAccounts.balanceCents}, 0)`,
      enrolledCourseIds: sql<
        string[]
      >`COALESCE(array_agg(${subscriptions.courseId}) FILTER (WHERE ${subscriptions.courseId} IS NOT NULL), '{}')`,
    })
    .from(users)
    .leftJoin(walletAccounts, eq(walletAccounts.userId, users.id))
    .leftJoin(
      subscriptions,
      and(eq(subscriptions.userId, users.id), eq(subscriptions.status, "active")),
    )
    .groupBy(users.id, walletAccounts.balanceCents)
    .orderBy(desc(users.createdAt))
    .limit(500);
  return rows;
}

export async function setUserRole(actor: SessionUser, userId: string, role: Role) {
  if (actor.id === userId) throw new ServiceError(422, "SELF_ROLE", "لا يمكنك تغيير دورك بنفسك");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  await audit(actor, "users.set_role", "users", userId, { role });
  return { userId, role };
}

export async function setUserActive(actor: SessionUser, userId: string, isActive: boolean) {
  if (actor.id === userId) throw new ServiceError(422, "SELF_LOCK", "لا يمكنك تعطيل حسابك بنفسك");
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
  await audit(actor, isActive ? "users.activate" : "users.deactivate", "users", userId);
  return { userId, isActive };
}

export async function listCoursesAdmin() {
  return db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      status: courses.status,
      priceCents: courses.priceCents,
      coverImageUrl: courses.coverImageUrl,
      requireSequentialProgress: courses.requireSequentialProgress,
      createdAt: courses.createdAt,
      gradeName: grades.name,
      subjectName: subjects.name,
      lessonsCount: sql<number>`(SELECT count(*)::int FROM ${lessons} WHERE ${lessons.courseId} = ${courses.id})`,
    })
    .from(courses)
    .innerJoin(grades, eq(courses.gradeId, grades.id))
    .innerJoin(subjects, eq(courses.subjectId, subjects.id))
    .orderBy(desc(courses.createdAt))
    .limit(100);
}

export async function createCourse(actor: SessionUser, input: AdminCourseInput) {
  const existing = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, input.slug)).limit(1);
  if (existing[0]) throw new ServiceError(409, "SLUG_TAKEN", "الرابط اللاتيني مستخدم بالفعل");
  const [created] = await db
    .insert(courses)
    .values({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      description: input.description,
      gradeId: input.gradeId,
      subjectId: input.subjectId,
      teacherId: actor.id,
      priceCents: Math.round(input.priceEgp * 100),
      status: "draft",
      coverImageUrl: input.coverUrl ? input.coverUrl : null,
      requireSequentialProgress: input.requireSequential ?? false,
    })
    .returning({ id: courses.id, slug: courses.slug });
  await audit(actor, "courses.create", "courses", created.id, { slug: created.slug });
  return created;
}

export async function setCourseStatus(actor: SessionUser, courseId: string, status: "draft" | "published" | "archived") {
  await db.update(courses).set({ status }).where(eq(courses.id, courseId));
  await audit(actor, "courses.set_status", "courses", courseId, { status });
  return { courseId, status };
}

export async function listCouponsAdmin() {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt)).limit(50);
}

export async function createCoupon(actor: SessionUser, input: CouponInput) {
  const code = input.code.toUpperCase();
  const kind = input.kind ?? "course_percent";
  const amountCents = input.amountEgp != null ? Math.round(input.amountEgp * 100) : null;

  if (kind === "wallet_balance" && (!amountCents || amountCents <= 0)) {
    throw new ServiceError(422, "AMOUNT_REQUIRED", "كود الرصيد يحتاج قيمة مبلغ بالجنيه");
  }
  if (kind === "course_percent" && input.amountEgp != null) {
    throw new ServiceError(422, "AMOUNT_NOT_ALLOWED", "كوبونات الكورسات تستخدم نسبة خصم فقط");
  }
  if (kind === "course_access") {
    if (!input.courseId) {
      throw new ServiceError(422, "COURSE_REQUIRED", "كود الاكسس يحتاج تحديد الكورس");
    }
    const courseRows = await db
      .select({ id: courses.id, status: courses.status, title: courses.title })
      .from(courses)
      .where(eq(courses.id, input.courseId))
      .limit(1);
    if (!courseRows[0]) throw new ServiceError(404, "COURSE_NOT_FOUND", "الكورس غير موجود");
  }

  const existing = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1);
  if (existing[0]) throw new ServiceError(409, "COUPON_EXISTS", "كود الكوبون مستخدم بالفعل");
  const [created] = await db
    .insert(coupons)
    .values({
      code,
      kind,
      percentOff: kind === "course_percent" ? input.percentOff : 0,
      amountCents: kind === "wallet_balance" ? amountCents : null,
      courseId: kind === "course_access" ? (input.courseId ?? null) : null,
      maxUses: input.maxUses,
    })
    .returning({ id: coupons.id });
  await audit(actor, "coupons.create", "coupons", created.id, {
    code,
    kind,
    value:
      kind === "wallet_balance"
        ? amountCents
        : kind === "course_access"
          ? input.courseId
          : `${input.percentOff}%`,
  });
  return created;
}

export async function listOrdersAdmin() {
  return db
    .select({
      id: orders.id,
      totalCents: orders.totalCents,
      discountCents: orders.discountCents,
      status: orders.status,
      createdAt: orders.createdAt,
      studentName: users.name,
      studentEmail: users.email,
      courseTitle: courses.title,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(courses, eq(orders.courseId, courses.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);
}

export async function listExamsAdmin() {
  return db
    .select({
      id: exams.id,
      title: exams.title,
      description: exams.description,
      type: exams.type,
      durationMin: exams.durationMin,
      groupId: exams.groupId,
      passingScore: exams.passingScore,
      maxAttempts: exams.maxAttempts,
      shuffleQuestions: exams.shuffleQuestions,
      availableFrom: exams.availableFrom,
      availableUntil: exams.availableUntil,
      isPublished: exams.isPublished,
      isActive: exams.isActive,
      sortOrder: exams.sortOrder,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      createdAt: exams.createdAt,
      attemptsCount: sql<number>`(SELECT count(*)::int FROM ${examAttempts} WHERE ${examAttempts.examId} = ${exams.id})`,
      avgScore: sql<number>`(SELECT COALESCE(avg(${examAttempts.score}), 0)::int FROM ${examAttempts} WHERE ${examAttempts.examId} = ${exams.id})`,
    })
    .from(exams)
    .innerJoin(courses, eq(exams.courseId, courses.id))
    .orderBy(exams.sortOrder, desc(exams.createdAt))
    .limit(100);
}

export async function createExamAdvanced(
  actor: SessionUser,
  input: {
    title: string;
    description?: string;
    courseId: string;
    groupId?: string | null;
    type: "graded" | "practice" | "quiz" | "surprise" | "final" | "diagnostic";
    durationMin: number;
    perQuestionSec?: number | null;
    maxAttempts?: number | null;
    passingScore: number;
    shuffleQuestions: boolean;
    showResultsImmediately: boolean;
    prerequisiteExamId?: string | null;
    availableFrom?: string | null;
    availableUntil?: string | null;
    isPublished: boolean;
  }
) {
  const [created] = await db
    .insert(exams)
    .values({
      title: input.title,
      description: input.description ?? "",
      courseId: input.courseId,
      groupId: input.groupId ?? null,
      type: input.type,
      durationMin: input.durationMin,
      perQuestionSec: input.perQuestionSec ?? null,
      maxAttempts: input.maxAttempts ?? null,
      passingScore: input.passingScore,
      shuffleQuestions: input.shuffleQuestions,
      showResultsImmediately: input.showResultsImmediately,
      prerequisiteExamId: input.prerequisiteExamId ?? null,
      availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
      availableUntil: input.availableUntil ? new Date(input.availableUntil) : null,
      isPublished: input.isPublished,
      isActive: true,
    })
    .returning({ id: exams.id, title: exams.title });
  await audit(actor, "exams.create", "exams", created.id, input);
  return created;
}

export async function listExamGroupsAdmin() {
  return db
    .select({
      id: examGroups.id,
      name: examGroups.name,
      description: examGroups.description,
      courseId: examGroups.courseId,
      courseTitle: courses.title,
      sortOrder: examGroups.sortOrder,
      isActive: examGroups.isActive,
      examsCount: sql<number>`(SELECT count(*)::int FROM ${exams} WHERE ${exams.groupId} = ${examGroups.id})`,
      createdAt: examGroups.createdAt,
    })
    .from(examGroups)
    .innerJoin(courses, eq(examGroups.courseId, courses.id))
    .orderBy(examGroups.sortOrder);
}

export async function createExamGroup(
  actor: SessionUser,
  input: { name: string; courseId: string; description?: string; sortOrder?: number }
) {
  const [created] = await db
    .insert(examGroups)
    .values({
      name: input.name,
      courseId: input.courseId,
      description: input.description ?? "",
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    })
    .returning({ id: examGroups.id, name: examGroups.name });
  await audit(actor, "exam_groups.create", "exam_groups", created.id, input);
  return created;
}

export async function deleteExamGroup(actor: SessionUser, id: string) {
  await db.delete(examGroups).where(eq(examGroups.id, id));
  await audit(actor, "exam_groups.delete", "exam_groups", id);
  return { id };
}

/** Reorders any sortable admin entity to match the given id sequence. */
export async function reorderEntities(
  actor: SessionUser,
  entity: "videos" | "lessons" | "exams",
  ids: string[],
) {
  const table = entity === "videos" ? videos : entity === "lessons" ? lessons : exams;
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(table)
      .set({ sortOrder: i + 1 })
      .where(eq(table.id, ids[i]));
  }
  await audit(actor, `${entity}.reorder`, entity, null, { count: ids.length });
  return { entity, count: ids.length };
}

export async function updateVideoMeta(
  actor: SessionUser,
  videoId: string,
  patch: { maxViews?: number | null; title?: string; youtubeId?: string },
) {
  const set: Record<string, unknown> = {};
  if (patch.maxViews !== undefined) set.maxViews = patch.maxViews;
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.youtubeId !== undefined) {
    set.youtubeVideoId = patch.youtubeId;
    // keep playlist ref consistent — direct uploads only
    set.youtubePlaylistId = null;
  }
  if (Object.keys(set).length === 0) throw new ServiceError(422, "EMPTY_PATCH", "لا توجد تعديلات");
  const [updated] = await db
    .update(videos)
    .set(set)
    .where(eq(videos.id, videoId))
    .returning({ id: videos.id });
  if (!updated) throw new ServiceError(404, "VIDEO_NOT_FOUND", "الفيديو غير موجود");
  await audit(actor, "videos.patch", "videos", videoId, set);
  return updated;
}

export async function updateLessonTitle(actor: SessionUser, lessonId: string, title: string) {
  const [updated] = await db
    .update(lessons)
    .set({ title })
    .where(eq(lessons.id, lessonId))
    .returning({ id: lessons.id });
  if (!updated) throw new ServiceError(404, "LESSON_NOT_FOUND", "الدرس غير موجود");
  await audit(actor, "lessons.rename", "lessons", lessonId, { title });
  return updated;
}

export async function createLesson(actor: SessionUser, input: { courseId: string; title: string; description?: string; isFreePreview?: boolean }) {
  const [created] = await db
    .insert(lessons)
    .values({
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? "",
      isFreePreview: input.isFreePreview ?? false,
      sortOrder: await db
        .select({ max: sql<number>`COALESCE(max(sort_order), 0)` })
        .from(lessons)
        .where(eq(lessons.courseId, input.courseId))
        .then((r) => (r[0]?.max ?? 0) + 1),
    })
    .returning({ id: lessons.id, title: lessons.title, courseId: lessons.courseId, sortOrder: lessons.sortOrder });
  await audit(actor, "lessons.create", "lessons", created.id, input);
  return created;
}

export async function createVideo(actor: SessionUser, input: { lessonId: string; youtubeVideoId: string; title: string; durationSec?: number }) {
  const [created] = await db
    .insert(videos)
    .values({
      lessonId: input.lessonId,
      youtubeVideoId: input.youtubeVideoId,
      title: input.title,
      durationSec: input.durationSec ?? 0,
      sortOrder: await db
        .select({ max: sql<number>`COALESCE(max(sort_order), 0)` })
        .from(videos)
        .where(eq(videos.lessonId, input.lessonId))
        .then((r) => (r[0]?.max ?? 0) + 1),
    })
    .returning({ id: videos.id, title: videos.title, lessonId: videos.lessonId, sortOrder: videos.sortOrder });
  await audit(actor, "videos.create", "videos", created.id, input);
  return created;
}

export async function setPostStatus(actor: SessionUser, postId: string, status: string) {
  const [updated] = await db
    .update(communityPosts)
    .set({ status, reviewedAt: new Date() })
    .where(eq(communityPosts.id, postId))
    .returning({ id: communityPosts.id, userId: communityPosts.userId });
  if (!updated) throw new ServiceError(404, "POST_NOT_FOUND", "المنشور غير موجود");
  await audit(actor, `community.${status}`, "community_posts", postId);
  return updated;
}

export async function listPostRepliesAdmin(postId: string) {
  return db
    .select({
      id: communityReplies.id,
      body: communityReplies.body,
      mediaKind: communityReplies.mediaKind,
      mediaKey: communityReplies.mediaKey,
      createdAt: communityReplies.createdAt,
      authorName: users.name,
      authorRole: users.role,
    })
    .from(communityReplies)
    .innerJoin(users, eq(communityReplies.userId, users.id))
    .where(eq(communityReplies.postId, postId))
    .orderBy(communityReplies.createdAt)
    .limit(50);
}

export async function createPostReplyAdmin(
  actor: SessionUser,
  postId: string,
  input: { body: string; mediaKind: string; mediaKey?: string | null },
) {
  const postRows = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(eq(communityPosts.id, postId))
    .limit(1);
  if (!postRows[0]) throw new ServiceError(404, "POST_NOT_FOUND", "المنشور غير موجود");
  const [created] = await db
    .insert(communityReplies)
    .values({
      postId,
      userId: actor.id,
      body: input.body,
      mediaKind: input.mediaKind,
      mediaKey: input.mediaKey ?? null,
    })
    .returning({ id: communityReplies.id });
  await audit(actor, "community.reply", "community_replies", created.id, { postId, mediaKind: input.mediaKind });
  return created;
}

export async function listExamAttemptsAdmin() {
  return db
    .select({
      id: examAttempts.id,
      examTitle: exams.title,
      studentName: users.name,
      studentEmail: users.email,
      score: examAttempts.score,
      totalMarks: examAttempts.totalMarks,
      submittedAt: examAttempts.submittedAt,
    })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .innerJoin(users, eq(examAttempts.userId, users.id))
    .orderBy(desc(examAttempts.submittedAt))
    .limit(100);
}

export async function listVideosAdmin() {
  return db
    .select({
      id: videos.id,
      title: videos.title,
      youtubeVideoId: videos.youtubeVideoId,
      durationSec: videos.durationSec,
      maxViews: videos.maxViews,
      lessonId: videos.lessonId,
      lessonTitle: lessons.title,
      courseTitle: courses.title,
      sortOrder: videos.sortOrder,
    })
    .from(videos)
    .innerJoin(lessons, eq(videos.lessonId, lessons.id))
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .orderBy(courses.title, lessons.sortOrder, videos.sortOrder)
    .limit(300);
}

export async function listLessonsAdmin() {
  return db
    .select({
      id: lessons.id,
      title: lessons.title,
      sortOrder: lessons.sortOrder,
      isFreePreview: lessons.isFreePreview,
      courseId: courses.id,
      courseTitle: courses.title,
      videosCount: sql<number>`(SELECT count(*)::int FROM ${videos} WHERE ${videos.lessonId} = ${lessons.id})`,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .orderBy(courses.title, lessons.sortOrder)
    .limit(300);
}

export async function listCourseFilesAdmin() {
  return db
    .select({
      id: courseFiles.id,
      title: courseFiles.title,
      kind: courseFiles.kind,
      sizeBytes: courseFiles.sizeBytes,
      storageKey: courseFiles.storageKey,
      courseId: courseFiles.courseId,
      isFreePreview: courseFiles.isFreePreview,
      courseTitle: courses.title,
      createdAt: courseFiles.createdAt,
    })
    .from(courseFiles)
    .innerJoin(courses, eq(courseFiles.courseId, courses.id))
    .orderBy(desc(courseFiles.createdAt))
    .limit(100);
}

export async function listQuestionBankAdmin() {
  return db
    .select({
      id: questionBank.id,
      topic: questionBank.topic,
      kind: questionBank.kind,
      prompt: questionBank.prompt,
      options: questionBank.options,
      correctIndex: questionBank.correctIndex,
      explanation: questionBank.explanation,
      difficulty: questionBank.difficulty,
      marks: questionBank.marks,
      subjectName: subjects.name,
    })
    .from(questionBank)
    .innerJoin(subjects, eq(questionBank.subjectId, subjects.id))
    .orderBy(subjects.name, questionBank.difficulty)
    .limit(150);
}

export async function listSubscriptionsAdmin() {
  return db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      startsAt: subscriptions.startsAt,
      endsAt: subscriptions.endsAt,
      studentName: users.name,
      studentEmail: users.email,
      courseTitle: courses.title,
      priceCents: courses.priceCents,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .innerJoin(courses, eq(subscriptions.courseId, courses.id))
    .orderBy(desc(subscriptions.startsAt))
    .limit(100);
}

export async function listInvoicesAdmin() {
  return db
    .select({
      id: invoices.id,
      number: invoices.number,
      totalCents: invoices.totalCents,
      issuedAt: invoices.issuedAt,
      orderId: invoices.orderId,
    })
    .from(invoices)
    .orderBy(desc(invoices.issuedAt))
    .limit(100);
}

export async function listCommunityPostsAdmin() {
  return db
    .select({
      id: communityPosts.id,
      body: communityPosts.body,
      status: communityPosts.status,
      likesCount: communityPosts.likesCount,
      createdAt: communityPosts.createdAt,
      authorName: users.name,
      authorRole: users.role,
      courseTitle: courses.title,
      repliesCount: sql<number>`(SELECT count(*)::int FROM ${communityReplies} WHERE ${communityReplies.postId} = ${communityPosts.id})`,
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .leftJoin(courses, eq(communityPosts.courseId, courses.id))
    .orderBy(desc(communityPosts.createdAt))
    .limit(100);
}

export async function listStagesAdmin() {
  return db
    .select({
      id: academicStages.id,
      name: academicStages.name,
      slug: academicStages.slug,
      sortOrder: academicStages.sortOrder,
    })
    .from(academicStages)
    .orderBy(academicStages.sortOrder);
}

/* ── payment channels ── */

export async function listPaymentChannels() {
  return db
    .select({
      id: paymentChannels.id,
      type: paymentChannels.type,
      label: paymentChannels.label,
      account: paymentChannels.account,
      owner: paymentChannels.owner,
      hint: paymentChannels.hint,
      isActive: paymentChannels.isActive,
      sortOrder: paymentChannels.sortOrder,
      createdAt: paymentChannels.createdAt,
      updatedAt: paymentChannels.updatedAt,
    })
    .from(paymentChannels)
    .orderBy(paymentChannels.sortOrder);
}

export async function upsertPaymentChannel(
  actor: SessionUser,
  input: {
    id: string;
    type?: "instapay" | "vodafone_cash" | "etisalat_cash" | "orange_cash" | "bank_transfer" | "other";
    label?: string;
    account?: string;
    owner?: string;
    hint?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  const existing = await db
    .select()
    .from(paymentChannels)
    .where(eq(paymentChannels.id, input.id))
    .limit(1);
  
  const current = existing[0];
  const set: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (input.type !== undefined) set.type = input.type;
  if (input.label !== undefined) set.label = input.label;
  if (input.account !== undefined) set.account = input.account;
  if (input.owner !== undefined) set.owner = input.owner;
  if (input.hint !== undefined) set.hint = input.hint;
  if (input.isActive !== undefined) set.isActive = input.isActive;
  if (input.sortOrder !== undefined) set.sortOrder = input.sortOrder;

  if (current) {
    // Update existing
    await db
      .update(paymentChannels)
      .set(set)
      .where(eq(paymentChannels.id, input.id));
  } else {
    // Insert new - need required fields
    if (!input.type || !input.label || !input.account || !input.owner) {
      throw new ServiceError(422, "MISSING_FIELDS", "جميع الحقول مطلوبة عند إنشاء قناة جديدة");
    }
    await db.insert(paymentChannels).values({
      id: input.id,
      type: input.type,
      label: input.label,
      account: input.account,
      owner: input.owner,
      hint: input.hint ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await audit(actor, "payment_channels.upsert", "payment_channels", input.id, input);
  return { id: input.id };
}

export async function deletePaymentChannel(actor: SessionUser, id: string) {
  await db.delete(paymentChannels).where(eq(paymentChannels.id, id));
  await audit(actor, "payment_channels.delete", "payment_channels", id);
  return { id };
}

export async function reorderPaymentChannels(actor: SessionUser, ids: string[]) {
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(paymentChannels)
      .set({ sortOrder: i + 1, updatedAt: new Date() })
      .where(eq(paymentChannels.id, ids[i]));
  }
  await audit(actor, "payment_channels.reorder", "payment_channels", null, { count: ids.length });
  return { count: ids.length };
}

