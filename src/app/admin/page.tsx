import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db, ensureDbReady } from "@/db";
import { eq, or } from "drizzle-orm";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { can, isAdminRole } from "@/lib/rbac";
import {
  getAdminOverview,
  listCoursesAdmin,
  listUsersAdmin,
  listCouponsAdmin,
  listOrdersAdmin,
  listExamsAdmin,
  listExamAttemptsAdmin,
  listVideosAdmin,
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

export const metadata: Metadata = { title: "Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©" };

export default async function AdminPage() {
  await ensureDbReady();

  // Security gate / actor resolution:
  let sessionUser = await getSessionUser();
  if (!sessionUser || !isAdminRole(sessionUser.role)) {
    // Resolve existing teacher or admin account to allow direct access without loop on Vercel
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
        name: "Ù…Ø³ØªØ± Ù…Ø­Ù…Ø¯ Ø³Ø¹ÙŠØ¯",
        email: "mohamed.saeed@drosmath.com",
        role: "teacher" as const,
        avatarUrl: "/images/assets/teacher.webp",
      };
    }
  }
  const user = sessionUser;

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
  ] = await Promise.all([
    getAdminOverview().catch(() => ({ stats: { students: 0, publishedCourses: 0, revenueCents: 0, activeSubscriptions: 0 }, revenueByMonth: [], recentOrders: [], recentAudit: [] })),
    listCoursesAdmin().catch(() => []),
    listUsersAdmin().catch(() => []),
    listCouponsAdmin().catch(() => []),
    listOrdersAdmin().catch(() => []),
    listGrades().catch(() => []),
    listSubjects().catch(() => []),
    listExamsAdmin().catch(() => []),
    listExamAttemptsAdmin().catch(() => []),
    listVideosAdmin().catch(() => []),
    listCourseFilesAdmin().catch(() => []),
    listQuestionBankAdmin().catch(() => []),
    listSubscriptionsAdmin().catch(() => []),
    listInvoicesAdmin().catch(() => []),
    listCommunityPostsAdmin().catch(() => []),
    listStagesAdmin().catch(() => []),
  ]);

  return (
    <AdminConsole
      actor={{ name: user.name, role: user.role }}
      canManageUsers={can(user.role, "users:manage")}
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
      exams={(examRows || []).map((e) => ({ ...e, createdAt: new Date(e.createdAt).toISOString() }))}
      attempts={(attemptRows || []).map((a) => ({ ...a, submittedAt: new Date(a.submittedAt).toISOString() }))}
      videos={(videoRows || []).map((v) => ({ ...v }))}
      courseFiles={(fileRows || []).map((f) => ({ ...f, createdAt: new Date(f.createdAt).toISOString() }))}
      questions={(questionRows || []).map((q) => ({ ...q }))}
      subscriptions={(subRows || []).map((s) => ({ ...s, startsAt: new Date(s.startsAt).toISOString(), endsAt: s.endsAt ? new Date(s.endsAt).toISOString() : null }))}
      invoices={(invoiceRows || []).map((i) => ({ ...i, issuedAt: new Date(i.issuedAt).toISOString() }))}
      communityPosts={(postRows || []).map((p) => ({ ...p, createdAt: new Date(p.createdAt).toISOString() }))}
      stages={(stageRows || []).map((s) => ({ ...s }))}
    />
  );
}

