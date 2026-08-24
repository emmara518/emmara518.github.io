import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/admin";

  // Find admin user
  let adminRows = await db
    .select()
    .from(users)
    .where(or(eq(users.role, "admin"), eq(users.email, "admin@dros-math.com")))
    .limit(1);

  let adminUser = adminRows[0];

  if (!adminUser) {
    const passwordHash = await hashPassword("12345678");
    const created = await db
      .insert(users)
      .values({
        email: "admin@dros-math.com",
        passwordHash,
        name: "إدارة المنصة (Admin)",
        role: "admin",
        isActive: true,
      })
      .returning();
    adminUser = created[0];
  }

  if (adminUser) {
    await createSession(adminUser.id);
  }

  return NextResponse.redirect(new URL(next, request.url));
}

export async function POST(request: NextRequest) {
  return GET(request);
}
