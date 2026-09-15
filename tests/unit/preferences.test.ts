import { describe, it, expect } from "vitest";
import { DEFAULT_PREFERENCES, rowToPreferences } from "@/lib/services/preferences.service";

describe("preferences defaults", () => {
  it("defaults to comfortable density with marketing off", () => {
    expect(DEFAULT_PREFERENCES.density).toBe("comfortable");
    expect(DEFAULT_PREFERENCES.notifications).toEqual({
      community: true,
      examResults: true,
      wallet: true,
      marketing: false,
    });
  });

  it("missing row maps to defaults", () => {
    expect(rowToPreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
  });
});

describe("preferences row mapping", () => {
  const base = {
    userId: "00000000-0000-0000-0000-000000000000",
    density: "compact",
    notifCommunity: false,
    notifExamResults: true,
    notifWallet: false,
    notifMarketing: true,
    updatedAt: new Date(),
  };

  it("maps a full row exactly", () => {
    expect(rowToPreferences(base)).toEqual({
      density: "compact",
      notifications: { community: false, examResults: true, wallet: false, marketing: true },
    });
  });

  it("falls back per-field on nulls", () => {
    const row = { ...base, density: null, notifCommunity: null, notifMarketing: null } as any;
    const out = rowToPreferences(row);
    expect(out.density).toBe("comfortable");
    expect(out.notifications.community).toBe(true);
    expect(out.notifications.marketing).toBe(false);
    expect(out.notifications.examResults).toBe(true);
  });

  it("treats unknown density as comfortable", () => {
    expect(rowToPreferences({ ...base, density: "ultra" }).density).toBe("comfortable");
    expect(rowToPreferences({ ...base, density: "comfortable" }).density).toBe("comfortable");
  });
});
