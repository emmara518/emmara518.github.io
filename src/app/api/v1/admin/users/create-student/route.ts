import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { registerSchema } from "@/lib/contracts";
import { hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users, walletAccounts, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");

  const parsed = await parseJson(request, registerSchema);
  if ("response" in parsed) return parsed.response;
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return err(409, "EMAIL_TAKEN", "هذا البريد مسجل بالفعل في المنصة");

  const hashed = await hashPassword(parsed.data.password);
  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashed,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone || null,
      role: "student",
      isActive: true,
    })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt });

  await db.insert(walletAccounts).values({ userId: created.id, balanceCents: 0 }).onConflictDoNothing();
  await db.insert(notifications).values({
    userId: created.id,
    title: "تم إنشاء حسابك الإداري",
    body: "تم تسجيل حسابك من قبل إدارة منصة دروس ماث بنجاح.",
    kind: "system",
  });

  return ok({ user: created }, { status: 201 });
}
