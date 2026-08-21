import { ok } from "@/lib/http";
import { listStagesWithGrades, listSubjects } from "@/lib/services/catalog.service";

export async function GET() {
  const [stages, subjects] = await Promise.all([listStagesWithGrades(), listSubjects()]);
  return ok({ stages, subjects });
}
