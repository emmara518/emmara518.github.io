import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { updateCommunityGroup, deleteCommunityGroup } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  scope: z.enum(["public", "course", "stage", "custom"]).optional(),
  courseId: z.string().uuid().nullable().optional(),
  stageId: z.string().uuid().nullable().optional(),
  coverImageUrl: z.string().url().max(600).optional().or(z.literal("")),
  iconKey: z.string().max(80).optional(),
  isActive: z.boolean().optional(),
  moderationRequired: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية التعديل");

  const { id } = await params;
  const parsed = await parseJson(request, patchSchema);
  if ("response" in parsed) return parsed.response;

  try {
    return ok(await updateCommunityGroup(auth.user, id, parsed.data));
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الحذف");
  const { id } = await params;
  try {
    return ok(await deleteCommunityGroup(auth.user, id));
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}