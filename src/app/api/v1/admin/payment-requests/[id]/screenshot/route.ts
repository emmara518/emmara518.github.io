import path from "node:path";
import { promises as fsp } from "node:fs";
import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/rbac";
import { err } from "@/lib/http";
import { getPaymentRequestScreenshot } from "@/lib/services/payment-requests.service";

/** Serves a payment-proof screenshot to authenticated staff only. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "صلاحيات الإدارة مطلوبة");
  const { id } = await params;

  const row = await getPaymentRequestScreenshot(id);
  if (!row) return err(404, "REQUEST_NOT_FOUND", "الطلب غير موجود");

  const key = row.screenshotKey;
  if (!key.startsWith("/uploads/proofs/")) return err(400, "BAD_STORAGE_KEY", "مفتاح تخزين غير صالح");
  const root = path.join(process.cwd(), "public");
  const abs = path.normalize(path.join(root, key));
  if (!abs.startsWith(root)) return err(400, "BAD_STORAGE_KEY", "مفتاح تخزين غير صالح");

  try {
    const buf = await fsp.readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": mime, "Cache-Control": "private, no-store" },
    });
  } catch {
    return err(404, "SCREENSHOT_MISSING", "الصورة غير موجودة على الخادم");
  }
}
