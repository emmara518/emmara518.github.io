import { createClient } from "redis";

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

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const redis = getRedisClient();
  if (!redis) {
    // No Redis configured — allow but log in development
    if (process.env.NODE_ENV !== "production") {
      console.warn("[rate-limit] Redis not configured — allowing request");
    }
    return { allowed: true, remaining: max, resetMs: windowMs };
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