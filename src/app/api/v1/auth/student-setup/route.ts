import { z } from "zod";
import { applyRateLimit, err, ok, parseJson } from "@/lib/http";
import { consumeStudentInvitation } from "@/lib/student-invitations";
import { toEnvelope } from "@/lib/errors";

const setupSchema = z.object({
  token: z.string().min(40).max(64),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const rateLimitResponse = await applyRateLimit(request, "auth");
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJson(request, setupSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const result = await consumeStudentInvitation(parsed.data.token, parsed.data.password);
    return ok({ email: result.email });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
