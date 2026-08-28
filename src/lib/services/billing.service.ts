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

    // coupon (percent-off course coupons only — balance codes are redeemed in the wallet)
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

/**
 * Redeems an admin-issued code (coupons table):
 *  - kind 'wallet_balance'  → credits the student's wallet (paid via InstaPay/digital wallets).
 *  - kind 'course_access'   → unlocks a full course subscription (center/physical payment).
 * Atomic: validation + redemption marker + side effects in one transaction.
 */
export async function redeemCode(userId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();

  return db.transaction(async (tx) => {
    const cRows = await tx.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    const coupon = cRows[0];
    if (!coupon || coupon.kind === "course_percent") {
      throw new ServiceError(404, "CODE_NOT_FOUND", "كود الشحن غير صالح");
    }
    if (!coupon.isActive) throw new ServiceError(422, "CODE_INACTIVE", "هذا الكود غير مفعل");
    if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
      throw new ServiceError(422, "CODE_EXPIRED", "انتهت صلاحية هذا الكود");
    }
    if (coupon.usedCount >= coupon.maxUses) {
      throw new ServiceError(422, "CODE_EXHAUSTED", "تم استنفاد عدد استخدامات هذا الكود");
    }

    const dup = await tx
      .select({ id: couponRedemptions.id })
      .from(couponRedemptions)
      .where(and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.userId, userId)))
      .limit(1);
    if (dup[0]) {
      throw new ServiceError(409, "CODE_ALREADY_USED", "لقد استخدمت هذا الكود من قبل");
    }

    /* ── wallet balance code ── */
    if (coupon.kind === "wallet_balance") {
      if (coupon.amountCents == null || coupon.amountCents <= 0) {
        throw new ServiceError(422, "CODE_INVALID_AMOUNT", "قيمة هذا الكود غير صالحة");
      }
      const existing = await tx.select().from(walletAccounts).where(eq(walletAccounts.userId, userId)).limit(1);
      let wallet = existing[0];
      if (!wallet) {
        [wallet] = await tx.insert(walletAccounts).values({ userId, balanceCents: 0 }).returning();
      }
      await tx.insert(couponRedemptions).values({ couponId: coupon.id, userId });
      await tx
        .update(coupons)
        .set({
          usedCount: sql`${coupons.usedCount} + 1`,
          isActive: coupon.usedCount + 1 >= coupon.maxUses ? false : undefined,
        })
        .where(eq(coupons.id, coupon.id));
      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        amountCents: coupon.amountCents,
        kind: "grant",
        note: `شحن بكود ${coupon.code}`,
      });
      const [updated] = await tx
        .update(walletAccounts)
        .set({ balanceCents: sql`${walletAccounts.balanceCents} + ${coupon.amountCents}` })
        .where(eq(walletAccounts.id, wallet.id))
        .returning({ balanceCents: walletAccounts.balanceCents });
      return { type: "wallet" as const, amountCents: coupon.amountCents, balanceCents: updated.balanceCents };
    }

    /* ── course access code (center-paid full course access) ── */
    if (!coupon.courseId) {
      throw new ServiceError(422, "CODE_INVALID", "هذا الكود غير مرتبط بكورس");
    }
    const courseRows = await tx
      .select({ id: courses.id, title: courses.title, slug: courses.slug, status: courses.status })
      .from(courses)
      .where(eq(courses.id, coupon.courseId))
      .limit(1);
    const course = courseRows[0];
    if (!course || course.status !== "published") {
      throw new ServiceError(422, "CODE_COURSE_UNAVAILABLE", "الكورس المرتبط بهذا الكود غير متاح حاليًا");
    }

    const subExisting = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.courseId, course.id)))
      .limit(1);
    if (subExisting[0]) {
      throw new ServiceError(409, "ALREADY_ENROLLED", "أنت مسجل بالفعل في هذا الكورس");
    }

    await tx.insert(couponRedemptions).values({ couponId: coupon.id, userId });
    await tx
      .update(coupons)
      .set({
        usedCount: sql`${coupons.usedCount} + 1`,
        isActive: coupon.usedCount + 1 >= coupon.maxUses ? false : undefined,
      })
      .where(eq(coupons.id, coupon.id));
    await tx.insert(subscriptions).values({
      userId,
      courseId: course.id,
      status: "active",
      startsAt: new Date(),
      endsAt: null, // full-duration access — no expiry
    });
    await tx.insert(notifications).values({
      userId,
      title: "تم تفعيل اشتراكك",
      body: `تم تفعيل اشتراكك في كورس «${course.title}» عبر الكود ${coupon.code}. بالتوفيق!`,
      kind: "system",
    });
    return { type: "course" as const, courseTitle: course.title, courseSlug: course.slug };
  });
}
