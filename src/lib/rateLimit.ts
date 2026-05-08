/**
 * Simple in-memory rate limiter.
 * Works fine for a single-instance server (MVP/dev).
 * For multi-instance production, replace backing store with Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check and increment the rate limit for a given key (typically IP + route).
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request in this window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

/**
 * Extract the client IP from a Next.js Request.
 * Respects X-Forwarded-For when behind a proxy/CDN.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Fall back to a generic key so the limiter still works
  return 'unknown';
}
