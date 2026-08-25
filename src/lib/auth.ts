import crypto from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import type { Role } from "./rbac";

/**
 * Authentication — server-side sessions only.
 * Passwords: bcrypt(12). Sessions: opaque 256-bit token in httpOnly cookie,
 * hashed-metadata row in DB with expiry. No third-party auth dependency.
 * Single-active-session policy: a new login revokes the user's previous sessions.
 */

/** The single master admin account (see db/seed.ts). */
export const MASTER_ADMIN_EMAIL = "admin";

export const SESSION_COOKIE = "dros_session";
const SESSION_TTL_DAYS = 30;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  // Single-active-session policy: opening the account on any device revokes
  // all previous sessions — protects teacher content from account sharing.
  await db.delete(sessions).where(eq(sessions.userId, userId));
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    store.delete(SESSION_COOKIE);
  } catch (err) {
    console.warn("[auth] destroySession error:", err);
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date()), eq(users.isActive, true)))
      .limit(1);
    return rows[0] ?? null;
  } catch (err) {
    console.warn("[auth] getSessionUser error:", err);
    return null;
  }
}

/** For API handlers: user or null. Handlers emit 401/403 via http.ts helpers. */
export async function requireApiUser(roles?: readonly Role[]): Promise<
  | { user: SessionUser }
  | { status: 401 | 403 }
> {
  const user = await getSessionUser();
  if (!user) return { status: 401 };
  if (roles && !roles.includes(user.role)) return { status: 403 };
  return { user };
}
