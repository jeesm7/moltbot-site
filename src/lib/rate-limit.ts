// Simple in-memory rate limiter for API routes
// In production, use Redis for distributed rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 60000); // Clean every minute

interface RateLimitConfig {
  interval: number; // milliseconds
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig = { interval: 60000, limit: 60 }
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    // New window
    store.set(key, {
      count: 1,
      resetTime: now + config.interval,
    });
    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.interval,
    };
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// Rate limit by IP (for public endpoints)
export function rateLimitByIP(
  request: Request,
  config?: RateLimitConfig
): RateLimitResult {
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  return rateLimit(`ip:${ip}`, config);
}

// Rate limit by user ID (for authenticated endpoints)
export function rateLimitByUser(
  userId: string,
  config?: RateLimitConfig
): RateLimitResult {
  return rateLimit(`user:${userId}`, config);
}

// Stricter rate limit for auth endpoints
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts
};

// Standard API rate limit
export const API_RATE_LIMIT: RateLimitConfig = {
  interval: 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute
};

// Webhook rate limit (higher)
export const WEBHOOK_RATE_LIMIT: RateLimitConfig = {
  interval: 60 * 1000, // 1 minute
  limit: 200, // 200 requests per minute
};
