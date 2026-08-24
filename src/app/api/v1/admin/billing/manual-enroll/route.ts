import { requireApiUser } from "@/lib/auth";
import { ADMIN_ROLES, can } from "@/lib/rbac";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { users, courses, subscriptions, orders, invoices, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toEnvelope } from "@/lib/errors";

const manualEnrollSchema = z.object({
  studentEmail: z.string().email(),
  courseId: z.string().uuid(),
  method: z.enum(["vodafone_cash", "instapay", "center_cash"]).default("center_cash"),
  amountEgp: z.number().min(0).max(100000),
});

export async function POST(request: Request) {
  const auth = await requireApiUser(ADMIN_ROLES);
  if (!("user" in auth)) return err(auth.status, auth.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "منطقة إدارية");
  if (!can(auth.user.role, "admin:write")) return err(403, "FORBIDDEN", "لا تملك صلاحية التفعيل المالي");

  const parsed = await parseJson(request, manualEnrollSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const studentRows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, parsed.data.studentEmail.toLowerCase().trim()))
      .limit(1);

    if (!studentRows[0]) {
      return err(404, "USER_NOT_FOUND", "لم يتم العثور على طالب بهذا البريد الإلكتروني. يرجى تسجيله أولاً.");
    }
    const student = studentRows[0];

    const courseRows = await db
      .select({ id: courses.id, title: courses.title, priceCents: courses.priceCents })
      .from(courses)
      .where(eq(courses.id, parsed.data.courseId))
      .limit(1);

    if (!courseRows[0]) {
      return err(404, "COURSE_NOT_FOUND", "المقرر المطلوب غير موجود");
    }
    const course = courseRows[0];

    const amountCents = Math.round(parsed.data.amountEgp * 100);

    // 1. Create order
    const [order] = await db
      .insert(orders)
      .values({
        userId: student.id,
        courseId: course.id,
        subtotalCents: course.priceCents,
        discountCents: Math.max(0, course.priceCents - amountCents),
        totalCents: amountCents,
        status: "paid",
      })
      .returning({ id: orders.id });

    // 2. Create invoice
    const invNum = `INV-M-${Date.now().toString().slice(-6)}`;
    await db.insert(invoices).values({
      orderId: order.id,
      number: invNum,
      totalCents: amountCents,
    });

    // 3. Create or update subscription
    await db
      .insert(subscriptions)
      .values({
        userId: student.id,
        courseId: course.id,
        orderId: order.id,
        status: "active",
      })
      .onConflictDoNothing();

    // 4. Audit
    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "billing.manual_enroll",
      entity: "subscriptions",
      entityId: order.id,
      meta: {
        studentEmail: student.email,
        courseTitle: course.title,
        amountEgp: parsed.data.amountEgp,
        method: parsed.data.method,
      },
    });

    return ok({
      success: true,
      studentName: student.name,
      courseTitle: course.title,
      invoiceNumber: invNum,
    }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
