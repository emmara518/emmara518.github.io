import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("release hardening invariants", () => {
  it("uses an atomic wallet debit and coupon reservation", () => {
    const billing = read("src/lib/services/billing.service.ts");
    expect(billing).toContain("walletAccounts.balanceCents} >= ${totalCents}");
    expect(billing).toContain("reserveCoupon");
    expect(billing).toContain("db.transaction");
    expect(billing).toContain("crypto.randomUUID");
  });

  it("manual enrollment is transactional and uses collision-resistant invoices", () => {
    const route = read("src/app/api/v1/admin/billing/manual-enroll/route.ts");
    expect(route).toContain("db.transaction");
    expect(route).toContain("crypto.randomUUID");
    expect(route).toContain("ALREADY_ENROLLED");
    expect(route).not.toContain("onConflictDoNothing()");
    expect(route).not.toContain("Date.now().toString().slice(-6)");
  });

  it("video completion is server-derived and sequence-checked", () => {
    const dashboard = read("src/lib/services/dashboard.service.ts");
    expect(dashboard).toContain("normalizeWatchedSeconds");
    expect(dashboard).toContain("SEQUENCE_LOCKED");
    expect(dashboard).toContain("FOR UPDATE");
    expect(dashboard).not.toContain("completedAt: completed ?");
  });

  it("exam submission is locked, validates question ownership, and is transactional", () => {
    const exams = read("src/lib/services/exams.service.ts");
    expect(exams).toContain("FOR UPDATE");
    expect(exams).toContain("INVALID_ANSWERS");
    expect(exams).toContain("db.transaction");
    expect(exams).toContain("EXAM_NOT_STARTED");
    expect(exams).toContain("EXAM_TIME_EXPIRED");
    expect(exams).toContain("ATTEMPT_ALREADY_SUBMITTED");
    expect(exams).toContain("examAttemptStarts");
  });

  it("session tokens are hashed at rest", () => {
    const auth = read("src/lib/auth.ts");
    expect(auth).toContain("hashSessionToken");
    expect(auth).toContain("token: hashSessionToken(token)");
    expect(auth).toContain("hashSessionToken(token)");
  });

  it("production database initialization fails closed", () => {
    const db = read("src/db/index.ts");
    expect(db).toContain("dbInitError");
    expect(db).toContain("refusing embedded fallback");
    expect(db).toContain("rejectUnauthorized: true");
    expect(db).toContain("process.env.NODE_ENV !== \"production\"");
  });

  it("rate limiting fails closed on backend errors", () => {
    const http = read("src/lib/http.ts");
    expect(http).toContain("if (backendError)");
    expect(http).toContain("RATE_LIMIT_UNAVAILABLE");
  });
});
