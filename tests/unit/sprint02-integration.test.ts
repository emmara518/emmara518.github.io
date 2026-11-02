import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

let db: any;
let schema: any;
let examsService: any;
let dashboardService: any;
let billingService: any;
let ServiceError: any;
let auth: any;

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "dros-sprint02-"));

beforeAll(async () => {
  (process.env as any).NODE_ENV = "test";
  process.env.PGLITE_DATA_DIR = dataDir;
  process.env.DEMO_SEED_PASSWORD = "sprint02-test-password";
  process.env.MASTER_ADMIN_PASSWORD = "sprint02-admin-password";

  const dbModule = await import("@/db");
  db = dbModule.db;
  await dbModule.ensureDbReady();
  schema = await import("@/db/schema");
  examsService = await import("@/lib/services/exams.service");
  dashboardService = await import("@/lib/services/dashboard.service");
  billingService = await import("@/lib/services/billing.service");
  ServiceError = (await import("@/lib/errors")).ServiceError;
  auth = await import("@/lib/auth");
}, 60_000);

async function seededStudent() {
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, "student@dros-math.com")).limit(1);
  if (!rows[0]) throw new Error("Seeded student missing");
  return rows[0];
}

afterAll(async () => {
  // PGlite keeps the directory open for the process lifetime. Do not delete
  // while the worker is still running.
  expect(fs.existsSync(dataDir)).toBe(true);
});

describe("Sprint 02 integration â€” isolated PGlite", () => {
  it("persists one authoritative exam start and rejects repeated submission", async () => {
    const student = await seededStudent();
    const exam = (await db.select().from(schema.exams).limit(1))[0];

    const room = await examsService.getExamRoom(exam.id, student.id);
    const resumed = await examsService.getExamRoom(exam.id, student.id);
    expect(resumed.attemptStart.id).toBe(room.attemptStart.id);
    expect(room.questions.length).toBeGreaterThan(0);

    const invalid = await examsService
      .submitAttempt(exam.id, student.id, [{ questionId: "00000000-0000-4000-8000-000000000000", choiceIndex: 0 }])
      .catch((error: any) => error);
    expect(invalid).toBeInstanceOf(ServiceError);
    expect(invalid.code).toBe("INVALID_ANSWERS");

    const result = await examsService.submitAttempt(exam.id, student.id, []);
    expect(result.attemptId).toBeTruthy();
    const repeated = await examsService.submitAttempt(exam.id, student.id, []).catch((error: any) => error);
    expect(repeated).toBeInstanceOf(ServiceError);
    expect(repeated.code).toBe("ATTEMPT_ALREADY_SUBMITTED");
  });

  it("rejects an attempt after the server-owned expiry and permits a fresh start", async () => {
    const student = await seededStudent();
    const exam = (await db.select().from(schema.exams).limit(1))[0];
    const room = await examsService.getExamRoom(exam.id, student.id);

    await db
      .update(schema.examAttemptStarts)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(schema.examAttemptStarts.id, room.attemptStart.id));

    const expired = await examsService.submitAttempt(exam.id, student.id, []).catch((error: any) => error);
    expect(expired).toBeInstanceOf(ServiceError);
    expect(expired.code).toBe("EXAM_TIME_EXPIRED");

    const fresh = await examsService.getExamRoom(exam.id, student.id);
    expect(fresh.attemptStart.id).not.toBe(room.attemptStart.id);
    const submitted = await examsService.submitAttempt(exam.id, student.id, []);
    expect(submitted.attemptId).toBeTruthy();
  });

  it("serializes concurrent submissions of the same attempt", async () => {
    const student = await seededStudent();
    const exam = (await db.select().from(schema.exams).limit(1))[0];
    await examsService.getExamRoom(exam.id, student.id);
    const results = await Promise.allSettled([
      examsService.submitAttempt(exam.id, student.id, []),
      examsService.submitAttempt(exam.id, student.id, []),
    ]);
    const fulfilled = results.filter((r: any) => r.status === "fulfilled");
    const rejected = results.filter((r: any) => r.status === "rejected");
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(["ATTEMPT_ALREADY_SUBMITTED", "ATTEMPTS_EXHAUSTED"]).toContain((rejected[0] as any).reason.code);
  });

  it("upgrades a legacy plaintext session on first use without breaking the cookie", async () => {
    const student = await seededStudent();
    const raw = "legacy-session-token-".padEnd(43, "x");
    await db.insert(schema.sessions).values({ token: raw, userId: student.id, expiresAt: new Date(Date.now() + 60_000) });

    const resolved = await auth.resolveSessionUser(raw);
    expect(resolved?.id).toBe(student.id);
    const rows = await db.select({ token: schema.sessions.token }).from(schema.sessions).where(eq(schema.sessions.userId, student.id));
    expect(rows.some((row: any) => row.token === auth.hashSessionToken(raw))).toBe(true);
    expect(rows.some((row: any) => row.token === raw)).toBe(false);
    expect((await auth.resolveSessionUser(raw))?.id).toBe(student.id);
  });

  it("rejects impossible video progress and never trusts the completed flag", async () => {
    const student = await seededStudent();
    const course = (await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.slug, "algebra-1sec-term1"))
      .limit(1))[0];
    const videos = await db
      .select({
        id: schema.videos.id,
        durationSec: schema.videos.durationSec,
      })
      .from(schema.videos)
      .innerJoin(schema.lessons, eq(schema.videos.lessonId, schema.lessons.id))
      .where(eq(schema.lessons.courseId, course.id));
    const done = await db
      .select({ videoId: schema.studentProgress.videoId })
      .from(schema.studentProgress)
      .where(eq(schema.studentProgress.userId, student.id));
    const doneIds = new Set(done.map((row: any) => row.videoId));
    const video = videos.find((v: any) => v.durationSec > 0 && !doneIds.has(v.id));
    expect(video).toBeTruthy();

    const zero = await dashboardService.markVideoProgress(student.id, video.id, 0, true);
    expect(zero.completed).toBe(false);

    const negative = await dashboardService
      .markVideoProgress(student.id, video.id, -1, true)
      .catch((error: any) => error);
    expect(negative.code).toBe("INVALID_WATCHED_SECONDS");

    const excessive = await dashboardService
      .markVideoProgress(student.id, video.id, video.durationSec + 1, true)
      .catch((error: any) => error);
    expect(excessive.code).toBe("EXCESSIVE_WATCHED_SECONDS");

    const completed = await dashboardService.markVideoProgress(student.id, video.id, video.durationSec, false);
    expect(completed.completed).toBe(true);
  });

  it("honors the final coupon redemption and rejects the next student", async () => {
    const code = `SPRINT02-${Date.now()}`;
    await db.insert(schema.coupons).values({
      code,
      kind: "course_percent",
      percentOff: 10,
      maxUses: 1,
      isActive: true,
    });
    const course = (await db.select().from(schema.courses).limit(1))[0];

    async function newStudent(label: string) {
      const [user] = await db
        .insert(schema.users)
        .values({ email: `${label}.${Date.now()}${Math.random()}@test.local`, passwordHash: "x", name: label, role: "student", isActive: true })
        .returning({ id: schema.users.id });
      await db.insert(schema.walletAccounts).values({ userId: user.id, balanceCents: 100_000 });
      return user.id;
    }

    const first = await newStudent("coupon-one");
    const second = await newStudent("coupon-two");
    const ok = await billingService.purchaseCourse(first, course.id, code);
    expect(ok.totalCents).toBeLessThan(course.priceCents);

    const rejected = await billingService.purchaseCourse(second, course.id, code).catch((error: any) => error);
    expect(rejected).toBeInstanceOf(ServiceError);
    expect(["CODE_EXHAUSTED", "INVALID_COUPON"]).toContain(rejected.code);

    const [coupon] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, code));
    expect(coupon.usedCount).toBe(1);
  });

  it("blocks unsubscribed and out-of-order completion", async () => {
    const student = await seededStudent();
    const course = (await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.slug, "algebra-1sec-term1"))
      .limit(1))[0];
    await db.update(schema.courses).set({ requireSequentialProgress: true }).where(eq(schema.courses.id, course.id));
    const videos = await db
      .select({ id: schema.videos.id, durationSec: schema.videos.durationSec })
      .from(schema.videos)
      .innerJoin(schema.lessons, eq(schema.videos.lessonId, schema.lessons.id))
      .where(eq(schema.lessons.courseId, course.id));
    const target = videos[videos.length - 1];

    const outOfOrder = await dashboardService
      .markVideoProgress(student.id, target.id, target.durationSec, true)
      .catch((error: any) => error);
    expect(outOfOrder.code).toBe("SEQUENCE_LOCKED");

    const outsider = await db
      .insert(schema.users)
      .values({ email: `outsider.${Date.now()}@test.local`, passwordHash: "x", name: "Outsider", role: "student", isActive: true })
      .returning({ id: schema.users.id });
    const notEnrolled = await dashboardService
      .markVideoProgress(outsider[0].id, target.id, 0, false)
      .catch((error: any) => error);
    expect(notEnrolled.code).toBe("NOT_ENROLLED");
  });

  it("keeps wallet balance non-negative under two competing purchases", async () => {
    const email = `sprint02.fin.${Date.now()}@test.local`;
    const [user] = await db
      .insert(schema.users)
      .values({ email, passwordHash: "x", name: "Sprint 02 Finance", role: "student", isActive: true })
      .returning({ id: schema.users.id });
    const courses = await db.select({ id: schema.courses.id, priceCents: schema.courses.priceCents }).from(schema.courses).limit(2);
    const startingBalance = Math.min(...courses.map((c: any) => c.priceCents));
    await db.insert(schema.walletAccounts).values({ userId: user.id, balanceCents: startingBalance });
    const results = await Promise.allSettled([
      billingService.purchaseCourse(user.id, courses[0].id),
      billingService.purchaseCourse(user.id, courses[1].id),
    ]);
    const fulfilled = results.filter((r: any) => r.status === "fulfilled");
    expect(fulfilled.length).toBe(1);
    const wallet = await billingService.getWalletSummary(user.id);
    expect(wallet.balanceCents).toBeGreaterThanOrEqual(0);
    const paid = (fulfilled[0] as any).value.totalCents;
    expect(wallet.balanceCents).toBe(startingBalance - paid);
  });
});
