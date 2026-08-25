import { cookies } from "next/headers";
import { requireApiUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { destroyOtherSessions, getAccountOverview } from "@/lib/services/account.service";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "سجل الدخول مطلوب");
  const store = await cookies();
  const data = await getAccountOverview(auth.user.id, store.get(SESSION_COOKIE)?.value ?? null);
  return ok({ sessions: data.sessions });
}

export async function DELETE() {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "سجل الدخول مطلوب");
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return err(401, "UNAUTHENTICATED", "سجل الدخول مطلوب");
  const result = await destroyOtherSessions(auth.user.id, token);
  return ok(result);
}
