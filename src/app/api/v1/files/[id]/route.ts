import path from "node:path";
import { promises as fsp } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courseFiles } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { err } from "@/lib/http";
import { hasActiveSubscription } from "@/lib/services/billing.service";

/**
 * Gated file delivery — the storage contract in action.
 * Files resolve from storage_key under public/. Access = free preview
 * or active subscription or staff. Swap the fs reader for an S3 adapter later;
 * nothing about the contract changes.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { id } = await params;

  const rows = await db.select().from(courseFiles).where(eq(courseFiles.id, id)).limit(1);
  const file = rows[0];
  if (!file) return err(404, "FILE_NOT_FOUND", "الملف غير موجود");

  if (!file.isFreePreview && !isAdminRole(auth.user.role)) {
    const enrolled = await hasActiveSubscription(auth.user.id, file.courseId);
    if (!enrolled) return err(403, "NOT_ENROLLED", "هذا الملف متاح لمشتركي الكورس");
  }

  // path traversal guard: keys must live under /uploads/
  if (!file.storageKey.startsWith("/uploads/")) {
    return err(400, "BAD_STORAGE_KEY", "مفتاح تخزين غير صالح");
  }
  const root = path.join(process.cwd(), "public");
  const abs = path.normalize(path.join(root, file.storageKey));
  if (!abs.startsWith(root)) return err(400, "BAD_STORAGE_KEY", "مفتاح تخزين غير صالح");

  let buf: Buffer;
  try {
    buf = await fsp.readFile(abs);
  } catch {
    return err(404, "FILE_NOT_UPLOADED", "عقد الملف جاهز — تُرفع النسخة الفعلية ضمن استيراد المحتوى");
  }

  const filename = encodeURIComponent(`${file.title}.pdf`);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, no-store",
    },
  });
}
