import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { uploadCourseFile } from "@/lib/services/files.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الرفع");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err(400, "BAD_REQUEST", "صيغة الطلب غير صالحة");
  }

  const courseId = String(form.get("courseId") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const kind = String(form.get("kind") ?? "attachment") as "book" | "worksheet" | "exam_paper" | "attachment";
  const file = form.get("file");
  const isFreePreview = form.get("isFreePreview") === "true";

  if (!courseId || !title) {
    return err(400, "MISSING_FIELDS", "الكورس والعنوان مطلوبان");
  }
  if (!["book", "worksheet", "exam_paper", "attachment"].includes(kind)) {
    return err(400, "INVALID_KIND", "نوع الملف غير صالح");
  }
  if (!(file instanceof File) || file.size === 0) {
    return err(422, "FILE_REQUIRED", "أرفق ملفاً صالحاً");
  }

  try {
    const created = await uploadCourseFile(auth.user, { courseId, title, kind, file, isFreePreview });
    return ok({ file: created }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}