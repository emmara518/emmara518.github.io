import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { applyRateLimit, err, ok } from "@/lib/http";
import { recordVideoView } from "@/lib/services/dashboard.service";
import { toEnvelope } from "@/lib/errors";
import { uuid } from "@/lib/contracts";

/** Counts one view when the student opens a video â€” enforces videos.max_views. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„");
  if (!can(auth.user.role, "progress:write")) return err(403, "FORBIDDEN", "ØºÙŠØ± Ù…Ø³Ù…ÙˆØ­");
  const limited = await applyRateLimit(_request, "api", `view:${auth.user.id}`);
  if (limited) return limited;
  const { id } = await params;
  if (!uuid.safeParse(id).success) return err(422, "VALIDATION", "Ù…Ø¹Ø±Ù ØºÙŠØ± ØµØ§Ù„Ø­");

  try {
    const result = await recordVideoView(auth.user.id, id);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
