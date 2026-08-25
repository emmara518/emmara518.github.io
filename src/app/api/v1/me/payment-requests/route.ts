import crypto from "node:crypto";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { PAYMENT_METHOD_IDS } from "@/lib/platform-payments";
import { createPaymentRequest, listMyPaymentRequests } from "@/lib/services/payment-requests.service";
import { toEnvelope } from "@/lib/errors";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const MIN_AMOUNT = 50;
const MAX_AMOUNT = 50000;

export async function GET() {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "سجل الدخول مطلوب");
  const requests = await listMyPaymentRequests(auth.user.id);
  return ok({ requests });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "سجل الدخول مطلوب");
  if (!can(auth.user.role, "wallet:use")) return err(403, "FORBIDDEN", "غير مسموح لك بطلبات الشحن");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err(400, "BAD_REQUEST", "صيغة الطلب غير صالحة");
  }

  const amountEgp = Number(form.get("amountEgp"));
  const method = String(form.get("method") ?? "");
  const senderName = String(form.get("senderName") ?? "").trim().slice(0, 120);
  const screenshot = form.get("screenshot");

  if (!Number.isFinite(amountEgp) || amountEgp < MIN_AMOUNT || amountEgp > MAX_AMOUNT) {
    return err(422, "INVALID_AMOUNT", `المبلغ يجب أن يكون بين ${MIN_AMOUNT} و ${MAX_AMOUNT} ج.م`);
  }
  if (!PAYMENT_METHOD_IDS.includes(method)) {
    return err(422, "INVALID_METHOD", "طريقة الدفع غير معروفة");
  }
  if (!(screenshot instanceof File) || screenshot.size === 0) {
    return err(422, "SCREENSHOT_REQUIRED", "أرفق صورة إيصال التحويل");
  }
  if (!ALLOWED_MIME.has(screenshot.type)) {
    return err(422, "INVALID_FILE_TYPE", "الصورة يجب أن تكون PNG أو JPG أو WEBP");
  }
  if (screenshot.size > MAX_SCREENSHOT_BYTES) {
    return err(422, "FILE_TOO_LARGE", "حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
  }

  const ext = screenshot.type === "image/png" ? "png" : screenshot.type === "image/webp" ? "webp" : "jpg";
  const key = `/uploads/proofs/${crypto.randomUUID()}.${ext}`;
  const abs = path.join(process.cwd(), "public", key);
  try {
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, Buffer.from(await screenshot.arrayBuffer()));
  } catch {
    return err(500, "UPLOAD_FAILED", "تعذر حفظ الصورة، حاول مرة أخرى");
  }

  try {
    const row = await createPaymentRequest(auth.user.id, { amountEgp, method, senderName, screenshotKey: key });
    return ok(row, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
