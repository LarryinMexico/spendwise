/**
 * In-memory sliding window rate limiter.
 * 不需要額外套件，利用 Node.js 進程記憶體實現。
 *
 * 注意：Next.js dev 環境每次 hot reload 會重置計數，
 * 生產環境（單一進程）運作正常。
 * 若需要多實例環境，建議換成 Upstash Redis。
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// 每個限制規則的設定
interface RateLimitConfig {
  maxRequests: number; // 時間窗口內最大請求數
  windowMs: number;    // 時間窗口（毫秒）
}

// 各 endpoint 的限制設定
export const RATE_LIMITS = {
  AI_QUERY: { maxRequests: 20, windowMs: 60 * 1000 },        // 每分鐘 20 次
  AI_INTERCEPTOR: { maxRequests: 15, windowMs: 60 * 1000 },  // 每分鐘 15 次
  AI_CATEGORIZE: { maxRequests: 10, windowMs: 60 * 1000 },   // 每分鐘 10 次
  UPLOAD: { maxRequests: 5, windowMs: 60 * 1000 },            // 每分鐘 5 次
} as const;

/**
 * 檢查並記錄請求，回傳是否允許。
 * @param key     限制的 key（通常是 `${endpoint}:${userId}`）
 * @param config  限制規則
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

  // 清除時間窗口外的舊記錄（sliding window）
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    // 計算最早的請求何時過期
    const oldestTimestamp = entry.timestamps[0];
    const retryAfterMs = oldestTimestamp + config.windowMs - now;
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

// 定期清理過期的 key，防止記憶體洩漏（每 5 分鐘）
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // 若最新的 timestamp 超過 5 分鐘，刪除整個 key
      const lastRequest = entry.timestamps[entry.timestamps.length - 1] ?? 0;
      if (now - lastRequest > 5 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
