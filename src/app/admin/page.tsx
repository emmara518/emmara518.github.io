import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db, ensureDbReady } from "@/db";
import { eq, or } from "drizzle-orm";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole, type GranularPermission } from "@/lib/rbac";
import { effectivePermissionsForUser } from "@/lib/permission-guard";
import {
  getAdminOverview,
  listCoursesAdmin,
  listUsersAdmin,
  listCouponsAdmin,
  listOrdersAdmin,
  listExamsAdmin,
  listExamAttemptsAdmin,
  listVideosAdmin,
  listLessonsAdmin,
  listCourseFilesAdmin,
  listQuestionBankAdmin,
  listSubscriptionsAdmin,
  listInvoicesAdmin,
  listCommunityPostsAdmin,
  listStagesAdmin,
} from "@/lib/services/admin.service";
import { listGrades, listSubjects } from "@/lib/services/catalog.service";
import { AdminConsole } from "@/components/admin-console";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "لوحة الإدارة" };

export default async function AdminPage() {
  await ensureDbReady();

  // Security gate / actor resolution:
  let sessionUser = await getSessionUser();

  // Production: anonymous visitors must go through the login page — never expose
  // the live admin console to unauthenticated traffic. Development keeps the
  // legacy teacher-fallback so the dev loop on Vercel previews still works.
  if (!sessionUser && process.env.NODE_ENV === "production") {
    redirect("/login?next=/admin");
  }

  if (!sessionUser || !isAdminRole(sessionUser.role)) {
    // Development-only fallback: resolve an existing teacher/admin to avoid
    // a redirect loop on preview deploys where the cookie may not survive.
    if (process.env.NODE_ENV === "production") {
      redirect("/login?next=/admin");
    }
    const adminRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(or(eq(users.role, "teacher"), eq(users.role, "admin")))
      .limit(1);

    if (adminRows[0]) {
      sessionUser = adminRows[0];
    } else {
      sessionUser = {
        id: "teacher-default",
        name: "مستر محمد سعيد",
        email: "mohamed.saeed@drosmath.com",
        role: "teacher" as const,
        avatarUrl: "/images/assets/teacher.webp",
      };
    }
  }
  const user = sessionUser;
  const actorPermissions = await effectivePermissionsForUser(user);
  const isAdmin = user.role === "admin";
  const has = (permission: GranularPermission) => actorPermissions.includes(permission);

  // Each admin section fetch is wrapped so that a DB failure is
  // surfaced in the UI as a non-blocking banner instead of silently
  // returning an empty table.
  const safe = async <T,>(
    section: string,
    fallback: T,
    p: Promise<T>
  ): Promise<T> => {
    try {
      return await p;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fetchErrors.push({ section, message: msg });
      return fallback;
    }
  };
  const fetchErrors: { section: string; message: string }[] = [];

  /** Load a section only when the actor holds its permission; otherwise
   *  return the empty fallback so unauthorized data never enters the RSC
   *  payload. */
  const load = <T,>(
    allowed: boolean,
    section: string,
    fallback: T,
    loader: () => Promise<T>,
  ): Promise<T> =>
    allowed ? safe(section, fallback, loader()) : Promise.resolve(fallback);

  const emptyOverview = {
    stats: { students: 0, publishedCourses: 0, revenueCents: 0, activeSubscriptions: 0 },
    revenueByMonth: [],
    recentOrders: [],
    recentAudit: [],
  };

  const [
    overview,
    courseRows,
    userRows,
    couponRows,
    orderRows,
    gradeRows,
    subjectRows,
    examRows,
    attemptRows,
    videoRows,
    fileRows,
    questionRows,
    subRows,
    invoiceRows,
    postRows,
    stageRows,
    lessonRows,
  ] = await Promise.all([
    load(isAdmin, "overview", emptyOverview, getAdminOverview),
    load(has("courses.view"), "courses", [] as Awaited<ReturnType<typeof listCoursesAdmin>>, listCoursesAdmin),
    load(has("students.view"), "users", [] as Awaited<ReturnType<typeof listUsersAdmin>>, listUsersAdmin),
    load(isAdmin, "coupons", [] as Awaited<ReturnType<typeof listCouponsAdmin>>, listCouponsAdmin),
    load(isAdmin, "orders", [] as Awaited<ReturnType<typeof listOrdersAdmin>>, listOrdersAdmin),
    load(has("courses.view"), "grades", [] as Awaited<ReturnType<typeof listGrades>>, listGrades),
    load(has("courses.view"), "subjects", [] as Awaited<ReturnType<typeof listSubjects>>, listSubjects),
    load(has("exams.view"), "exams", [] as Awaited<ReturnType<typeof listExamsAdmin>>, listExamsAdmin),
    load(has("students.view"), "exam_attempts", [] as Awaited<ReturnType<typeof listExamAttemptsAdmin>>, listExamAttemptsAdmin),
    load(has("content.view"), "videos", [] as Awaited<ReturnType<typeof listVideosAdmin>>, listVideosAdmin),
    load(has("content.view"), "course_files", [] as Awaited<ReturnType<typeof listCourseFilesAdmin>>, listCourseFilesAdmin),
    load(has("exams.view"), "question_bank", [] as Awaited<ReturnType<typeof listQuestionBankAdmin>>, listQuestionBankAdmin),
    load(isAdmin, "subscriptions", [] as Awaited<ReturnType<typeof listSubscriptionsAdmin>>, listSubscriptionsAdmin),
    load(isAdmin, "invoices", [] as Awaited<ReturnType<typeof listInvoicesAdmin>>, listInvoicesAdmin),
    load(has("community.manage"), "community_posts", [] as Awaited<ReturnType<typeof listCommunityPostsAdmin>>, listCommunityPostsAdmin),
    load(has("courses.view"), "stages", [] as Awaited<ReturnType<typeof listStagesAdmin>>, listStagesAdmin),
    load(has("content.view"), "lessons", [] as Awaited<ReturnType<typeof listLessonsAdmin>>, listLessonsAdmin),
  ]);

  return (
    <AdminConsole
      actor={{ name: user.name, role: user.role }}
      actorPermissions={actorPermissions}
      canManageUsers={isAdmin}
      overview={{
        stats: overview.stats,
        revenueByMonth: overview.revenueByMonth,
        recentOrders: (overview.recentOrders || []).map((o) => ({ ...o, createdAt: new Date(o.createdAt).toISOString() })),
        recentAudit: (overview.recentAudit || []).map((a) => ({ ...a, createdAt: new Date(a.createdAt).toISOString() })),
      }}
      courses={(courseRows || []).map((c) => ({ ...c, createdAt: new Date(c.createdAt).toISOString() }))}
      users={(userRows || []).map((u) => ({ ...u, createdAt: new Date(u.createdAt).toISOString() }))}
      coupons={(couponRows || []).map((c) => ({ ...c, createdAt: new Date(c.createdAt).toISOString(), expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null }))}
      orders={(orderRows || []).map((o) => ({ ...o, createdAt: new Date(o.createdAt).toISOString() }))}
      grades={(gradeRows || []).map((g) => ({ id: g.id, name: g.name }))}
      subjects={(subjectRows || []).map((s) => ({ id: s.id, name: s.name }))}
      exams={(examRows || []).map((e) => ({
        ...e,
        createdAt: new Date(e.createdAt).toISOString(),
        availableFrom: e.availableFrom ? new Date(e.availableFrom).toISOString() : null,
        availableUntil: e.availableUntil ? new Date(e.availableUntil).toISOString() : null,
      }))}
      attempts={(attemptRows || []).map((a) => ({ ...a, submittedAt: new Date(a.submittedAt).toISOString() }))}
        videos={(videoRows || []).map((v) => ({ ...v }))}
        lessons={(lessonRows || []).map((l) => ({ ...l }))}
      courseFiles={(fileRows || []).map((f) => ({ ...f, createdAt: new Date(f.createdAt).toISOString() }))}
      questions={(questionRows || []).map((q) => ({ ...q }))}
      subscriptions={(subRows || []).map((s) => ({ ...s, startsAt: new Date(s.startsAt).toISOString(), endsAt: s.endsAt ? new Date(s.endsAt).toISOString() : null }))}
      invoices={(invoiceRows || []).map((i) => ({ ...i, issuedAt: new Date(i.issuedAt).toISOString() }))}
      communityPosts={(postRows || []).map((p) => ({ ...p, createdAt: new Date(p.createdAt).toISOString() }))}
      stages={(stageRows || []).map((s) => ({ ...s }))}
      fetchErrors={fetchErrors}
    />
  );
}

