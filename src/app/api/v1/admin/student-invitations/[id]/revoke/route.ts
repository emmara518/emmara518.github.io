import { requireSuperAdmin } from "@/lib/permission-guard";
import { applyRateLimit, err, ok } from "@/lib/http";
import { revokeStudentInvitation } from "@/lib/student-invitations";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;

  const rateLimitResponse = await applyRateLimit(request, "api", `student-invite-revoke:${gate.user.id}`);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "معرف غير صالح");

  try {
    return ok(await revokeStudentInvitation(gate.user, id));
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
