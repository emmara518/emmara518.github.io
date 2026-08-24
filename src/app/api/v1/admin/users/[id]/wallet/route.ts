import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { users, walletAccounts, walletTransactions, auditLogs, notifications } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const adjustWalletSchema = z.object({
  amountEgp: z.number().min(-50000).max(50000),
  reason: z.string().trim().max(200).default("تعديل رصيد من لوحة الإدارة"),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "users:manage")) return err(403, "FORBIDDEN", "تعديل أرصدة المحفظة للمدير فقط");

  const parsed = await parseJson(request, adjustWalletSchema);
  if ("response" in parsed) return parsed.response;
  const { id: userId } = await params;

  try {
    const userRows = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    if (!userRows[0]) return err(404, "USER_NOT_FOUND", "المستخدم غير موجود");

    const amountCents = Math.round(parsed.data.amountEgp * 100);

    // Ensure wallet exists
    await db.insert(walletAccounts).values({ userId, balanceCents: 0 }).onConflictDoNothing();

    // Update wallet balance
    const [updated] = await db
      .update(walletAccounts)
      .set({
        balanceCents: sql`GREATEST(0, ${walletAccounts.balanceCents} + ${amountCents})`,
      })
      .where(eq(walletAccounts.userId, userId))
      .returning({ balanceCents: walletAccounts.balanceCents });

    // Record wallet transaction
    await db.insert(walletTransactions).values({
      walletId: (await db.select({ id: walletAccounts.id }).from(walletAccounts).where(eq(walletAccounts.userId, userId)))[0].id,
      amountCents,
      kind: amountCents >= 0 ? "grant" : "purchase",
      note: parsed.data.reason,
    });

    // Notify student
    await db.insert(notifications).values({
      userId,
      title: amountCents >= 0 ? "شحن رصيد المحفظة" : "خصم من رصيد المحفظة",
      body: `تم ${amountCents >= 0 ? "إضافة" : "خصم"} مبلغ ${Math.abs(parsed.data.amountEgp)} ج.م ${parsed.data.reason ? `(${parsed.data.reason})` : ""} - رصيدك الحالي: ${(updated.balanceCents / 100).toFixed(0)} ج.م`,
      kind: "payment",
    });

    // Audit
    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "wallet.adjust",
      entity: "wallet_accounts",
      entityId: userId,
      meta: { amountEgp: parsed.data.amountEgp, newBalanceCents: updated.balanceCents, reason: parsed.data.reason },
    });

    return ok({ success: true, balanceCents: updated.balanceCents });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
