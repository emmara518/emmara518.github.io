import { err, ok } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { getCourseBySlug, getCourseCurriculum } from "@/lib/services/catalog.service";
import { hasActiveSubscription } from "@/lib/services/billing.service";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "published") {
    return err(404, "COURSE_NOT_FOUND", "الكورس غير موجود");
  }

  const user = await getSessionUser();
  const owned = user ? await hasActiveSubscription(user.id, course.id) : false;
  const curriculum = await getCourseCurriculum(course.id);

  return ok({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      description: course.description,
      priceCents: course.priceCents,
      gradeName: course.gradeName,
      stageName: course.stageName,
      subjectName: course.subjectName,
      teacherName: course.teacherName,
    },
    owned,
    lessons: curriculum.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      isFreePreview: l.isFreePreview,
      unlocked: owned || l.isFreePreview,
      videos: l.videos.map((v) => ({
        id: v.id,
        title: v.title,
        durationSec: v.durationSec,
        sortOrder: v.sortOrder,
        // never leak an embed id for locked content
        youtubeVideoId: owned || l.isFreePreview ? v.youtubeVideoId : null,
      })),
    })),
    files: curriculum.files
      .filter((f) => owned || f.isFreePreview)
      .map((f) => ({ id: f.id, title: f.title, kind: f.kind, sizeBytes: f.sizeBytes, isFreePreview: f.isFreePreview })),
    exams: curriculum.exams,
  });
}
