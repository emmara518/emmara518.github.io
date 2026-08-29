import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok } from "@/lib/http";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

export async function GET(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:read")) return err(403, "FORBIDDEN", "لا تملك صلاحية البحث");

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