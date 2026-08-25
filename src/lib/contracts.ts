import { z } from "zod";
import { ROLES } from "./rbac";

/**
 * API contracts — zod schemas are the single source of truth.
 * Every /api/v1 handler validates its input through these.
 */

export const uuid = z.uuid();

export const registerSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(80),
  email: z.email("البريد الإلكتروني غير صالح").max(190),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(72),
  phone: z
    .string()
    .trim()
    .regex(/^01[0-9]{9}$/, "رقم الموبايل المصري غير صالح")
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  // Accepts a full email OR a short username (e.g. «admin»)
  email: z.string().trim().min(3, "البريد الإلكتروني أو اسم المستخدم قصير").max(200),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const catalogQuerySchema = z.object({
  grade: z.string().max(80).optional(),
  subject: z.string().max(80).optional(),
  q: z.string().trim().max(120).optional(),
});

export const purchaseSchema = z.object({
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export const progressSchema = z.object({
  videoId: uuid,
  watchedSeconds: z.number().int().min(0).max(60 * 60 * 24).default(0),
  completed: z.boolean().default(false),
});

export const examSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: uuid,
        choiceIndex: z.number().int().min(0).max(9).nullable(),
      }),
    )
    .max(200),
});

export const adminCourseSchema = z.object({
  title: z.string().trim().min(3).max(140),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(90)
    .regex(/^[a-z0-9-]+$/, "الرابط اللاتيني بحروف صغيرة وشرطات فقط"),
  summary: z.string().trim().max(280).default(""),
  description: z.string().trim().max(4000).default(""),
  gradeId: uuid,
  subjectId: uuid,
  priceEgp: z.number().min(0).max(100000),
});

export const adminCourseStatusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Z0-9-]+$/i, "كود بحروف لاتينية وأرقام فقط"),
  kind: z.enum(["course_percent", "wallet_balance", "course_access"]).default("course_percent"),
  percentOff: z.number().int().min(1, "النسبة من 1 إلى 90").max(90).default(10),
  /** Required when kind = wallet_balance — value in EGP (e.g. 250). */
  amountEgp: z.number().min(5).max(100000).optional(),
  /** Required when kind = course_access — the course this code unlocks. */
  courseId: z.string().uuid().optional(),
  maxUses: z.number().int().min(1).max(100000).default(100),
});

export const redeemCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Z0-9-]+$/i, "كود بحروف لاتينية وأرقام فقط"),
});

export const userRoleSchema = z.object({
  role: z.enum(ROLES),
});

export const topUpSchema = z.object({
  amountEgp: z.number().min(10).max(50000),
});

export const adminUserPatchSchema = z
  .object({
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, {
    message: "لا توجد حقول للتحديث",
  });

export const assignmentCreateSchema = z.object({
  courseId: uuid,
  title: z.string().trim().min(3).max(160),
  instructions: z.string().trim().max(3000).default(""),
  dueAt: z.iso.datetime().optional(),
  maxScore: z.number().int().min(1).max(100).default(10),
});

export const submissionSchema = z.object({
  textAnswer: z.string().trim().min(5, "الإجابة قصيرة جدًا").max(4000),
});

export const gradeSubmissionSchema = z.object({
  score: z.number().int().min(0).max(1000),
});

export const postSchema = z.object({
  body: z.string().trim().min(2, "المنشور قصير جدًا").max(600),
});

export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type ProgressInput = z.infer<typeof progressSchema>;
export type ExamSubmitInput = z.infer<typeof examSubmitSchema>;
export type AdminCourseInput = z.infer<typeof adminCourseSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
