import { describe, expect, it } from "vitest";
import { MAX_PROGRESS_SECONDS, mergeWatchedSeconds, normalizeWatchedSeconds } from "@/lib/learning-policy";

describe("video progress policy", () => {
  it("rejects negative and non-finite watched time", () => {
    expect(() => normalizeWatchedSeconds(-1, 600)).toThrow("INVALID_WATCHED_SECONDS");
    expect(() => normalizeWatchedSeconds(Number.NaN, 600)).toThrow("INVALID_WATCHED_SECONDS");
    expect(() => normalizeWatchedSeconds(Number.POSITIVE_INFINITY, 600)).toThrow("INVALID_WATCHED_SECONDS");
  });

  it("rejects fractional and over-24h values", () => {
    expect(() => normalizeWatchedSeconds(1.5, 600)).toThrow("INVALID_WATCHED_SECONDS");
    expect(() => normalizeWatchedSeconds(MAX_PROGRESS_SECONDS + 1, 0)).toThrow("INVALID_WATCHED_SECONDS");
  });

  it("rejects watched time beyond authoritative duration", () => {
    expect(() => normalizeWatchedSeconds(601, 600)).toThrow("EXCESSIVE_WATCHED_SECONDS");
  });

  it("does not complete on zero watch time", () => {
    expect(normalizeWatchedSeconds(0, 600)).toEqual({ watchedSeconds: 0, completed: false });
  });

  it("completes only at or beyond duration", () => {
    expect(normalizeWatchedSeconds(599, 600).completed).toBe(false);
    expect(normalizeWatchedSeconds(600, 600)).toEqual({ watchedSeconds: 600, completed: true });
  });

  it("never decreases stored progress", () => {
    expect(mergeWatchedSeconds(300, 120)).toBe(300);
    expect(mergeWatchedSeconds(300, 420)).toBe(420);
    expect(mergeWatchedSeconds(-10, 20)).toBe(20);
  });
});
