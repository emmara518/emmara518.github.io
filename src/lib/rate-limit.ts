import { createClient } from "redis";
import { pool } from "@/db";

const globalForRedis = globalThis as typeof globalThis & {
  __redis?: ReturnType<typeof createClient>;
};

function getRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (globalForRedis.__redis) return globalForRedis.__redis;

  const client = createClient({ url });
  client.on("error", (err) => console.error("[redis] error:", err));
  client.connect().catch((err) => console.error("[redis] connect failed:", err));
  globalForRedis.__redis = client;
  return client;
}

/**
 * Parse a positive integer environment value safely.
 * Invalid input (missing, empty, NaN, <= 0, out of range) returns the
 * secure fallback so rate limiting can NEVER be silently disabled by a
 * misconfigured environment variable (e.g. an empty string would otherwise
 * become 0 and turn the sliding window off).
 */
export function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  opts?: { min?: number; max?: number },
): number {
  const min = opts?.min ?? 1;
  const max = opts?.max ?? Number.MAX_SAFE_INTEGER;
  if (raw === undefined || raw === null) return fallback;
  const trimmed = String(raw).trim();
  if (trimmed === "") return fallback;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return fallback;
  const value = Math.floor(n);
  if (value < min || value > max) return fallback;
  return value;
}

/* ── Postgres fallback backend ──────────────────────────────────────────────
 * When REDIS_URL is absent the limiter must still protect production.
 * Uses the application's existing Postgres pool: a sliding window of hit
 * timestamps per key. Table is created lazily (matches the SCHEMA_SQL
 * boot pattern in db/init-sql.ts). Failure of this backend fails OPEN so a
 * limiter outage can never lock users out of the platform. */

const globalForRL = globalThis as typeof globalThis & {
  __rlTableReady?: boolean;
};

const MAX_KEY_LENGTH = 256;

async function ensureRateLimitTable(): Promise<void> {
  if (globalForRL.__rlTableReady) return;
  await pool!.query(
    "CREATE TABLE IF NOT EXISTS rate_limit_hits (key text NOT NULL, ts bigint NOT NULL)",
  );
  await pool!.query(
    "CREATE INDEX IF NOT EXISTS rate_limit_hits_key_ts_idx ON rate_limit_hits (key, ts)",
  );
  globalForRL.__rlTableReady = true;
}

async function dbRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  if (!pool) {
    // No external Postgres pool (embedded dev database) — no backend available.
    return { allowed: true, remaining: max, resetMs: windowMs };
  }
  try {
    await ensureRateLimitTable();
    const now = Date.now();
    const windowStart = now - windowMs;
    const safeKey = key.slice(0, MAX_KEY_LENGTH);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM rate_limit_hits WHERE key = $1 AND ts <= $2", [
        safeKey,
        windowStart,
      ]);
      await client.query("INSERT INTO rate_limit_hits (key, ts) VALUES ($1, $2)", [
        safeKey,
        now,
      ]);
      const { rows } = await client.query(
        "SELECT count(*)::int AS c FROM rate_limit_hits WHERE key = $1 AND ts > $2",
        [safeKey, windowStart],
      );
      await client.query("COMMIT");
      const count = rows[0]?.c ?? 0;
      return {
        allowed: count <= max,
        remaining: Math.max(0, max - count),
        resetMs: windowMs,
      };
    } finally {
      client.release();
    }
  } catch (e) {
    console.warn("[rate-limit] DB backend error — allowing request:", e instanceof Error ? e.message : e);
    return { allowed: true, remaining: max, resetMs: windowMs };
  }
}

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const redis = getRedisClient();
  if (!redis) {
    if (process.env.NODE_ENV !== "production") {
      // Dev convenience: embedded database has no pool → limiter is inert.
      console.warn("[rate-limit] Redis not configured — using Postgres fallback");
    }
    return dbRateLimit(key, max, windowMs);
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  // Remove expired entries, add current, count, set expiry
  const multi = redis.multi();
  multi.zRemRangeByScore(redisKey, 0, windowStart);
  multi.zAdd(redisKey, { score: now, value: `${now}:${Math.random()}` });
  multi.zCard(redisKey);
  multi.pExpire(redisKey, windowMs);
  const results = await multi.exec();

  const count = results[2] as number;
  const allowed = count <= max;
  const remaining = Math.max(0, max - count);

  return { allowed, remaining, resetMs: windowMs };
}

export function getClientIp(request: Request): string {
  // Vercel / Cloudflare / standard headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
