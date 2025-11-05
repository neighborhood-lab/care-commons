import type { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * For production with multiple instances, consider using:
 * - express-rate-limit with Redis store (for distributed rate limiting)
 * - Upstash Rate Limit (serverless-friendly)
 *
 * @see https://www.npmjs.com/package/express-rate-limit
 * @see https://upstash.com/docs/redis/features/ratelimiting
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// NOTE: This will be reset when the serverless function cold-starts
// For production, use Redis or similar distributed store
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Error message when rate limit exceeded
  standardHeaders?: boolean; // Add RateLimit-* headers
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skip?: (req: Request) => boolean; // Skip rate limiting for certain requests
}

/**
 * Create a rate limiting middleware
 *
 * @param options - Rate limit configuration
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // Limit authentication endpoints to 5 requests per 15 minutes
 * app.use('/api/auth', createRateLimiter({
 *   windowMs: 15 * 60 * 1000,
 *   max: 5,
 *   message: 'Too many login attempts, please try again later'
 * }));
 * ```
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    standardHeaders = true,
    skipSuccessfulRequests = false,
    skip,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip if skip function returns true
    if (skip && skip(req)) {
      return next();
    }

    // Get client identifier (IP address or authenticated user ID)
    const identifier =
      req.ip || req.socket.remoteAddress || 'unknown';

    // Create key for this endpoint and identifier
    const key = `${req.path}:${identifier}`;

    const now = Date.now();

    // Initialize or get existing rate limit data
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const { count, resetTime } = store[key];

    // Increment request count
    store[key].count++;

    // Calculate remaining requests
    const remaining = Math.max(0, max - count - 1);

    // Add standard rate limit headers if enabled
    if (standardHeaders) {
      res.setHeader('RateLimit-Limit', max.toString());
      res.setHeader('RateLimit-Remaining', remaining.toString());
      res.setHeader('RateLimit-Reset', new Date(resetTime).toISOString());
    }

    // Check if rate limit exceeded
    if (count >= max) {
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      });
      return;
    }

    // If skipSuccessfulRequests is enabled, decrement count on successful response
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function (body: unknown) {
        if (res.statusCode < 400) {
          store[key].count--;
        }
        return originalSend.call(this, body);
      };
    }

    next();
  };
}

/**
 * Preset rate limiters for common use cases
 */

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  skip: (req) => req.path === '/health', // Skip health checks
});

/**
 * Moderate rate limiter for API endpoints
 * 100 requests per minute
 */
export const apiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many API requests, please slow down',
  standardHeaders: true,
});

/**
 * Relaxed rate limiter for public endpoints
 * 300 requests per minute
 */
export const publicLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
});

/**
 * Very strict rate limiter for sensitive operations
 * 3 requests per hour
 */
export const sensitiveLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many attempts for this sensitive operation',
  standardHeaders: true,
});

/**
 * NOTE: For production deployments with multiple serverless instances,
 * consider using express-rate-limit with a Redis store:
 *
 * ```typescript
 * import rateLimit from 'express-rate-limit';
 * import RedisStore from 'rate-limit-redis';
 * import { Redis } from 'ioredis';
 *
 * const redis = new Redis(process.env.REDIS_URL);
 *
 * export const authLimiter = rateLimit({
 *   windowMs: 15 * 60 * 1000,
 *   max: 5,
 *   store: new RedisStore({
 *     client: redis,
 *     prefix: 'rl:auth:',
 *   }),
 * });
 * ```
 *
 * Or use Upstash Rate Limit for serverless environments:
 * @see https://upstash.com/docs/redis/features/ratelimiting
 */
