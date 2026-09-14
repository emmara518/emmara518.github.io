import { err, ok, parseJson } from "@/lib/http";
import { requirePermission } from "@/lib/permission-guard";
import { adminCourseSchema } from "@/lib/contracts";
import { createCourse, listCoursesAdmin } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function GET() {
  const gate = await requirePermission("courses.view");
  if ("response" in gate) return gate.response;
  const courses = await listCoursesAdmin();
  return ok({ courses });
}

export async function POST(request: Request) {
  const gate = await requirePermission("courses.create");
  if ("response" in gate) return gate.response;

  const parsed = await parseJson(request, adminCourseSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const created = await createCourse(gate.user, parsed.data);
    return ok(created, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
