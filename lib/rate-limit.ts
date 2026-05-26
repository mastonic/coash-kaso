// Simple in-memory rate limiter for beta (suitable for Vercel edge)
// For production: use Vercel KV Store or Redis

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function getRateLimitKey(request: Request): string {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown';
  const endpoint = new URL(request.url).pathname;
  return `${ip}:${endpoint}`;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // First request or window expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(key, { count: 1, resetTime });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime,
    };
  }

  // Within window
  entry.count++;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
  const allowed = entry.count <= RATE_LIMIT_MAX_REQUESTS;

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
  };
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    rateLimitMap.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => rateLimitMap.delete(key));
  }, 5 * 60 * 1000);
}
