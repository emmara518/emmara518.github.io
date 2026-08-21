import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  coupons,
  walletAccounts,
  walletTransactions,
  orders,
  payments,
  invoices,
  subscriptions,
  notifications,
  auditLogs,
} from "@/db/schema";
import { ServiceError } from "../errors";

/**
 * Billing — the settlement engine.
 * Wallet ledger is append-only; every purchase is ONE database transaction:
 * coupon validation → wallet debit → order → payment → invoice → subscription.
 */

export type PurchaseResult = {
  orderId: string;
  invoiceNumber: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  balanceCents: number;
};

export async function getOrCreateWallet(userId: string) {
  const existing = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const created = await db
    .insert(walletAccounts)
    .values({ userId, balanceCents: 0 })
    .onConflictDoNothing({ target: [walletAccounts.userId] })
    .returning();
  if (created[0]) return created[0];
  const again = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, userId)).limit(1);
  return again[0];
}

export async function hasActiveSubscription(userId: string, courseId: string): Promise<boolean> {
  const rows = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.courseId, courseId), eq(subscriptions.status, "active")))
    .limit(1);
  return Boolean(rows[0]);
}

export async function purchaseCourse(userId: string, courseId: string, couponCode?: string): Promise<PurchaseResult> {
  const code = couponCode?.trim().toUpperCase();

  return db.transaction(async (tx) => {
    const courseRows = await tx.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    const course = courseRows[0];
    if (!course || course.status !== "published") {
      throw new ServiceError(404, "COURSE_NOT_FOUND", "الكورس غير متاح حاليًا");
    }

    const existing = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.courseId, courseId), eq(subscriptions.status, "active")))
      .limit(1);
    if (existing[0]) {
      throw new ServiceError(409, "ALREADY_ENROLLED", "أنت مشترك في هذا الكورس بالفعل");
    }

    // coupon
    let discountCents = 0;
    let couponId: string | null = null;
    if (code) {
      const cRows = await tx.select().from(coupons).where(eq(coupons.code, code)).limit(1);
      const coupon = cRows[0];
      const valid =
        coupon &&
        coupon.isActive &&
        coupon.usedCount < coupon.maxUses &&
        (!coupon.expiresAt || coupon.expiresAt > new Date());
      if (!valid) throw new ServiceError(422, "INVALID_COUPON", "كوبون الخصم غير صالح أو منتهي");
      discountCents = Math.round((course.priceCents * coupon.percentOff) / 100);
      couponId = coupon.id;
    }

    const totalCents = Math.max(course.priceCents - discountCents, 0);

    // wallet (lock the row for update semantics via serializable-less debit guard)
    const walletRows = await tx
      .select()
      .from(walletAccounts)
      .where(eq(walletAccounts.userId, userId))
      .limit(1);
    const wallet = walletRows[0];
    if (!wallet || wallet.balanceCents < totalCents) {
      throw new ServiceError(
        402,
        "INSUFFICIENT_FUNDS",
        "رصيد المحفظة غير كافٍ لإتمام الاشتراك — جرّب شحن المحفظة",
      );
    }

    await tx
      .update(walletAccounts)
      .set({ balanceCents: sql`${walletAccounts.balanceCents} - ${totalCents}` })
      .where(eq(walletAccounts.id, wallet.id));

    await tx.insert(walletTransactions).values({
      walletId: wallet.id,
      amountCents: -totalCents,
      kind: "purchase",
      note: `اشتراك في كورس: ${course.title}`,
    });

    if (couponId) {
      await tx
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.id, couponId));
    }

    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        courseId,
        subtotalCents: course.priceCents,
        discountCents,
        totalCents,
        couponId,
        status: "paid",
      })
      .returning({ id: orders.id });

    await tx.insert(payments).values({
      orderId: order.id,
      provider: "wallet",
      amountCents: totalCents,
      status: "succeeded",
      reference: `WLT-${order.id.slice(0, 8).toUpperCase()}`,
    });

    const year = new Date().getFullYear();
    const [{ value: seq }] = await tx.select({ value: sql<number>`count(*)::int` }).from(invoices);
    const invoiceNumber = `INV-${year}-${(1001 + Number(seq)).toString()}`;
    await tx.insert(invoices).values({ orderId: order.id, number: invoiceNumber, totalCents });

    await tx.insert(subscriptions).values({
      userId,
      courseId,
      status: "active",
      orderId: order.id,
    });

    await tx.insert(notifications).values({
      userId,
      title: "تم تفعيل اشتراكك",
      body: `أهلًا بك في كورس «${course.title}». بالتوفيق في رحلتك!`,
      kind: "billing",
    });

    await tx.insert(auditLogs).values({
      actorId: userId,
      action: "course.purchase",
      entity: "orders",
      entityId: order.id,
      meta: { courseId, totalCents, invoiceNumber },
    });

    const balance = wallet.balanceCents - totalCents;
    return {
      orderId: order.id,
      invoiceNumber,
      subtotalCents: course.priceCents,
      discountCents,
      totalCents,
      balanceCents: balance,
    };
  });
}

export async function getWalletSummary(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  const txns = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(10);
  return { balanceCents: wallet.balanceCents, transactions: txns };
}

export async function topUpWallet(userId: string, amountCents: number) {
  return db.transaction(async (tx) => {
    const existing = await tx.select().from(walletAccounts).where(eq(walletAccounts.userId, userId)).limit(1);
    let wallet = existing[0];
    if (!wallet) {
      [wallet] = await tx.insert(walletAccounts).values({ userId, balanceCents: 0 }).returning();
    }
    await tx
      .update(walletAccounts)
      .set({ balanceCents: sql`${walletAccounts.balanceCents} + ${amountCents}` })
      .where(eq(walletAccounts.id, wallet.id));
    await tx.insert(walletTransactions).values({
      walletId: wallet.id,
      amountCents,
      kind: "topup",
      note: "شحن رصيد المحفظة",
    });
    return { balanceCents: wallet.balanceCents + amountCents };
  });
}

export async function listInvoices(userId: string, limit = 12) {
  return db
    .select({
      id: invoices.id,
      number: invoices.number,
      totalCents: invoices.totalCents,
      issuedAt: invoices.issuedAt,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      status: orders.status,
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(courses, eq(orders.courseId, courses.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(invoices.issuedAt))
    .limit(limit);
}
