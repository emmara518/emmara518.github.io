import { requirePermission } from "@/lib/permission-guard";
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
  const gate = await requirePermission("community.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const { id } = await params;
  try {
    return ok({ members: await listCommunityGroupMembersAdmin(id) });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("community.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
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
  const gate = await requirePermission("community.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
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