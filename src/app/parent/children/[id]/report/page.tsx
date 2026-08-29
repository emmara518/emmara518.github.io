import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getChildProgress } from "@/lib/services/parent.service";
import { ParentReport } from "@/components/parent-report";

export const metadata: Metadata = { title: "تقرير تقدّم الطالب" };

/**
 * Parent progress report — print-friendly.
 *
 * Reuses `getChildProgress` from `parent.service.ts`; the data it returns
 * is the v1 surface (enrollments + recent exam attempts). A future revision
 * can add weak-topics and watch-time sections without a new service.
 */
export default async function ChildReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=/parent/children/${id}/report`);
  const isAdmin = isAdminRole(user.role);
  if (user.role !== "parent" && !isAdmin) redirect("/dashboard");

  let data;
  try {
    data = await getChildProgress(user.id, id);
  } catch {
    redirect("/parent");
  }

  return <ParentReport data={data} parentName={user.name} generatedAt={new Date()} />;
}
