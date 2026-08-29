import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import {
  listCommunityGroupMembersAdmin,
  addCommunityGroupMember,
  removeCommunityGroupMember,
} from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const memberSchema = z.object({ userId: z.string().uuid() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { id } = await params;
  try {
    return ok({ members: await listCommunityGroupMembersAdmin(id) });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإضافة");
  const { id } = await params;
  const parsed = await parseJson(request, memberSchema);
  if ("response" in parsed) return parsed.response;
  try {
    return ok(await addCommunityGroupMember(auth.user, id, parsed.data.userId));
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الحذف");
  const { id } = await params;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return err(400, "MISSING_USER", "userId مطلوب");
  try {
    return ok(await removeCommunityGroupMember(auth.user, id, userId));
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}