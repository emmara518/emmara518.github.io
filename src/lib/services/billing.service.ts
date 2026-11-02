import crypto from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  coupons,
  couponRedemptions,
  walletAccounts,
  walletTransactions,
  orders,
  payments,
  invoices,
  subscriptions,
  notifications,
  auditLogs,
  exams,
  examAttempts,
} from "@/db/schema";
import { ServiceError } from "../errors";

/**
 * Billing â€” the settlement engine.
 * Wallet ledger is append-only; every purchase is ONE database transaction:
 * coupon validation â†’ wallet debit â†’ order â†’ payment â†’ invoice â†’ subscription.
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

async function reserveCoupon(tx: any, couponId: string): Promise<void> {
  const [reserved] = await tx
    .update(coupons)
    .set({
      usedCount: sql`${coupons.usedCount} + 1`,
      isActive: sql`${coupons.usedCount} + 1 < ${coupons.maxUses}`,
    })
    .where(
      and(
        eq(coupons.id, couponId),
        eq(coupons.isActive, true),
        sql`${coupons.usedCount} < ${coupons.maxUses}`,
      ),
    )
    .returning({ id: coupons.id });
  if (!reserved) throw new ServiceError(422, "CODE_EXHAUSTED", "Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„ÙƒÙˆØ¯ Ø£Ùˆ ØªÙ… Ø§Ø³ØªÙ‡Ù„Ø§ÙƒÙ‡");
}

export async function hasActiveSubscription(
  userId: string,
  courseId: string,
  executor: any = db,
): Promise<boolean> {
  const rows = await executor
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
      throw new ServiceError(404, "COURSE_NOT_FOUND", "Ø§Ù„ÙƒÙˆØ±Ø³ ØºÙŠØ± Ù…ØªØ§Ø­ Ø­Ø§Ù„ÙŠÙ‹Ø§");
    }

    const existing = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.courseId, courseId), eq(subscriptions.status, "active")))
      .limit(1);
    if (existing[0]) {
      throw new ServiceError(409, "ALREADY_ENROLLED", "Ø£Ù†Øª Ù…Ø´ØªØ±Ùƒ ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ±Ø³ Ø¨Ø§Ù„ÙØ¹Ù„");
    }

    // coupon (percent-off course coupons only â€” balance codes are redeemed in the wallet)
    let discountCents = 0;
    let couponId: string | null = null;
    if (code) {
      const cRows = await tx.select().from(coupons).where(eq(coupons.code, code)).limit(1);
      const coupon = cRows[0];
      const valid =
        coupon &&
        coupon.kind === "course_percent" &&
        coupon.isActive &&
        coupon.usedCount < coupon.maxUses &&
        (!coupon.expiresAt || coupon.expiresAt > new Date());
      if (!valid) throw new ServiceError(422, "INVALID_COUPON", "ÙƒÙˆØ¨ÙˆÙ† Ø§Ù„Ø®ØµÙ… ØºÙŠØ± ØµØ§Ù„Ø­ Ø£Ùˆ Ù…Ù†ØªÙ‡ÙŠ");
      discountCents = Math.round((course.priceCents * coupon.percentOff) / 100);
      couponId = coupon.id;
    }

    const totalCents = Math.max(course.priceCents - discountCents, 0);

    if (couponId) {
      await reserveCoupon(tx, couponId);
    }

    const [debited] = await tx
      .update(walletAccounts)
      .set({ balanceCents: sql`${walletAccounts.balanceCents} - ${totalCents}` })
      .where(
        and(
          eq(walletAccounts.userId, userId),
          sql`${walletAccounts.balanceCents} >= ${totalCents}`,
        ),
      )
      .returning({ id: walletAccounts.id, balanceCents: walletAccounts.balanceCents });
    if (!debited) {
      throw new ServiceError(402, "INSUFFICIENT_FUNDS", "???? ??????? ??? ???? ?????? ????? ??????");
    }

    await tx.insert(walletTransactions).values({
      walletId: debited.id,
      amountCents: -totalCents,
      kind: "purchase",
      note: `???? ????: ${course.title}`,
    });

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
    const invoiceNumber = `INV-${year}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    await tx.insert(invoices).values({ orderId: order.id, number: invoiceNumber, totalCents });

    await tx.insert(subscriptions).values({
      userId,
      courseId,
      status: "active",
      orderId: order.id,
    });

    await tx.insert(notifications).values({
      userId,
      title: "ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ø´ØªØ±Ø§ÙƒÙƒ",
      body: `Ø£Ù‡Ù„Ù‹Ø§ Ø¨Ùƒ ÙÙŠ ÙƒÙˆØ±Ø³ Â«${course.title}Â». Ø¨Ø§Ù„ØªÙˆÙÙŠÙ‚ ÙÙŠ Ø±Ø­Ù„ØªÙƒ!`,
      kind: "billing",
    });

    await tx.insert(auditLogs).values({
      actorId: userId,
      action: "course.purchase",
      entity: "orders",
      entityId: order.id,
      meta: { courseId, totalCents, invoiceNumber },
    });

    const balance = debited.balanceCents;
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
    const [updated] = await tx
      .update(walletAccounts)
      .set({ balanceCents: sql`${walletAccounts.balanceCents} + ${amountCents}` })
      .where(eq(walletAccounts.id, wallet.id))
      .returning({ balanceCents: walletAccounts.balanceCents });
    await tx.insert(walletTransactions).values({
      walletId: wallet.id,
      amountCents,
      kind: "topup",
      note: "O'O-U+ Oï¿½Oï¿½USO_ OU,U.O-U?O,Oc",
    });
    return { balanceCents: updated.balanceCents };
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

/**
 * Redeems an admin-issued code (coupons table):
 *  - kind 'wallet_balance'  â†’ credits the student's wallet (paid via InstaPay/digital wallets).
 *  - kind 'course_access'   â†’ unlocks a full course subscription (center/physical payment).
 * Atomic: validation + redemption marker + side effects in one transaction.
 */
export async function redeemCode(userId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();

  return db.transaction(async (tx) => {
    const cRows = await tx.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    const coupon = cRows[0];
    if (!coupon || coupon.kind === "course_percent") {
      throw new ServiceError(404, "CODE_NOT_FOUND", "ÙƒÙˆØ¯ Ø§Ù„Ø´Ø­Ù† ØºÙŠØ± ØµØ§Ù„Ø­");
    }
    if (!coupon.isActive) throw new ServiceError(422, "CODE_INACTIVE", "Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¯ ØºÙŠØ± Ù…ÙØ¹Ù„");
    if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
      throw new ServiceError(422, "CODE_EXPIRED", "Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØ© Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¯");
    }
    if (coupon.usedCount >= coupon.maxUses) {
      throw new ServiceError(422, "CODE_EXHAUSTED", "ØªÙ… Ø§Ø³ØªÙ†ÙØ§Ø¯ Ø¹Ø¯Ø¯ Ø§Ø³ØªØ®Ø¯Ø§Ù…Ø§Øª Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¯");
    }

    const dup = await tx
      .select({ id: couponRedemptions.id })
      .from(couponRedemptions)
      .where(and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.userId, userId)))
      .limit(1);
    if (dup[0]) {
      throw new ServiceError(409, "CODE_ALREADY_USED", "Ù„Ù‚Ø¯ Ø§Ø³ØªØ®Ø¯Ù…Øª Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¯ Ù…Ù† Ù‚Ø¨Ù„");
    }

    /* â”€â”€ wallet balance code â”€â”€ */
    if (coupon.kind === "wallet_balance") {
      if (coupon.amountCents == null || coupon.amountCents <= 0) {
        throw new ServiceError(422, "CODE_INVALID_AMOUNT", "Ù‚ÙŠÙ…Ø© Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¯ ØºÙŠØ± ØµØ§Ù„Ø­Ø©");
      }
      const existing = await tx.select().from(walletAccounts).where(eq(walletAccounts.userId, userId)).limit(1);
      let wallet = existing[0];
      if (!wallet) {
        [wallet] = await tx.insert(walletAccounts).values({ userId, balanceCents: 0 }).returning();
      }
      await tx.insert(couponRedemptions).values({ couponId: coupon.id, userId });
      await reserveCoupon(tx, coupon.id);
      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        amountCents: coupon.amountCents,
        kind: "grant",
        note: `Ø´Ø­Ù† Ø¨ÙƒÙˆØ¯ ${coupon.code}`,
      });
      const [updated] = await tx
        .update(walletAccounts)
        .set({ balanceCents: sql`${walletAccounts.balanceCents} + ${coupon.amountCents}` })
        .where(eq(walletAccounts.id, wallet.id))
        .returning({ balanceCents: walletAccounts.balanceCents });
      return { type: "wallet" as const, amountCents: coupon.amountCents, balanceCents: updated.balanceCents };
    }

    /* â”€â”€ course access code (center-paid full course access) â”€â”€ */
    if (!coupon.courseId) {
      throw new ServiceError(422, "CODE_INVALID", "Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¯ ØºÙŠØ± Ù…Ø±ØªØ¨Ø· Ø¨ÙƒÙˆØ±Ø³");
    }
    const courseRows = await tx
      .select({ id: courses.id, title: courses.title, slug: courses.slug, status: courses.status })
      .from(courses)
      .where(eq(courses.id, coupon.courseId))
      .limit(1);
    const course = courseRows[0];
    if (!course || course.status !== "published") {
      throw new ServiceError(422, "CODE_COURSE_UNAVAILABLE", "Ø§Ù„ÙƒÙˆØ±Ø³ Ø§Ù„Ù…Ø±ØªØ¨Ø· Ø¨Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¯ ØºÙŠØ± Ù…ØªØ§Ø­ Ø­Ø§Ù„ÙŠÙ‹Ø§");
    }

    const subExisting = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.courseId, course.id)))
      .limit(1);
    if (subExisting[0]) {
      throw new ServiceError(409, "ALREADY_ENROLLED", "Ø£Ù†Øª Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ±Ø³");
    }

    await tx.insert(couponRedemptions).values({ couponId: coupon.id, userId });
    await reserveCoupon(tx, coupon.id);
    await tx.insert(subscriptions).values({
      userId,
      courseId: course.id,
      status: "active",
      startsAt: new Date(),
      endsAt: null, // full-duration access â€” no expiry
    });
    await tx.insert(notifications).values({
      userId,
      title: "ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ø´ØªØ±Ø§ÙƒÙƒ",
      body: `ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ø´ØªØ±Ø§ÙƒÙƒ ÙÙŠ ÙƒÙˆØ±Ø³ Â«${course.title}Â» Ø¹Ø¨Ø± Ø§Ù„ÙƒÙˆØ¯ ${coupon.code}. Ø¨Ø§Ù„ØªÙˆÙÙŠÙ‚!`,
      kind: "system",
    });
    return { type: "course" as const, courseTitle: course.title, courseSlug: course.slug };
  });
}
