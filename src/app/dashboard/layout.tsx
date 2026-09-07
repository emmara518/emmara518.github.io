import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";

/**
 * Dashboard auth gate — no chrome here on purpose.
 * The workspace shell lives one level down, per route group:
 * - `(main)/layout.tsx` renders the full sidebar + topbar shell.
 * - `(focus)/layout.tsx` renders the focus shell (lesson/exam rooms).
 * Keeping the shell out of this shared layout prevents the double-shell
 * bug (two topbars + two sidebars on focus routes).
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (isAdminRole(user.role)) redirect("/admin");
  if (user.role === "parent") redirect("/parent");

  return <>{children}</>;
}
