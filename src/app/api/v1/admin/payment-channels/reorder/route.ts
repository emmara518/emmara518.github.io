import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { reorderPaymentChannels } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin"]);
  if (!("user" in auth)) return new Response(JSON.stringify({ ok: false, error: { code: "UNAUTHENTICATED", message: "يجب تسجيل الدخول" } }), { status: 401 });
  if (!["admin"].includes(auth.user.role)) {
    return new Response(JSON.stringify({ ok: false, error: { code: "FORBIDDEN", message: "لا تملك صلاحية إعادة الترتيب" } }), { status: 403, headers: { "content-type": "application/json" } });
  }

  const parsed = await parseJson(request, reorderSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const result = await reorderPaymentChannels(
      { id: auth.user.id, name: auth.user.name, role: auth.user.role } as any,
      parsed.data.ids
    );
    return new Response(JSON.stringify({ ok: true, data: result }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: { code: "INTERNAL", message: "حدث خطأ غير متوقع" } }), { status: 500, headers: { "content-type": "application/json" } });
  }
}