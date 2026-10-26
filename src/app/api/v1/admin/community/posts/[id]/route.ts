import { requirePermission } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { uuid, adminPostStatusSchema } from "@/lib/contracts";
import { setPostStatus } from "@/lib/services/admin.service";
import { db } from "@/db";
import { communityPosts, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

/** Moderation: approve / reject / send back to pending. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("community.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const parsed = await parseJson(request, adminPostStatusSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");

  try {
    const result = await setPostStatus(auth.user, id, parsed.data.status);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("community.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");
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
