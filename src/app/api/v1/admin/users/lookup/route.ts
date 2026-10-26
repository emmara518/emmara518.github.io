import { requirePermission } from "@/lib/permission-guard";
import { err, ok } from "@/lib/http";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

export async function GET(request: Request) {
  const gate = await requirePermission("students.view");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return err(400, "MISSING_EMAIL", "البريد الإلكتروني مطلوب");

  try {
    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];
    if (!user) return err(404, "USER_NOT_FOUND", "لم يتم العثور على مستخدم بهذا البريد");
    return ok({ userId: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}