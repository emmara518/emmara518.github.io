import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { coupons, auditLogs } from "@/db/schema";
import { toEnvelope } from "@/lib/errors";

const batchCouponSchema = z.object({
  prefix: z.string().trim().max(10).default("MATH"),
  count: z.number().int().min(1).max(200).default(10),
  percentOff: z.number().int().min(1).max(100).default(100),
  maxUses: z.number().int().min(1).max(1000).default(1),
  daysValid: z.number().int().min(1).max(365).default(30),
});

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية إنشاء الأكواد");

  const parsed = await parseJson(request, batchCouponSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const { prefix, count, percentOff, maxUses, daysValid } = parsed.data;
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const cleanPrefix = (prefix || "MATH").toUpperCase().replace(/[^A-Z0-9]/g, "");

    const newCouponsData: { code: string; percentOff: number; maxUses: number; expiresAt: Date }[] = [];
    const generatedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      let rand = "";
      for (let j = 0; j < 6; j++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const code = `${cleanPrefix}-${rand}-${Math.floor(10 + Math.random() * 89)}`;
      generatedCodes.push(code);
      newCouponsData.push({
        code,
        percentOff,
        maxUses,
        expiresAt,
      });
    }

    // Insert batch into DB (ignore duplicates if any)
    const inserted = await db
      .insert(coupons)
      .values(newCouponsData)
      .onConflictDoNothing()
      .returning({ id: coupons.id, code: coupons.code });

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "coupons.batch_create",
      entity: "coupons",
      entityId: inserted[0]?.id || null,
      meta: {
        count: inserted.length,
        prefix: cleanPrefix,
        percentOff,
        maxUses,
      },
    });

    return ok(
      {
        message: `تم توليد وحفظ ${inserted.length} كود تفعيل بنجاح في قاعدة البيانات.`,
        coupons: inserted,
        codes: generatedCodes,
      },
      { status: 201 },
    );
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
