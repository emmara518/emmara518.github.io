import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { err } from "@/lib/http";
import { db } from "@/db";
import { communityReplies, communityPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasActiveSubscription } from "@/lib/services/billing.service";
import { contentTypeForKey, createSignedDownloadUrl, isLegacyUploadKey, readLegacyUpload } from "@/lib/storage";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

/** Serves reply media to the post author, enrolled students, and staff. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getSessionUser();
  if (!auth) return err(401, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");

  try {
    const rows = await db
      .select({
        mediaKey: communityReplies.mediaKey,
        mediaKind: communityReplies.mediaKind,
        courseId: communityPosts.courseId,
        postUserId: communityPosts.userId,
      })
      .from(communityReplies)
      .innerJoin(communityPosts, eq(communityReplies.postId, communityPosts.id))
      .where(eq(communityReplies.id, id))
      .limit(1);
    const reply = rows[0];
    if (!reply || !reply.mediaKey) return err(404, "NOT_FOUND", "المرفق غير موجود");

    const allowed =
      isAdminRole(auth.role) ||
      auth.id === reply.postUserId ||
      (reply.courseId ? await hasActiveSubscription(auth.id, reply.courseId) : false);
    if (!allowed) return err(403, "FORBIDDEN", "غير مشترك في هذا الكورس");

    const fallbackMime = reply.mediaKind === "video" ? "video/mp4" : "application/octet-stream";
    const mime = contentTypeForKey(reply.mediaKey, fallbackMime);

    if (isLegacyUploadKey(reply.mediaKey)) {
      const buf = await readLegacyUpload(reply.mediaKey);
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const signedUrl = await createSignedDownloadUrl(reply.mediaKey, { responseContentType: mime });
    return new Response(null, {
      status: 302,
      headers: { Location: signedUrl, "Cache-Control": "private, max-age=300" },
    });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
