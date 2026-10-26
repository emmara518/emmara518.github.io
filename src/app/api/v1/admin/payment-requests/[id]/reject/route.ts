import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { rejectPaymentRequest } from "@/lib/services/payment-requests.service";
import { toEnvelope } from "@/lib/errors";

const rejectSchema = z.object({
  note: z.string().trim().max(500).default(""),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };
  const parsed = await parseJson(request, rejectSchema);
  if ("response" in parsed) return parsed.response;
  const { id } = await params;

  try {
    const result = await rejectPaymentRequest(auth.user, id, parsed.data.note);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
