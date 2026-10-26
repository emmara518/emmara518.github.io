import { requirePermission } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { gradeSubmissionSchema } from "@/lib/contracts";
import { gradeSubmission } from "@/lib/services/assignments.service";
import { toEnvelope } from "@/lib/errors";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("assignments.manage");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const parsed = await parseJson(request, gradeSubmissionSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const result = await gradeSubmission(auth.user, id, parsed.data.score);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
