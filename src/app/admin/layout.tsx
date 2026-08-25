import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

/**
 * Admin workspace shell (sidebar + topbar).
 * Signed-in non-admins are bounced to the student dashboard; anonymous visitors
 * fall through to the page's own actor resolution (existing /admin behavior).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const sessionUser = await getSessionUser();
  if (sessionUser && !isAdminRole(sessionUser.role)) {
    redirect("/dashboard");
  }

  const actorName = sessionUser?.name ?? "مستر محمد سعيد";
  const actorRole = sessionUser?.role ?? "teacher";

  return (
    <AdminShell actorName={actorName} actorRole={actorRole}>
      {children}
    </AdminShell>
  );
}
