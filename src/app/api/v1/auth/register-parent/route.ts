import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, parentLinks, users } from "@/db/schema";
import { parentRegisterSchema } from "@/lib/contracts";
import { createSession, hashPassword } from "@/lib/auth";
import { err, ok, parseJson, applyRateLimit } from "@/lib/http";
import { linkParentByGuardianPhone } from "@/lib/services/parent.service";

/**
 * Parent self-registration — the ONLY credential is the guardian mobile number
 * the student entered at signup. No email needed: we synthesize an internal one.
 */
export async function POST(request: Request) {
  const rateLimitResponse = await applyRateLimit(request, "auth");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJson(request, parentRegisterSchema);
  if ("response" in parsed) return parsed.response;
  const phone = parsed.data.phone.trim();

  // One parent account per guardian mobile.
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.phone, phone), eq(users.role, "parent")))
    .limit(1);
  if (existing[0]) return err(409, "PHONE_TAKEN", "هذا الرقم مسجل بالفعل لحساب ولي أمر — جرّب تسجيل الدخول");

  // The number must match at least one subscribed student's guardian mobile.
  const students = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.guardianPhone, phone), eq(users.role, "student")));
  if (!students.length) {
    return err(
      404,
      "NO_LINKED_STUDENT",
      "لا يوجد طالب مسجل بهذا الرقم كولي أمر — تأكد من رقم الموبايل الذي أدخله ابنك وقت إنشاء حسابه",
    );
  }

  const email = `${phone}@parents.dros-math.com`;
  const emailTaken = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (emailTaken[0]) return err(409, "PHONE_TAKEN", "هذا الرقم مسجل بالفعل لحساب ولي أمر — جرّب تسجيل الدخول");

  const hashed = await hashPassword(parsed.data.password);
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashed,
      name: parsed.data.name.trim(),
      phone,
      role: "parent",
    })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

  await linkParentByGuardianPhone(user.id, phone);

  await db.insert(notifications).values([
    {
      userId: user.id,
      title: "أهلًا بك في بوابة ولي الأمر",
      body: `تم ربط حسابك بـ ${students.map((s) => `«${s.name}»`).join(" و ")}. تابع نتائجه واختباراته أولًا بأول.`,
      kind: "parent",
    },
    ...students.map((s) => ({
      userId: s.id,
      title: "تم ربط حسابك بولي الأمر",
      body: `ولي الأمر «${user.name}» يستطيع الآن متابعة نتائجك واختباراتك.`,
      kind: "parent",
    })),
  ]);

  await createSession(user.id);
  return ok({ user }, { status: 201 });
}
