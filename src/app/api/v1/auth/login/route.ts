import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/contracts";
import { createSession, verifyPassword } from "@/lib/auth";
import { err, ok, parseJson, applyRateLimit } from "@/lib/http";

export async function POST(request: Request) {
  const rateLimitResponse = await applyRateLimit(request, "auth");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJson(request, loginSchema);
  if ("response" in parsed) return parsed.response;
  const email = parsed.data.email.toLowerCase().trim();

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  const valid = user && user.isActive && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!valid) return err(401, "BAD_CREDENTIALS", "بيانات الدخول غير صحيحة");

  await createSession(user.id);
  return ok({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
