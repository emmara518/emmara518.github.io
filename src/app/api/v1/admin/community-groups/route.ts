import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { listCommunityGroupsAdmin, createCommunityGroup } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const groupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  scope: z.enum(["public", "course", "stage", "custom"]),
  courseId: z.string().uuid().optional().nullable(),
  stageId: z.string().uuid().optional().nullable(),
  coverImageUrl: z.string().url().max(600).optional().or(z.literal("")),
  iconKey: z.string().max(80).optional(),
  moderationRequired: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  memberUserIds: z.array(z.string().uuid()).optional(),
});

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  try {
    const groups = await listCommunityGroupsAdmin();
    return ok({ groups });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإنشاء");

  const parsed = await parseJson(request, groupSchema);
  if ("response" in parsed) return parsed.response;

  if (parsed.data.scope === "course" && !parsed.data.courseId) {
    return err(400, "MISSING_COURSE", "يجب تحديد الكورس عند النطاق = course");
  }
  if (parsed.data.scope === "stage" && !parsed.data.stageId) {
    return err(400, "MISSING_STAGE", "يجب تحديد المرحلة عند النطاق = stage");
  }
  if (parsed.data.scope === "custom" && (!parsed.data.memberUserIds || parsed.data.memberUserIds.length === 0)) {
    return err(400, "MISSING_MEMBERS", "يجب تحديد أعضاء مخصصين عند النطاق = custom");
  }

  try {
    const created = await createCommunityGroup(auth.user, parsed.data);
    return ok({ group: created }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}