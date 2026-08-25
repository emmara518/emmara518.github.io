import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons, notifications, paymentRequests, users } from "@/db/schema";
import { ServiceError } from "../errors";
import type { SessionUser } from "../auth";

/**
 * Payment requests — student submits a transfer screenshot, admin reviews and
 * issues a code (wallet_balance or course_access) delivered via notifications.
 */

export type IssueKind = "wallet_balance" | "course_access";

function generateCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const bytes = crypto.randomBytes(8);
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `DROS-${body.slice(0, 4)}-${body.slice(4)}`;
}

export async function listMyPaymentRequests(userId: string) {
  return db
    .select({
      id: paymentRequests.id,
      amountEgp: paymentRequests.amountEgp,
      method: paymentRequests.method,
      status: paymentRequests.status,
      adminNote: paymentRequests.adminNote,
      issuedCode: paymentRequests.issuedCode,
      createdAt: paymentRequests.createdAt,
      reviewedAt: paymentRequests.reviewedAt,
    })
    .from(paymentRequests)
    .where(eq(paymentRequests.userId, userId))
    .orderBy(desc(paymentRequests.createdAt))
    .limit(10);
}

export async function createPaymentRequest(
  userId: string,
  input: { amountEgp: number; method: string; senderName: string; screenshotKey: string },
) {
  const [row] = await db
    .insert(paymentRequests)
    .values({
      userId,
      amountEgp: input.amountEgp,
      method: input.method,
      senderName: input.senderName,
      screenshotKey: input.screenshotKey,
    })
    .returning({ id: paymentRequests.id });
  return row;
}

export async function listPaymentRequestsAdmin(status?: string) {
  return db
    .select({
      id: paymentRequests.id,
      amountEgp: paymentRequests.amountEgp,
      method: paymentRequests.method,
      senderName: paymentRequests.senderName,
      screenshotKey: paymentRequests.screenshotKey,
      status: paymentRequests.status,
      adminNote: paymentRequests.adminNote,
      issuedCode: paymentRequests.issuedCode,
      createdAt: paymentRequests.createdAt,
      studentName: users.name,
      studentPhone: users.phone,
      studentEmail: users.email,
    })
    .from(paymentRequests)
    .innerJoin(users, eq(paymentRequests.userId, users.id))
    .where(status && status !== "all" ? eq(paymentRequests.status, status) : undefined)
    .orderBy(desc(paymentRequests.createdAt))
    .limit(50);
}

export async function getPaymentRequestScreenshot(id: string) {
  const rows = await db
    .select({ screenshotKey: paymentRequests.screenshotKey })
    .from(paymentRequests)
    .where(eq(paymentRequests.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Approves the request by issuing a code and notifying the student in-app. */
export async function issueCodeForRequest(
  admin: SessionUser,
  requestId: string,
  input: { kind: IssueKind; amountEgp?: number; courseId?: string },
) {
  const rows = await db.select().from(paymentRequests).where(eq(paymentRequests.id, requestId)).limit(1);
  const request = rows[0];
  if (!request) throw new ServiceError(404, "REQUEST_NOT_FOUND", "الطلب غير موجود");
  if (request.status !== "pending") {
    throw new ServiceError(409, "ALREADY_REVIEWED", "تم مراجعة هذا الطلب من قبل");
  }
  if (input.kind === "wallet_balance" && (!input.amountEgp || input.amountEgp <= 0)) {
    throw new ServiceError(422, "AMOUNT_REQUIRED", "حدد مبلغ الرصيد المطلوب شحنه");
  }
  if (input.kind === "course_access" && !input.courseId) {
    throw new ServiceError(422, "COURSE_REQUIRED", "حدد الكورس المطلوب تفعيله");
  }

  const code = generateCode();

  return db.transaction(async (tx) => {
    await tx.insert(coupons).values({
      code,
      kind: input.kind,
      percentOff: 0,
      amountCents: input.kind === "wallet_balance" ? Math.round((input.amountEgp ?? 0) * 100) : null,
      courseId: input.kind === "course_access" ? (input.courseId ?? null) : null,
      maxUses: 1,
    });

    const [updated] = await tx
      .update(paymentRequests)
      .set({
        status: "approved",
        adminNote: input.kind === "wallet_balance" ? `كود شحن رصيد بقيمة ${input.amountEgp} ج.م` : "كود تفعيل كورس",
        issuedCode: code,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      })
      .where(and(eq(paymentRequests.id, requestId), eq(paymentRequests.status, "pending")))
      .returning({ id: paymentRequests.id });
    if (!updated) throw new ServiceError(409, "ALREADY_REVIEWED", "تم مراجعة هذا الطلب من قبل");

    await tx.insert(notifications).values({
      userId: request.userId,
      title: "كود الشحن الخاص بك جاهز",
      body:
        input.kind === "wallet_balance"
          ? `كود شحن رصيد بقيمة ${input.amountEgp} ج.م: ${code} — ادخل محفظتك واكتب الكود لتفعيله.`
          : `كود تفعيل الكورس: ${code} — ادخل محفظتك واكتب الكود لفتح الكورس كامل.`,
      kind: "system",
    });

    return { code, kind: input.kind };
  });
}

/** Rejects the request with a note, delivered to the student via notifications. */
export async function rejectPaymentRequest(admin: SessionUser, requestId: string, note: string) {
  const rows = await db.select().from(paymentRequests).where(eq(paymentRequests.id, requestId)).limit(1);
  const request = rows[0];
  if (!request) throw new ServiceError(404, "REQUEST_NOT_FOUND", "الطلب غير موجود");
  if (request.status !== "pending") {
    throw new ServiceError(409, "ALREADY_REVIEWED", "تم مراجعة هذا الطلب من قبل");
  }

  const [updated] = await db
    .update(paymentRequests)
    .set({ status: "rejected", adminNote: note, reviewedAt: new Date(), reviewedBy: admin.id })
    .where(and(eq(paymentRequests.id, requestId), eq(paymentRequests.status, "pending")))
    .returning({ id: paymentRequests.id });
  if (!updated) throw new ServiceError(409, "ALREADY_REVIEWED", "تم مراجعة هذا الطلب من قبل");

  await db.insert(notifications).values({
    userId: request.userId,
    title: "تم رفض طلب الشحن",
    body: note || "راجع بيانات التحويل وحاول مرة أخرى، أو تواصل مع الدعم.",
    kind: "system",
  });

  return { id: requestId, status: "rejected" };
}
