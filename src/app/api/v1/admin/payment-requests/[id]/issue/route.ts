import { requireApiUser } from "@/lib/auth";
import { can, ADMIN_ROLES } from "@/lib/rbac";
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
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "صلاحيات الإدارة مطلوبة");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "غير مسموح بتعديل الطلبات");

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
