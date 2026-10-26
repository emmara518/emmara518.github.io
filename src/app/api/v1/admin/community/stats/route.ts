import { requirePermission } from "@/lib/permission-guard";
import { err, ok } from "@/lib/http";
import { getCommunityModeratorStats } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function GET() {
  const gate = await requirePermission("community.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  try {
    return ok(await getCommunityModeratorStats());
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}