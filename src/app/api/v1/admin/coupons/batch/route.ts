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
  kind: z.enum(["course_percent", "wallet_balance", "course_access"]).default("course_percent"),
  /** Required when kind = wallet_balance — EGP value loaded onto the student wallet. */
  amountEgp: z.number().min(5).max(100000).optional(),
  /** Required when kind = course_access — the course this code unlocks. */
  courseId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية توليد الأكواد");

  const parsed = await parseJson(request, batchCouponSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const { prefix, count, percentOff, maxUses, daysValid, kind, amountEgp, courseId } = parsed.data;

    if (kind === "wallet_balance" && !amountEgp) {
      return err(422, "AMOUNT_REQUIRED", "كود المحفظة يحتاج قيمة مبلغ بالجنيه");
    }
    if (kind === "course_access" && !courseId) {
      return err(422, "COURSE_REQUIRED", "كود التفعيل يحتاج تحديد الكورس");
    }

    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const cleanPrefix = (prefix || "MATH").toUpperCase().replace(/[^A-Z0-9]/g, "");

    const newCouponsData: {
      code: string;
      percentOff: number;
      maxUses: number;
      expiresAt: Date;
      kind: "course_percent" | "wallet_balance" | "course_access";
      amountCents: number | null;
      courseId: string | null;
    }[] = [];
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
        percentOff: kind === "course_percent" ? percentOff : 0,
        maxUses,
        expiresAt,
        kind,
        amountCents: kind === "wallet_balance" ? Math.round((amountEgp ?? 0) * 100) : null,
        courseId: kind === "course_access" ? (courseId ?? null) : null,
      });
    }

    await db.insert(coupons).values(newCouponsData);

    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "coupons.batch",
      entity: "coupons",
      entityId: null,
      meta: { count, kind, prefix: cleanPrefix },
    });

    return ok({ codes: generatedCodes, kind, count });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
