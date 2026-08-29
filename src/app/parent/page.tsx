import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Award, BookOpen, ClipboardCheck, UsersRound } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { getChildren } from "@/lib/services/parent.service";
import { Badge, Card, EmptyState, buttonStyles } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "بوابة ولي الأمر" };

function scoreTone(percent: number | null): "success" | "gold" | "danger" | "muted" {
  if (percent === null) return "muted";
  if (percent >= 85) return "success";
  if (percent >= 50) return "gold";
  return "danger";
}

export default async function ParentHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/parent");
  const isAdmin = isAdminRole(user.role);
  if (user.role !== "parent" && !isAdmin) redirect("/dashboard");

  const children = await getChildren(user.id);

  return (
    <div className="space-y-5">
      <PageHeader
        title="متابعة الأبناء"
        subtitle="نتائج الاختبارات وتقدّم الكورسات لكل ابن مشترك في المنصة — محدّثة لحظة بلحظة."
        backHref=""
        backLabel=""
      />

      {children.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={22} />}
          title={isAdmin ? "لا يوجد أبناء مرتبطون بهذا الحساب." : "لا يوجد أبناء مرتبطون بحسابك بعد."}
          hint={
            isAdmin
              ? "تظهر هنا حسابات الطلبة المرتبطة عبر parent_links."
              : "يتم الربط تلقائيًا برقم موبايل ولي الأمر الذي أدخله ابنك وقت إنشاء حسابه. تأكد أن ابنك أدخل رقمك الصحيح، أو تواصل مع الإدارة."
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {children.map((child) => (
            <Card key={child.id} hover className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={child.name} src={child.avatarUrl} size="lg" tone="brand" className="size-11" />
                  <div className="min-w-0 space-y-0.5 leading-tight">
                    <p className="truncate text-base font-extrabold text-ink">{child.name}</p>
                    <p className="truncate text-xs font-semibold text-muted">{child.gradeName ?? "بدون صف دراسي"}</p>
                  </div>
                </div>
                <Badge tone={scoreTone(child.avgPercent)}>
                  {child.avgPercent !== null ? `المعدل ${child.avgPercent}%` : "لا نتائج بعد"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-surface2/60 px-2 py-3">
                  <BookOpen size={15} className="mx-auto text-brand" aria-hidden />
                  <p className="mt-1 font-mono text-xl font-black text-ink">{child.activeCourses}</p>
                  <p className="mt-0.5 text-xs font-bold text-muted">كورس نشط</p>
                </div>
                <div className="rounded-xl bg-surface2/60 px-2 py-3">
                  <ClipboardCheck size={15} className="mx-auto text-brand" aria-hidden />
                  <p className="mt-1 font-mono text-xl font-black text-ink">{child.attemptsCount}</p>
                  <p className="mt-0.5 text-xs font-bold text-muted">اختبار محلول</p>
                </div>
                <div className="rounded-xl bg-surface2/60 px-2 py-3">
                  <Award size={15} className="mx-auto text-gold" aria-hidden />
                  <p className="mt-1 font-mono text-xl font-black text-ink">{child.avgPercent ?? "—"}%</p>
                  <p className="mt-0.5 text-xs font-bold text-muted">متوسط الدرجات</p>
                </div>
              </div>

              <Link href={`/parent/children/${child.id}`} className={buttonStyles("primary", "sm")}>
                عرض النتائج التفصيلية
                <ArrowLeft size={14} />
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
