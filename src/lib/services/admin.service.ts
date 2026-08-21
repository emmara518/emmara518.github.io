import { desc, eq, sql, and } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  courses,
  grades,
  subjects,
  lessons,
  orders,
  invoices,
  coupons,
  walletAccounts,
  subscriptions,
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
      students: studentsCount.value,
      publishedCourses: coursesCount.value,
      revenueCents: revenue.value,
      activeSubscriptions: subsCount.value,
    },
    revenueByMonth,
    recentOrders,
    recentAudit,
  };
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
  const existing = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1);
  if (existing[0]) throw new ServiceError(409, "COUPON_EXISTS", "كود الكوبون مستخدم بالفعل");
  const [created] = await db
    .insert(coupons)
    .values({ code, percentOff: input.percentOff, maxUses: input.maxUses })
    .returning({ id: coupons.id });
  await audit(actor, "coupons.create", "coupons", created.id, { code });
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
