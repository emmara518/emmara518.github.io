import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { listCommunityFeed, listAccessibleGroups } from "@/lib/services/community.service";
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

  const [feed, enrollments, groups] = await Promise.all([
    listCommunityFeed(user),
    listMyEnrollments(user),
    listAccessibleGroups(user),
  ]);

  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name, scope: g.scope, courseTitle: undefined as string | undefined }));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="مجتمع الطلاب"
        subtitle="اطرح سؤالك — يجيبك فريق المساعدين بحل نصي أو صورة أو فيديو"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* feed */}
        <div className="min-w-0 space-y-4 pb-24 lg:pb-0">
          {groups.length > 0 && (
            <Card className="space-y-2 p-4">
              <p className="text-xs font-bold text-muted">مجموعات النقاش المتاحة لك</p>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <a
                    key={g.id}
                    href={`#group-${g.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface2 px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    <span className="size-1.5 rounded-full bg-brand" /> {g.name}
                    <span className="text-xs opacity-70">
                      {g.scope === "public" ? "عام" : g.scope === "course" ? "كورس" : g.scope === "stage" ? "مرحلة" : "خاص"}
                    </span>
                  </a>
                ))}
              </div>
            </Card>
          )}
          <CommunityFeed posts={feed.posts as FeedPost[]} />
        </div>

        {/* ask panel */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <CommunityComposer
            courses={enrollments.map((e) => ({ slug: e.slug, title: e.title }))}
            groups={groupOptions}
          />
          <Card className="space-y-2 p-5">
            <details open className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold lg:cursor-default lg:pointer-events-none">
                <FileText size={15} className="text-brand" /> إرشادات المجتمع
              </summary>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-muted">
                <li>اكتب رقم السؤال أو الجزء المطلوب شرحه بدقة.</li>
                <li>كل منشور يمر على مراجعة المشرفين قبل ظهوره.</li>
                <li>الحلول من فريق المساعدين فقط وتظهر كتعليق موثق.</li>
              </ul>
            </details>
          </Card>
        </div>
      </div>
    </div>
  );
}
