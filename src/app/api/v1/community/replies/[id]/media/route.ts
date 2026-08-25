import path from "node:path";
import fsp from "node:fs/promises";
import { getSessionUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/rbac";
import { err } from "@/lib/http";
import { db } from "@/db";
import { communityReplies, communityPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasActiveSubscription } from "@/lib/services/billing.service";
import { toEnvelope } from "@/lib/errors";

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  pdf: "application/pdf",
};

/** Serves reply media to the post author, enrolled students, and staff. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getSessionUser();
  if (!auth) return err(401, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { id } = await params;

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

    if (!reply.mediaKey.startsWith("/uploads/replies/")) {
      return err(400, "BAD_KEY", "مسار ملف غير صالح");
    }
    const root = path.join(process.cwd(), "public");
    const abs = path.join(root, path.normalize(reply.mediaKey));
    if (!abs.startsWith(root)) return err(400, "BAD_KEY", "مسار ملف غير صالح");

    const buf = await fsp.readFile(abs);
    const ext = path.extname(abs).slice(1).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? (reply.mediaKind === "video" ? "video/mp4" : "application/octet-stream");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
