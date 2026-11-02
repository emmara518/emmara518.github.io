import { describe, expect, it } from "vitest";
import {
  computeAttemptExpiry,
  isAttemptExpired,
  isQuestionExpired,
  questionDeadline,
  SUBMIT_GRACE_MS,
} from "@/lib/exam-timing";

describe("exam timing policy", () => {
  const startedAt = new Date("2026-11-02T10:00:00Z");

  it("expires an attempt from the server start time", () => {
    expect(computeAttemptExpiry(startedAt, 30, null).toISOString()).toBe("2026-11-02T10:30:00.000Z");
  });

  it("caps expiry at the exam window end", () => {
    const close = new Date("2026-11-02T10:10:00Z");
    expect(computeAttemptExpiry(startedAt, 30, close).toISOString()).toBe(close.toISOString());
  });

  it("treats the expiry as closed after the small submit grace", () => {
    const expiresAt = new Date("2026-11-02T10:30:00Z");
    expect(isAttemptExpired(expiresAt, new Date("2026-11-02T10:30:04Z"))).toBe(false);
    expect(isAttemptExpired(expiresAt, new Date("2026-11-02T10:30:06Z"))).toBe(true);
    expect(SUBMIT_GRACE_MS).toBeGreaterThan(0);
  });

  it("computes cumulative per-question deadlines from server time", () => {
    expect(questionDeadline(startedAt, 60, 0).toISOString()).toBe("2026-11-02T10:01:05.000Z");
    expect(questionDeadline(startedAt, 60, 4).toISOString()).toBe("2026-11-02T10:05:05.000Z");
  });

  it("rejects an answer after its question deadline", () => {
    const deadline = questionDeadline(startedAt, 60, 0);
    expect(isQuestionExpired(deadline, new Date("2026-11-02T10:01:04Z"))).toBe(false);
    expect(isQuestionExpired(deadline, new Date("2026-11-02T10:01:06Z"))).toBe(true);
  });
});
