import path from "node:path";
import fsp from "node:fs/promises";
import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { createPostReplyAdmin, listPostRepliesAdmin } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const FILE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { id } = await params;
  try {
    const replies = await listPostRepliesAdmin(id);
    return ok({ replies });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

/** Assistant answer under a student post — multipart with optional media. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الرد");
  const { id } = await params;

  try {
    const form = await request.formData();
    const body = String(form.get("body") ?? "").trim();
    const mediaKindRaw = String(form.get("mediaKind") ?? "none");
    const media = form.get("media");

    if (!body && mediaKindRaw === "none") {
      return err(422, "EMPTY_REPLY", "اكتب نص الحل أو أرفق ملفاً");
    }

    let mediaKind = "none";
    let mediaKey: string | null = null;

    const wantsMedia = mediaKindRaw === "image" || mediaKindRaw === "video" || mediaKindRaw === "file";
    if (wantsMedia) {
      if (!(media instanceof File) || media.size === 0) {
        return err(422, "MEDIA_REQUIRED", "اختر الملف المطلوب إرفاقه");
      }
      const isImage = IMAGE_MIME.has(media.type);
      const isVideo = VIDEO_MIME.has(media.type);
      const kind = mediaKindRaw === "file" ? "file" : mediaKindRaw;
      if ((kind === "image" && !isImage) || (kind === "video" && !isVideo)) {
        return err(422, "MEDIA_KIND_MISMATCH", "نوع الملف لا يطابق المرفق المطلوب");
      }
      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (media.size > limit) {
        return err(422, "MEDIA_TOO_LARGE", `الحد الأقصى للحجم ${Math.round(limit / (1024 * 1024))} ميجابايت`);
      }
      const ext = FILE_EXT[media.type] ?? "bin";
      mediaKey = `/uploads/replies/${crypto.randomUUID()}.${ext}`;
      const abs = path.join(process.cwd(), "public", mediaKey);
      await fsp.mkdir(path.dirname(abs), { recursive: true });
      await fsp.writeFile(abs, Buffer.from(await media.arrayBuffer()));
      mediaKind = kind;
    }

    const created = await createPostReplyAdmin(auth.user, id, { body, mediaKind, mediaKey });
    return ok(created);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
