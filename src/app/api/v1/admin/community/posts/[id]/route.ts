import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { adminPostStatusSchema } from "@/lib/contracts";
import { setPostStatus } from "@/lib/services/admin.service";
import { db } from "@/db";
import { communityPosts, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

/** Moderation: approve / reject / send back to pending. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية مراجعة المنشورات");

  const parsed = await parseJson(request, adminPostStatusSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const result = await setPostStatus(auth.user, id, parsed.data.status);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية حذف المنشورات");

  const { id } = await params;
  try {
    await db.delete(communityPosts).where(eq(communityPosts.id, id));
    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "community.delete_post",
      entity: "community_posts",
      entityId: id,
    });
    return ok({ id, deleted: true });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
