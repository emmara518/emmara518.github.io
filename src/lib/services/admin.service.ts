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
  academicStages,
  auditLogs,
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
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      balanceCents: sql<number>`COALESCE(${walletAccounts.balanceCents}, 0)`,
    })
    .from(users)
    .leftJoin(walletAccounts, eq(walletAccounts.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(200);
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

export async function countPaidCouponsUnderUse() {
  return db
    .select({ value: sql<number>`count(*)::int` })
    .from(coupons)
    .where(and(eq(coupons.isActive, true)));
}

export async function listExamsAdmin() {
  return db
    .select({
      id: exams.id,
      title: exams.title,
      mode: exams.mode,
      durationMin: exams.durationMin,
      isPublished: exams.isPublished,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      createdAt: exams.createdAt,
      attemptsCount: sql<number>`(SELECT count(*)::int FROM ${examAttempts} WHERE ${examAttempts.examId} = ${exams.id})`,
      avgScore: sql<number>`(SELECT COALESCE(avg(${examAttempts.score}), 0)::int FROM ${examAttempts} WHERE ${examAttempts.examId} = ${exams.id})`,
    })
    .from(exams)
    .innerJoin(courses, eq(exams.courseId, courses.id))
    .orderBy(desc(exams.createdAt))
    .limit(100);
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
      lessonTitle: lessons.title,
      courseTitle: courses.title,
      sortOrder: videos.sortOrder,
    })
    .from(videos)
    .innerJoin(lessons, eq(videos.lessonId, lessons.id))
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .orderBy(courses.title, videos.sortOrder)
    .limit(150);
}

export async function listCourseFilesAdmin() {
  return db
    .select({
      id: courseFiles.id,
      title: courseFiles.title,
      kind: courseFiles.kind,
      sizeBytes: courseFiles.sizeBytes,
      storageKey: courseFiles.storageKey,
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
      likesCount: communityPosts.likesCount,
      createdAt: communityPosts.createdAt,
      authorName: users.name,
      authorRole: users.role,
      courseTitle: courses.title,
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

