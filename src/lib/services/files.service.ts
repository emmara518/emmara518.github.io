import crypto from "node:crypto";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { db } from "@/db";
import { courseFiles } from "@/db/schema";
import { ServiceError } from "../errors";
import type { SessionUser } from "../auth";
import { eq } from "drizzle-orm";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-rar-compressed",
]);
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function uploadCourseFile(
  actor: SessionUser,
  input: {
    courseId: string;
    title: string;
    kind: "book" | "worksheet" | "exam_paper" | "attachment";
    file: File;
    isFreePreview?: boolean;
  }
) {
  if (!ALLOWED_MIME.has(input.file.type)) {
    throw new ServiceError(422, "INVALID_FILE_TYPE", "نوع الملف غير مسموح به. الأنواع المدعومة: PDF, صور, Word, Excel, ZIP");
  }
  if (input.file.size === 0) {
    throw new ServiceError(422, "EMPTY_FILE", "الملف فارغ");
  }
  if (input.file.size > MAX_FILE_BYTES) {
    throw new ServiceError(422, "FILE_TOO_LARGE", "حجم الملف يجب ألا يتجاوز 50 ميجابايت");
  }

  const ext = path.extname(input.file.name).toLowerCase() || guessExtFromMime(input.file.type);
  const safeTitle = input.title.replace(/[^\w\u0600-\u06FF\- ]+/g, "").slice(0, 80);
  const baseName = safeTitle.replace(/\s+/g, "-") || "file";
  const storageKey = `/uploads/course-files/${crypto.randomUUID()}-${baseName}${ext}`;
  const abs = path.join(process.cwd(), "public", storageKey);

  try {
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, Buffer.from(await input.file.arrayBuffer()));
  } catch (e) {
    throw new ServiceError(500, "UPLOAD_FAILED", "فشل حفظ الملف على القرص");
  }

  const [created] = await db
    .insert(courseFiles)
    .values({
      courseId: input.courseId,
      title: input.title,
      kind: input.kind,
      storageKey,
      sizeBytes: input.file.size,
      isFreePreview: input.isFreePreview ?? false,
    })
    .returning();

  await db
    .update(courseFiles)
    .set({}) // touch
    .where(eq(courseFiles.id, created.id));

  return created;
}

function guessExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
  };
  return map[mime] ?? "";
}