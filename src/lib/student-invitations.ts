import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, notifications, studentInvitations, users, walletAccounts } from "@/db/schema";
import { hashPassword, type SessionUser } from "./auth";
import { ServiceError } from "./errors";

const DEFAULT_TTL_MINUTES = 30;
const MIN_TTL_MINUTES = 1;
const MAX_TTL_MINUTES = 24 * 60;

function invitationTtlMinutes(): number {
  const configured = Number(process.env.STUDENT_INVITATION_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  if (!Number.isInteger(configured)) return DEFAULT_TTL_MINUTES;
  return Math.min(Math.max(configured, MIN_TTL_MINUTES), MAX_TTL_MINUTES);
}

export function generateSetupToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSetupToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isValidSetupToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,64}$/.test(token);
}

export function invitationExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + invitationTtlMinutes() * 60 * 1000);
}

export function buildSetupUrl(token: string, requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production") {
    throw new ServiceError(503, "SETUP_URL_NOT_CONFIGURED", "رابط التطبيق غير مهيأ لإنشاء دعوات الطلاب");
  }
  const base = (configured || "http://localhost:3000").replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    throw new ServiceError(503, "SETUP_URL_INVALID", "رابط التطبيق غير صالح");
  }
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new ServiceError(503, "SETUP_URL_INVALID", "رابط التطبيق يجب أن يستخدم HTTPS");
  }
  if (process.env.NODE_ENV === "production" && requestOrigin) {
    try {
      if (new URL(requestOrigin).origin !== parsed.origin) {
        throw new ServiceError(503, "SETUP_URL_ORIGIN_MISMATCH", "رابط التطبيق لا يطابق عنوان الطلب");
      }
    } catch (e) {
      if (e instanceof ServiceError) throw e;
      throw new ServiceError(503, "SETUP_URL_INVALID", "رابط الطلب غير صالح");
    }
  }
  return `${base}/setup-password#token=${token}`;
}

export async function createStudentInvitation(
  actor: SessionUser,
  input: { name: string; email: string; phone?: string | null },
  requestOrigin?: string,
) {
  const email = input.email.toLowerCase().trim();
  const now = new Date();

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser[0]) {
    throw new ServiceError(409, "EMAIL_TAKEN", "هذا البريد مسجل بالفعل");
  }

  const pending = await db
    .select({ id: studentInvitations.id })
    .from(studentInvitations)
    .where(
      and(
        eq(studentInvitations.email, email),
        isNull(studentInvitations.consumedAt),
        isNull(studentInvitations.revokedAt),
        gt(studentInvitations.expiresAt, now),
      ),
    )
    .limit(1);
  if (pending[0]) {
    throw new ServiceError(409, "INVITATION_PENDING", "توجد دعوة نشطة لهذا البريد بالفعل");
  }

  const token = generateSetupToken();
  const [created] = await db
    .insert(studentInvitations)
    .values({
      email,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      tokenHash: hashSetupToken(token),
      expiresAt: invitationExpiresAt(now),
      createdBy: actor.id,
    })
    .returning({
      id: studentInvitations.id,
      email: studentInvitations.email,
      name: studentInvitations.name,
      expiresAt: studentInvitations.expiresAt,
    });

  await db.insert(auditLogs).values({
    actorId: actor.id,
    action: "student_invitations.create",
    entity: "student_invitations",
    entityId: created.id,
    meta: { email },
  });

  return {
    id: created.id,
    email: created.email,
    name: created.name,
    expiresAt: created.expiresAt,
    setupUrl: buildSetupUrl(token, requestOrigin),
  };
}

export async function revokeStudentInvitation(actor: SessionUser, id: string) {
  const [revoked] = await db
    .update(studentInvitations)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(studentInvitations.id, id),
        isNull(studentInvitations.consumedAt),
        isNull(studentInvitations.revokedAt),
      ),
    )
    .returning({ id: studentInvitations.id });

  if (!revoked) {
    throw new ServiceError(404, "INVITATION_NOT_FOUND", "الدعوة غير موجودة أو لم تعد قابلة للإلغاء");
  }

  await db.insert(auditLogs).values({
    actorId: actor.id,
    action: "student_invitations.revoke",
    entity: "student_invitations",
    entityId: revoked.id,
  });

  return { id: revoked.id, revoked: true };
}

export async function consumeStudentInvitation(token: string, password: string) {
  if (!isValidSetupToken(token)) {
    throw new ServiceError(410, "INVITATION_INVALID", "رابط إعداد الحساب غير صالح أو منتهي");
  }

  const tokenHash = hashSetupToken(token);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .update(studentInvitations)
      .set({ consumedAt: now })
      .where(
        and(
          eq(studentInvitations.tokenHash, tokenHash),
          isNull(studentInvitations.consumedAt),
          isNull(studentInvitations.revokedAt),
          gt(studentInvitations.expiresAt, now),
        ),
      )
      .returning({
        id: studentInvitations.id,
        email: studentInvitations.email,
        name: studentInvitations.name,
        phone: studentInvitations.phone,
      });

    if (!invitation) {
      throw new ServiceError(410, "INVITATION_INVALID", "رابط إعداد الحساب غير صالح أو منتهي");
    }

    const existing = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, invitation.email))
      .limit(1);
    if (existing[0]) {
      throw new ServiceError(409, "EMAIL_TAKEN", "هذا البريد مسجل بالفعل");
    }

    const passwordHash = await hashPassword(password);
    const [user] = await tx
      .insert(users)
      .values({
        email: invitation.email,
        passwordHash,
        name: invitation.name,
        phone: invitation.phone,
        role: "student",
        isActive: true,
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    await tx.insert(walletAccounts).values({ userId: user.id, balanceCents: 0 }).onConflictDoNothing();
    await tx.insert(notifications).values({
      userId: user.id,
      title: "تم تفعيل حسابك",
      body: "مرحباً بك في دروس ماث. يمكنك الآن تسجيل الدخول ومتابعة كورساتك.",
      kind: "system",
    });
    await tx.insert(auditLogs).values({
      actorId: null,
      action: "student_invitations.consume",
      entity: "users",
      entityId: user.id,
      meta: { invitationId: invitation.id },
    });

    return { id: user.id, email: user.email, name: user.name };
  });
}
