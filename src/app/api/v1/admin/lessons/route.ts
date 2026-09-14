import { err, ok, parseJson } from "@/lib/http";
import { requirePermission } from "@/lib/permission-guard";
import { adminLessonCreateSchema } from "@/lib/contracts";
import { createLesson } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

export async function POST(request: Request) {
  const gate = await requirePermission("content.create");
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };

  const parsed = await parseJson(request, adminLessonCreateSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const created = await createLesson(auth.user, parsed.data);
    return ok({ lesson: created }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}