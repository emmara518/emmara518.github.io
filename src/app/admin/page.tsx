import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
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

export const metadata: Metadata = { title: "لوحة الإدارة" };

export default async function AdminPage() {
  // Security gate: only teacher/admin roles may enter the console.
  // NOTE: access is session-based; every mutation endpoint re-checks RBAC.
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isAdminRole(sessionUser.role)) {
    redirect("/login");
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
    getAdminOverview(),
    listCoursesAdmin(),
    listUsersAdmin(),
    listCouponsAdmin(),
    listOrdersAdmin(),
    listGrades(),
    listSubjects(),
    listExamsAdmin(),
    listExamAttemptsAdmin(),
    listVideosAdmin(),
    listCourseFilesAdmin(),
    listQuestionBankAdmin(),
    listSubscriptionsAdmin(),
    listInvoicesAdmin(),
    listCommunityPostsAdmin(),
    listStagesAdmin(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <AdminConsole
        actor={{ name: user.name, role: user.role }}
        canManageUsers={can(user.role, "users:manage")}
        overview={{
          stats: overview.stats,
          revenueByMonth: overview.revenueByMonth,
          recentOrders: overview.recentOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
          recentAudit: overview.recentAudit.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
        }}
        courses={courseRows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
        users={userRows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        coupons={couponRows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null }))}
        orders={orderRows.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
        grades={gradeRows.map((g) => ({ id: g.id, name: g.name }))}
        subjects={subjectRows.map((s) => ({ id: s.id, name: s.name }))}
        exams={examRows.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
        attempts={attemptRows.map((a) => ({ ...a, submittedAt: a.submittedAt.toISOString() }))}
        videos={videoRows.map((v) => ({ ...v }))}
        courseFiles={fileRows.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))}
        questions={questionRows.map((q) => ({ ...q }))}
        subscriptions={subRows.map((s) => ({ ...s, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt ? s.endsAt.toISOString() : null }))}
        invoices={invoiceRows.map((i) => ({ ...i, issuedAt: i.issuedAt.toISOString() }))}
        communityPosts={postRows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
        stages={stageRows.map((s) => ({ ...s }))}
      />
    </main>
  );
}
