import { ok } from "@/lib/http";
import { catalogQuerySchema } from "@/lib/contracts";
import { parseQuery } from "@/lib/http";
import { listCourses } from "@/lib/services/catalog.service";

export async function GET(request: Request) {
  const query = parseQuery(request, catalogQuerySchema) ?? {};
  const courses = await listCourses({
    gradeSlug: query.grade || undefined,
    subjectSlug: query.subject || undefined,
    q: query.q || undefined,
  });
  return ok({ courses });
}
