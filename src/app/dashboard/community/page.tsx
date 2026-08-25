import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { listCommunityFeed } from "@/lib/services/community.service";
import { listMyEnrollments } from "@/lib/services/dashboard.service";
import { CommunityComposer } from "@/components/community-composer";
import { CommunityFeed, type FeedPost } from "@/components/community-feed";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "مجتمع الطلاب" };

export default async function CommunityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/community");
  if (isAdminRole(user.role)) redirect("/admin");

  const [feed, enrollments] = await Promise.all([
    listCommunityFeed(user),
    listMyEnrollments(user),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="مجتمع الطلاب"
        subtitle="اطرح سؤالك — يجيبك فريق المساعدين بحل نصي أو صورة أو فيديو"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* feed */}
        <div className="min-w-0 space-y-4">
          <CommunityFeed posts={feed.posts as FeedPost[]} />
        </div>

        {/* ask panel */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <CommunityComposer courses={enrollments.map((e) => ({ slug: e.slug, title: e.title }))} />
          <Card className="space-y-2 p-5">
            <p className="flex items-center gap-2 text-sm font-bold">
              <FileText size={15} className="text-brand" /> إرشادات المجتمع
            </p>
            <ul className="list-inside list-disc space-y-1.5 text-[11px] leading-relaxed text-muted">
              <li>اكتب رقم السؤال أو الجزء المطلوب شرحه بدقة.</li>
              <li>كل منشور يمر على مراجعة المشرفين قبل ظهوره.</li>
              <li>الحلول من فريق المساعدين فقط وتظهر كتعليق موثق.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
