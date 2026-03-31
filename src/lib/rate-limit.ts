/**
 * In-memory sliding window rate limiter.
 * No external dependencies — uses Node.js process memory.
 *
 * Note: Next.js dev server hot-reloads will reset counters.
 * Works correctly in production (single-process).
 * For multi-instance deployments, consider Upstash Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxRequests: number; // Max requests per time window
  windowMs: number;    // Time window in milliseconds
}

// Per-endpoint rate limit configurations
export const RATE_LIMITS = {
  AI_QUERY: { maxRequests: 20, windowMs: 60 * 1000 },        // 20 req/min
  AI_INTERCEPTOR: { maxRequests: 15, windowMs: 60 * 1000 },  // 15 req/min
  AI_CATEGORIZE: { maxRequests: 10, windowMs: 60 * 1000 },   // 10 req/min
  UPLOAD: { maxRequests: 5, windowMs: 60 * 1000 },            // 5 req/min
} as const;

/**
 * Check and record a request. Returns whether it is allowed.
 * @param key     Rate limit key (typically `${endpoint}:${userId}`)
 * @param config  Rate limit configuration
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  if (!store.has(key)) {
    store.set(key, { timestamps: [] });
  }

  const entry = store.get(key)!;

  // Evict timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    // Calculate when the oldest request will expire
    const oldestTimestamp = entry.timestamps[0];
    const retryAfterMs = oldestTimestamp + config.windowMs - now;
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

// Periodically clean up expired keys to prevent memory leaks (every 5 min)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      const lastRequest = entry.timestamps[entry.timestamps.length - 1] ?? 0;
      if (now - lastRequest > 5 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
