import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { applyRateLimit, err, ok, parseJson } from "@/lib/http";
import { progressSchema } from "@/lib/contracts";
import { markVideoProgress } from "@/lib/services/dashboard.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„");
  if (!can(auth.user.role, "progress:write")) return err(403, "FORBIDDEN", "Ù„Ø§ ØªÙ…Ù„Ùƒ Ù‡Ø°Ù‡ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©");
  const limited = await applyRateLimit(request, "api", `progress:${auth.user.id}`);
  if (limited) return limited;

  const parsed = await parseJson(request, progressSchema);
  if ("response" in parsed) return parsed.response;

  const { id } = await params;
  if (parsed.data.videoId !== id) return err(422, "MISMATCH", "Ù…Ø¹Ø±Ù‘Ù Ø§Ù„ÙÙŠØ¯ÙŠÙˆ ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚");

  try {
    const result = await markVideoProgress(auth.user.id, id, parsed.data.watchedSeconds, parsed.data.completed);
    return ok(result);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
