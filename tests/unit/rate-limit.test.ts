import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  result: { allowed: true, remaining: 5, resetMs: 60_000, backendError: false },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => state.result),
  getClientIp: () => "test-ip",
  parsePositiveInt: (_raw: string | undefined, fallback: number) => fallback,
}));

import { applyRateLimit } from "@/lib/http";

describe("rate-limit HTTP responses", () => {
  beforeEach(() => {
    state.result = { allowed: true, remaining: 5, resetMs: 60_000, backendError: false };
  });

  it("allows requests under the limit", async () => {
    await expect(applyRateLimit(new Request("http://localhost/test"), "auth")).resolves.toBeNull();
  });

  it("returns 429 with retry metadata when the limit is exceeded", async () => {
    state.result = { allowed: false, remaining: 0, resetMs: 90_000, backendError: false };
    const response = await applyRateLimit(new Request("http://localhost/test"), "auth");
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("90");
    expect(response?.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(response?.headers.get("X-RateLimit-Remaining")).toBe("0");
    await expect(response?.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "RATE_LIMITED" },
    });
  });

  it("fails closed for sensitive routes when the backend is unavailable", async () => {
    state.result = { allowed: true, remaining: 5, resetMs: 60_000, backendError: true };
    const response = await applyRateLimit(
      new Request("http://localhost/test"),
      "auth",
      undefined,
      { failClosed: true },
    );
    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "RATE_LIMIT_UNAVAILABLE" },
    });
  });

  it("fails closed when the backend is unavailable", async () => {
    state.result = { allowed: true, remaining: 5, resetMs: 60_000, backendError: true };
    const response = await applyRateLimit(new Request("http://localhost/test"), "auth");
    expect(response?.status).toBe(503);
  });
});
