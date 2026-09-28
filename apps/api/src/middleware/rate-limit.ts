import type { MiddlewareHandler } from 'hono';
import { err } from '../lib/response.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiter(limit = 5, windowMs = 60 * 1000): MiddlewareHandler {
  return async (c, next) => {
    const clientIp =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      '127.0.0.1';

    const now = Date.now();
    const entry = rateLimitMap.get(clientIp);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(clientIp, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (entry.count >= limit) {
      return err(
        c,
        'RATE_LIMIT_EXCEEDED',
        'Too many requests. Please try again after a minute.',
        429
      );
    }

    entry.count += 1;
    return next();
  };
}
