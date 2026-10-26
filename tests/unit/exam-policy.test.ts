import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_ATTEMPTS,
  effectiveMaxAttempts,
  shouldRevealResults,
} from "@/lib/exam-policy";

describe("Phase B — exam policy", () => {
  it("applies a finite default when maxAttempts is null", () => {
    expect(DEFAULT_MAX_ATTEMPTS).toBe(5);
    expect(effectiveMaxAttempts(null)).toBe(5);
    expect(effectiveMaxAttempts(undefined)).toBe(5);
    expect(effectiveMaxAttempts(2)).toBe(2);
  });

  it("reveals answers only when configured or after the window", () => {
    const now = new Date("2026-10-26T12:00:00Z");
    expect(shouldRevealResults(true, null, now)).toBe(true);
    expect(shouldRevealResults(false, null, now)).toBe(false);
    expect(shouldRevealResults(false, new Date("2026-10-26T13:00:00Z"), now)).toBe(false);
    expect(shouldRevealResults(false, new Date("2026-10-26T11:00:00Z"), now)).toBe(true);
  });
});
