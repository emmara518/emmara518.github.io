import { requirePermission } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { assignmentCreateSchema } from "@/lib/contracts";
import { createAssignment, listAssignmentsAdmin } from "@/lib/services/assignments.service";
import { toEnvelope } from "@/lib/errors";

export async function GET() {
  const gate = await requirePermission("assignments.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const assignments = await listAssignmentsAdmin();
  return ok({ assignments });
}

export async function POST(request: Request) {
  const gate = await requirePermission("assignments.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const parsed = await parseJson(request, assignmentCreateSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const created = await createAssignment(auth.user, parsed.data);
    return ok(created, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
