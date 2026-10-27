import { z } from "zod";
import { requireSuperAdmin } from "@/lib/permission-guard";
import { applyRateLimit, err, ok, parseJson } from "@/lib/http";
import { createStudentInvitation } from "@/lib/student-invitations";
import { toEnvelope } from "@/lib/errors";

const invitationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(190),
  phone: z
    .string()
    .trim()
    .regex(/^01[0-9]{9}$/)
    .optional()
    .or(z.literal("")),
});

export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;

  const rateLimitResponse = await applyRateLimit(request, "api", `student-invite:${gate.user.id}`, { failClosed: true });
  if (rateLimitResponse) return rateLimitResponse;

  const parsed = await parseJson(request, invitationSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const invitation = await createStudentInvitation(
      gate.user,
      {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
      },
      new URL(request.url).origin,
    );
    return ok(
      { invitation },
      {
        status: 201,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          Pragma: "no-cache",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
