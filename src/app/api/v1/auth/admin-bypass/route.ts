import { NextResponse } from "next/server";
import { or, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/admin";

  // Find existing teacher or admin account
  let adminRows = await db
    .select()
    .from(users)
    .where(or(eq(users.role, "teacher"), eq(users.role, "admin")))
    .limit(1);

  let targetUserId = adminRows[0]?.id;

  // Fallback: if no teacher/admin exists, fetch first user or promote to teacher
  if (!targetUserId) {
    const anyUser = await db.select().from(users).limit(1);
    if (anyUser[0]) {
      targetUserId = anyUser[0].id;
      await db.update(users).set({ role: "teacher" }).where(eq(users.id, targetUserId));
    }
  }

  if (targetUserId) {
    await createSession(targetUserId);
  }

  return NextResponse.redirect(new URL(next, request.url));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/admin";

  let adminRows = await db
    .select()
    .from(users)
    .where(or(eq(users.role, "teacher"), eq(users.role, "admin")))
    .limit(1);

  let targetUserId = adminRows[0]?.id;

  if (!targetUserId) {
    const anyUser = await db.select().from(users).limit(1);
    if (anyUser[0]) {
      targetUserId = anyUser[0].id;
      await db.update(users).set({ role: "teacher" }).where(eq(users.id, targetUserId));
    }
  }

  if (targetUserId) {
    await createSession(targetUserId);
  }

  return NextResponse.json({ success: true, redirect: next });
}
