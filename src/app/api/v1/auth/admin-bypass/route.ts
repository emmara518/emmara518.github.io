import { NextResponse } from "next/server";
import { or, eq } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { users, walletAccounts } from "@/db/schema";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getOrCreateAdminId(): Promise<string> {
  await ensureDbReady();

  // Find existing teacher or admin account
  const adminRows = await db
    .select()
    .from(users)
    .where(or(eq(users.role, "teacher"), eq(users.role, "admin")))
    .limit(1);

  if (adminRows[0]?.id) {
    return adminRows[0].id;
  }

  // Fallback: fetch first user or promote to teacher
  const anyUser = await db.select().from(users).limit(1);
  if (anyUser[0]?.id) {
    await db.update(users).set({ role: "teacher" }).where(eq(users.id, anyUser[0].id));
    return anyUser[0].id;
  }

  // If DB is completely clean, insert default teacher
  const [created] = await db
    .insert(users)
    .values({
      name: "مستر محمد سعيد",
      email: "mohamed.saeed@drosmath.com",
      passwordHash: "$2a$10$eE.rW4q6dFqTjFv3bC841u2P0F3c2uW7N.F.WvC2pL8JkL1u2e4Wy",
      role: "teacher",
      isActive: true,
      avatarUrl: "/images/assets/teacher.webp",
    })
    .returning({ id: users.id });

  if (created?.id) {
    await db
      .insert(walletAccounts)
      .values({ userId: created.id, balanceCents: 500000 })
      .onConflictDoNothing();
    return created.id;
  }

  return "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/admin";

  const targetUserId = await getOrCreateAdminId();
  if (targetUserId) {
    await createSession(targetUserId);
  }

  return NextResponse.redirect(new URL(next, request.url));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/admin";

  const targetUserId = await getOrCreateAdminId();
  if (targetUserId) {
    await createSession(targetUserId);
  }

  return NextResponse.json({ success: true, redirect: next });
}
