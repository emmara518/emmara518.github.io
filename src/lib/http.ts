import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { rateLimit, getClientIp } from "./rate-limit";

/**
 * Uniform API envelope — the single API contract for every /api/v1 route.
 * Success: { ok: true, data } · Failure: { ok: false, error: { code, message } }
 */
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string } };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data } satisfies ApiOk<T>, init);
}

export function err(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } } satisfies ApiErr, { status });
}

/** Rate limit configs per endpoint category */
export const RATE_LIMITS = {
  auth: {
    max: Number(process.env.RATE_LIMIT_AUTH_MAX ?? "5"),
    windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? "900000"),
  },
  api: {
    max: Number(process.env.RATE_LIMIT_API_MAX ?? "100"),
    windowMs: Number(process.env.RATE_LIMIT_API_WINDOW_MS ?? "60000"),
  },
  enroll: {
    max: Number(process.env.RATE_LIMIT_ENROLL_MAX ?? "10"),
    windowMs: Number(process.env.RATE_LIMIT_ENROLL_WINDOW_MS ?? "3600000"),
  },
} as const;

/** Apply rate limit and return 429 response if exceeded, or null if allowed. */
export async function applyRateLimit(
  request: Request,
  category: keyof typeof RATE_LIMITS,
  customKey?: string,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const key = customKey ?? `${category}:${ip}`;
  const { max, windowMs } = RATE_LIMITS[category];
  const { allowed, remaining, resetMs } = await rateLimit(key, max, windowMs);

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "تجاوزت الحد المسموح — حاول لاحقًا" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(resetMs / 1000)),
          "X-RateLimit-Limit": String(max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Date.now() + resetMs),
        },
      },
    );
  }

  // Add rate limit headers to successful responses
  return null;
}

/** Parse a JSON body against a zod contract; returns data or a ready 422 response. */
export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: err(400, "BAD_JSON", "جسم الطلب غير صالح") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      response: err(422, "VALIDATION", first?.message ?? "بيانات غير مكتملة"),
    };
  }
  return { data: parsed.data };
}

/** Parse URL search params against a zod contract. */
export function parseQuery<T>(request: Request, schema: ZodType<T>): T | null {
  const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
