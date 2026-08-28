import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { paymentChannels } from "@/db/schema";
import { toEnvelope } from "@/lib/errors";
import { listPaymentChannels, upsertPaymentChannel } from "@/lib/services/admin.service";

const channelTypeEnum = z.enum(["instapay", "vodafone_cash", "etisalat_cash", "orange_cash", "bank_transfer", "other"]);

const upsertSchema = z.object({
  id: z.string().min(1),
  type: channelTypeEnum,
  label: z.string().trim().min(2).max(80),
  account: z.string().trim().min(3).max(80),
  owner: z.string().trim().min(2).max(80),
  hint: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:read")) return err(403, "FORBIDDEN", "لا تملك صلاحية القراءة");

  try {
    const channels = await listPaymentChannels();
    return ok({ channels });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية إنشاء قنوات الدفع");

  const parsed = await parseJson(request, upsertSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const result = await upsertPaymentChannel(auth.user, parsed.data);
    return ok({ channel: result });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}