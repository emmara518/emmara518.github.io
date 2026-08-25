import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, walletAccounts, notifications, parentLinks } from "@/db/schema";
import { registerSchema } from "@/lib/contracts";
import { createSession, hashPassword } from "@/lib/auth";
import { err, ok, parseJson, applyRateLimit } from "@/lib/http";

export async function POST(request: Request) {
  const rateLimitResponse = await applyRateLimit(request, "auth");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJson(request, registerSchema);
  if ("response" in parsed) return parsed.response;
  const email = parsed.data.email.toLowerCase().trim();
  const guardianPhone = parsed.data.guardianPhone || null;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return err(409, "EMAIL_TAKEN", "هذا البريد مسجل بالفعل — جرّب تسجيل الدخول");

  const hashed = await hashPassword(parsed.data.password);
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashed,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone || null,
      guardianPhone,
      role: "student",
    })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

  await db.insert(walletAccounts).values({ userId: user.id, balanceCents: 0 }).onConflictDoNothing();
  await db.insert(notifications).values({
    userId: user.id,
    title: "أهلًا بك في دروس ماث",
    body: "أنشأنا حسابك بنجاح. تصفح الكورسات وابدأ أول درس مجاني.",
    kind: "system",
  });

  // Auto-link: any parent account already registered with this guardian mobile
  // instantly gains access to this student's results.
  if (guardianPhone) {
    const parents = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phone, guardianPhone), eq(users.role, "parent")));
    if (parents.length) {
      await db
        .insert(parentLinks)
        .values(parents.map((p) => ({ parentId: p.id, studentId: user.id })))
        .onConflictDoNothing();
      await db.insert(notifications).values(
        parents.map((p) => ({
          userId: p.id,
          title: "تم ربط ابنك بحسابك",
          body: `أصبح بإمكانك متابعة نتائج «${user.name}» من بوابة ولي الأمر.`,
          kind: "parent",
        })),
      );
    }
  }

  await createSession(user.id);
  return ok({ user }, { status: 201 });
}
