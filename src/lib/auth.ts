import crypto from "node:crypto";
import { cache } from "react";
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

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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
  await db.insert(sessions).values({ token: hashSessionToken(token), userId, expiresAt });
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
      await db.delete(sessions).where(eq(sessions.token, hashSessionToken(token)));
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    store.delete(SESSION_COOKIE);
  } catch (err) {
    console.warn("[auth] destroySession error:", err);
  }
}

/**
 * Resolve the session user for the current request.
 *
 * Wrapped in React `cache()` so the many call sites that run during a single
 * render — the root layout, `dashboard/layout.tsx`, the `(main)`/`(focus)`
 * shells, the page itself and `requireApiUser` — share ONE database lookup
 * instead of issuing one query each. That both guarantees a single auth
 * decision per request and removes the connection churn that helped exhaust
 * the database pool.
 */
export async function resolveSessionUser(token: string): Promise<SessionUser | null> {
  const tokenHash = hashSessionToken(token);
  const baseSelect = {
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    avatarUrl: users.avatarUrl,
  };
  let rows = await db
    .select(baseSelect)
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, tokenHash), gt(sessions.expiresAt, new Date()), eq(users.isActive, true)))
    .limit(1);

  // Compatibility bridge for sessions created before token hashing. The first
  // authenticated request upgrades the row in place; the raw token is never
  // returned or logged. Migration 0005 hashes rows at rest when pgcrypto is
  // available.
  if (!rows[0]) {
    const legacy = await db
      .select(baseSelect)
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date()), eq(users.isActive, true)))
      .limit(1);
    if (legacy[0]) {
      await db.update(sessions).set({ token: tokenHash }).where(eq(sessions.token, token));
      rows = legacy;
    }
  }
  return rows[0] ?? null;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await resolveSessionUser(token);
  } catch (err) {
    console.warn("[auth] getSessionUser error:", err);
    return null;
  }
});

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
