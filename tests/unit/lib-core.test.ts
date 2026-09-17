import { describe, it, expect } from "vitest";
import { formatEGP, formatDuration, formatDate, formatDateTime, timeAgo, TXN_KIND_LABELS, hueFromId } from "@/lib/format";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/rate-limit";

describe("formatEGP — money in integer cents", () => {
  it("0 cents → 0 ج.م", () => expect(formatEGP(0)).toBe("0 ج.م"));
  it("25000 cents → 250 ج.م", () => expect(formatEGP(25000)).toBe("250 ج.م"));
  it("1250000 cents → 12,500 ج.م (thousands separator)", () => expect(formatEGP(1250000)).toBe("12,500 ج.م"));
  it("25050 cents → 250.50 ج.م (fraction)", () => expect(formatEGP(25050)).toBe("250.50 ج.م"));
  it("50 cents → 0.50 ج.م", () => expect(formatEGP(50)).toBe("0.50 ج.م"));
  it("99 cents → 0.99 ج.م", () => expect(formatEGP(99)).toBe("0.99 ج.م"));
});

describe("formatDuration", () => {
  it("0s → 0 دقيقة", () => expect(formatDuration(0)).toBe("0 دقيقة"));
  it("59s → 1 دقيقة (rounds)", () => expect(formatDuration(59)).toBe("1 دقيقة"));
  it("600s → 10 دقيقة", () => expect(formatDuration(600)).toBe("10 دقيقة"));
  it("3599s rounds up to 1 ساعة (documented behavior)", () => expect(formatDuration(3599)).toBe("1 ساعة"));
  it("3600s → 1 ساعة", () => expect(formatDuration(3600)).toBe("1 ساعة"));
  it("5400s → 1 س 30 د", () => expect(formatDuration(5400)).toBe("1 س 30 د"));
  it("7200s → 2 ساعة", () => expect(formatDuration(7200)).toBe("2 ساعة"));
});

describe("formatDate / formatDateTime", () => {
  it("null/undefined → em dash", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
  });
  it("produces Arabic output (ar-EG uses Arabic-Indic digits)", () => {
    expect(formatDate("2026-01-15T00:00:00Z")).toContain("٢٠٢٦");
    expect(formatDateTime(new Date("2026-03-01T10:30:00Z"))).toBeTruthy();
  });
  it("does not throw on invalid strings (shows Invalid Date)", () => {
    expect(() => formatDate("garbage")).not.toThrow();
  });
});

describe("timeAgo", () => {
  it("future/now → «الآن»", () => {
    expect(timeAgo(new Date(Date.now() - 10_000))).toBe("الآن");
  });
  it("minutes ago", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60_000))).toBe("منذ 5 دقيقة");
  });
  it("hours ago", () => {
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000))).toBe("منذ 3 ساعة");
  });
  it("days ago", () => {
    expect(timeAgo(new Date(Date.now() - 2 * 86400_000))).toBe("منذ 2 يوم");
  });
  it("older than 30d → formatted date", () => {
    const out = timeAgo(new Date(Date.now() - 60 * 86400_000));
    expect(out).not.toContain("منذ");
    expect(out).not.toBe("الآن");
  });
});

describe("TXN_KIND_LABELS", () => {
  it("covers all wallet kinds with Arabic labels", () => {
    expect(TXN_KIND_LABELS["topup"]).toBe("شحن رصيد");
    expect(TXN_KIND_LABELS["grant"]).toBe("شحن بكود");
    expect(TXN_KIND_LABELS["purchase"]).toBe("شراء كورس");
    expect(TXN_KIND_LABELS["refund"]).toBe("استرداد");
  });
});

describe("hueFromId — deterministic generative hue", () => {
  it("deterministic for same id", () => {
    expect(hueFromId("abc")).toBe(hueFromId("abc"));
  });
  it("different ids differ (at least usually)", () => {
    const a = hueFromId("course-a");
    const b = hueFromId("course-b");
    expect(a).not.toBe(b);
  });
  it("always in [0, 360)", () => {
    for (const id of ["", "a", "very-long-course-identifier-123456", "⚽", "x".repeat(1000)]) {
      const h = hueFromId(id);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    }
  });
});

describe("auth — bcrypt hashing (cost 12)", () => {
  it("hashes and verifies", async () => {
    const h = await hashPassword("Secret123!");
    expect(h).not.toContain("Secret123!");
    expect(h.startsWith("$2")).toBe(true);
    expect(await verifyPassword("Secret123!", h)).toBe(true);
    expect(await verifyPassword("WrongPass", h)).toBe(false);
  });
  it("empty password still round-trips but verifies false against other", async () => {
    const h = await hashPassword("");
    expect(await verifyPassword("", h)).toBe(true);
    expect(await verifyPassword("x", h)).toBe(false);
  });
  it("unicode password round-trip", async () => {
    const h = await hashPassword("كلمة-سر-قوية-٣٢١");
    expect(await verifyPassword("كلمة-سر-قوية-٣٢١", h)).toBe(true);
  });
  it("hashes differ across calls (unique salt)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });
  it("tampered hash fails", async () => {
    const h = await hashPassword("Secret123!");
    const tampered = h.slice(0, -2) + "zz";
    expect(await verifyPassword("Secret123!", tampered)).toBe(false);
  });
});

describe("rate-limit parsePositiveInt — fail-secure fallback", () => {
  const fb = 20;
  it("valid values parse", () => {
    expect(parsePositiveInt("10", fb)).toBe(10);
    expect(parsePositiveInt(" 15 ", fb)).toBe(15);
    expect(parsePositiveInt("20.9", fb)).toBe(20);
  });
  it("missing/empty → fallback", () => {
    expect(parsePositiveInt(undefined, fb)).toBe(fb);
    expect(parsePositiveInt(null as unknown as string, fb)).toBe(fb);
    expect(parsePositiveInt("", fb)).toBe(fb);
    expect(parsePositiveInt("   ", fb)).toBe(fb);
  });
  it("garbage → fallback", () => {
    expect(parsePositiveInt("abc", fb)).toBe(fb);
    expect(parsePositiveInt("NaN", fb)).toBe(fb);
    expect(parsePositiveInt("Infinity", fb)).toBe(fb);
  });
  it("<=0 or negative → fallback (never disables limiter)", () => {
    expect(parsePositiveInt("0", fb)).toBe(fb);
    expect(parsePositiveInt("-5", fb)).toBe(fb);
  });
  it("honors min/max bounds", () => {
    expect(parsePositiveInt("1", fb, { min: 5 })).toBe(fb);
    expect(parsePositiveInt("5", fb, { min: 5 })).toBe(5);
    expect(parsePositiveInt("99999", fb, { max: 100 })).toBe(fb);
    expect(parsePositiveInt("100", fb, { max: 100 })).toBe(100);
  });
});
