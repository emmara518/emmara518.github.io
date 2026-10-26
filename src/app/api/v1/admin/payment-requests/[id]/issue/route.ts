import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { issueCodeForRequest } from "@/lib/services/payment-requests.service";
import { toEnvelope } from "@/lib/errors";

const issueSchema = z.object({
  kind: z.enum(["wallet_balance", "course_access"]),
  amountEgp: z.number().min(1).max(50000).optional(),
  courseId: z.string().uuid().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const parsed = await parseJson(request, issueSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const result = await issueCodeForRequest(auth.user, id, parsed.data);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
