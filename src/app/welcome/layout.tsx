import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";

/**
 * Standalone welcome shell — auth gate only.
 * Deliberately NOT wrapped in the dashboard chrome (topbar/sidebar):
 * the focus-mode experience gives the onboarding copy room to breathe.
 */
export default async function WelcomeLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/welcome");
  if (isAdminRole(user.role)) redirect("/admin");
  if (user.role === "parent") redirect("/parent");

  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
