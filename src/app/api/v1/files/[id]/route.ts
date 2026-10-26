import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courseFiles } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { err } from "@/lib/http";
import { hasActiveSubscription } from "@/lib/services/billing.service";
import { contentTypeForKey, createSignedDownloadUrl, isLegacyUploadKey, readLegacyUpload } from "@/lib/storage";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

/**
 * Gated file delivery — private storage keys are served through short-lived
 * signed URLs. Legacy /uploads keys remain readable during migration.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");

  const rows = await db.select().from(courseFiles).where(eq(courseFiles.id, id)).limit(1);
  const file = rows[0];
  if (!file) return err(404, "FILE_NOT_FOUND", "الملف غير موجود");

  if (!file.isFreePreview && !isAdminRole(auth.user.role)) {
    const enrolled = await hasActiveSubscription(auth.user.id, file.courseId);
    if (!enrolled) return err(403, "NOT_ENROLLED", "هذا الملف متاح لمشتركي الكورس");
  }

  const extension = file.storageKey.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
  const filename = encodeURIComponent(`${file.title}${extension}`);
  const disposition = `attachment; filename*=UTF-8''${filename}`;

  try {
    if (isLegacyUploadKey(file.storageKey)) {
      const buf = await readLegacyUpload(file.storageKey);
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": contentTypeForKey(file.storageKey),
          "Content-Disposition": disposition,
          "Cache-Control": "private, no-store",
        },
      });
    }

    const signedUrl = await createSignedDownloadUrl(file.storageKey, {
      responseContentDisposition: disposition,
      responseContentType: contentTypeForKey(file.storageKey),
    });
    return new Response(null, {
      status: 302,
      headers: { Location: signedUrl, "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
