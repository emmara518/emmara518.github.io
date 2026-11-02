import crypto from "node:crypto";
import { requireSuperAdmin } from "@/lib/permission-guard";
import { err, ok, parseJson } from "@/lib/http";
import { z } from "zod";
import { db } from "@/db";
import { users, courses, subscriptions, orders, invoices, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ServiceError, toEnvelope } from "@/lib/errors";

const manualEnrollSchema = z.object({
  studentEmail: z.string().email(),
  courseId: z.string().uuid(),
  method: z.enum(["vodafone_cash", "instapay", "center_cash"]).default("center_cash"),
  amountEgp: z.number().min(0).max(100000),
});

export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("response" in gate) return gate.response;
  const auth = { user: gate.user };

  const parsed = await parseJson(request, manualEnrollSchema);
  if ("response" in parsed) return parsed.response;

  try {
    const result = await db.transaction(async (tx) => {
      const studentRows = await tx
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.email, parsed.data.studentEmail.toLowerCase().trim()))
        .limit(1);
      const student = studentRows[0];
      if (!student) {
        throw new ServiceError(404, "USER_NOT_FOUND", "لم يتم العثور على حساب الطالب");
      }

      const courseRows = await tx
        .select({ id: courses.id, title: courses.title, priceCents: courses.priceCents })
        .from(courses)
        .where(eq(courses.id, parsed.data.courseId))
        .limit(1);
      const course = courseRows[0];
      if (!course) {
        throw new ServiceError(404, "COURSE_NOT_FOUND", "الكورس غير موجود");
      }

      const amountCents = Math.round(parsed.data.amountEgp * 100);
      const [order] = await tx
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

      const invoiceNumber = `INV-M-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
      await tx.insert(invoices).values({
        orderId: order.id,
        number: invoiceNumber,
        totalCents: amountCents,
      });

      await tx
        .insert(subscriptions)
        .values({
          userId: student.id,
          courseId: course.id,
          orderId: order.id,
          status: "active",
        })
        .onConflictDoNothing();

      await tx.insert(auditLogs).values({
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

      return {
        studentName: student.name,
        courseTitle: course.title,
        invoiceNumber,
      };
    });

    return ok({ success: true, ...result }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}
