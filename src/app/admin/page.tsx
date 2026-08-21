import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can, isAdminRole } from "@/lib/rbac";
import {
  getAdminOverview,
  listCoursesAdmin,
  listUsersAdmin,
  listCouponsAdmin,
  listOrdersAdmin,
} from "@/lib/services/admin.service";
import { listGrades, listSubjects } from "@/lib/services/catalog.service";
import { AdminConsole } from "@/components/admin-console";

export const metadata: Metadata = { title: "لوحة الإدارة" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminRole(user.role)) redirect("/dashboard");

  const [overview, courseRows, userRows, couponRows, orderRows, gradeRows, subjectRows] = await Promise.all([
    getAdminOverview(),
    listCoursesAdmin(),
    listUsersAdmin(),
    listCouponsAdmin(),
    listOrdersAdmin(),
    listGrades(),
    listSubjects(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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
      />
    </main>
  );
}
