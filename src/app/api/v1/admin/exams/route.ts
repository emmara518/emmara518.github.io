import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { exams, auditLogs } from "@/db/schema";
import { listExamsAdmin, createExamAdvanced } from "@/lib/services/admin.service";
import { toEnvelope } from "@/lib/errors";

const examTypeEnum = z.enum(["graded", "practice", "quiz", "surprise", "final", "diagnostic"]);

const createExamSchema = z.object({
  title: z.string().trim().min(3, "العنوان قصير").max(160),
  description: z.string().trim().max(500).optional(),
  courseId: z.string().uuid(),
  groupId: z.string().uuid().optional().nullable(),
  type: examTypeEnum.default("graded"),
  durationMin: z.number().int().min(5).max(300).default(60),
  perQuestionSec: z.number().int().min(10).max(3600).optional().nullable(),
  maxAttempts: z.number().int().min(1).max(20).optional().nullable(),
  passingScore: z.number().int().min(0).max(100).default(50),
  shuffleQuestions: z.boolean().default(false),
  showResultsImmediately: z.boolean().default(true),
  prerequisiteExamId: z.string().uuid().optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().default(false),
});

export async function GET() {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  const examsList = await listExamsAdmin();
  return ok({ exams: examsList });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية الإنشاء");

  const parsed = await parseJson(request, createExamSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const created = await createExamAdvanced(auth.user, parsed.data);
    return ok(created, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}