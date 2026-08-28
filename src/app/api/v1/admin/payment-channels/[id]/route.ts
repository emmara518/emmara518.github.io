import { requireApiUser } from "@/lib/auth";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { paymentChannels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";
import { upsertPaymentChannel, deletePaymentChannel } from "@/lib/services/admin.service";

const patchSchema = z.object({
  type: z.enum(["instapay", "vodafone_cash", "etisalat_cash", "orange_cash", "bank_transfer", "other"]).optional(),
  label: z.string().trim().min(2).max(80).optional(),
  account: z.string().trim().min(3).max(80).optional(),
  owner: z.string().trim().min(2).max(80).optional(),
  hint: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rows = await db
      .select()
      .from(paymentChannels)
      .where(eq(paymentChannels.id, id))
      .limit(1);
    if (!rows[0]) return err(404, "NOT_FOUND", "القناة غير موجودة");
    return ok({ channel: rows[0] });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["admin"]);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");

  const { id } = await params;
  const parsed = await parseJson(request, patchSchema);
  if ("response" in parsed) return parsed.response;

  if (Object.keys(parsed.data).length === 0) {
    return err(400, "BAD_REQUEST", "لا توجد حقول للتحديث");
  }

  try {
    const result = await upsertPaymentChannel(auth.user, { id, ...parsed.data });
    return ok({ channel: result });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["admin"]);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (auth.user.role !== "admin") return err(403, "FORBIDDEN", "لا تملك صلاحية الحذف");

  const { id } = await params;
  try {
    const result = await deletePaymentChannel(auth.user, id);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}