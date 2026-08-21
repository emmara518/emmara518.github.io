import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok, parseJson, applyRateLimit } from "@/lib/http";
import { purchaseSchema } from "@/lib/contracts";
import { purchaseCourse } from "@/lib/services/billing.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const rateLimitResponse = await applyRateLimit(request, "enroll", `enroll:${(await params).slug}`);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول أولًا");
  if (!can(auth.user.role, "course:enroll")) {
    return err(403, "FORBIDDEN", "هذا الحساب لا يملك صلاحية الاشتراك في الكورسات");
  }

  const parsed = await parseJson(request, purchaseSchema);
  if ("response" in parsed) return parsed.response;

  const { slug } = await params;
  const course = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, slug)).limit(1);
  if (!course[0]) return err(404, "COURSE_NOT_FOUND", "الكورس غير موجود");

  try {
    const result = await purchaseCourse(auth.user.id, course[0].id, parsed.data.couponCode || undefined);
    return ok(result, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
