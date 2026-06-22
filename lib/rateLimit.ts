import { Redis } from "@upstash/redis";
import { readEnv } from "./env";

/**
 * Fixed-window rate limiter (audit findings F-05, F-12).
 *
 * Backed by Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set — required
 * for correctness on serverless (Vercel), where each concurrent instance would
 * otherwise have its own counter, making the limit far weaker than it looks in
 * code. Falls back to an in-memory, process-local counter when unconfigured
 * (fine for local dev / single-instance use, not for serverless production).
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

let redisClient: Redis | null = null;
let redisCheckedAt = 0;

function getRedisClient(): Redis | null {
  // Re-read env vars occasionally rather than only once, so a key set after
  // a cold start (rare, but cheap to allow for) is picked up.
  const now = Date.now();
  if (redisClient || now - redisCheckedAt < 60_000) return redisClient;
  redisCheckedAt = now;

  const url = readEnv("UPSTASH_REDIS_REST_URL");
  const token = readEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;

  redisClient = new Redis({ url, token });
  return redisClient;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (redis) {
    try {
      return await redisRateLimit(redis, key, limit, windowSeconds);
    } catch (e) {
      console.warn("Upstash rate limit error, falling back to in-memory for this request:", e);
    }
  }
  return inMemoryRateLimit(key, limit, windowSeconds);
}

async function redisRateLimit(redis: Redis, key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  if (count > limit) {
    const ttl = await redis.ttl(redisKey);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, ttl) };
  }
  return { allowed: true, remaining: Math.max(0, limit - count), retryAfterSeconds: 0 };
}

// ── In-memory fallback (dev / single-instance / Redis unavailable) ─────────

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function inMemoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Best-effort client IP from standard proxy headers. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Occasionally evict expired in-memory buckets to bound memory.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();
