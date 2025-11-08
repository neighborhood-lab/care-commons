import type { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiter with Redis support for distributed environments
 * Falls back to in-memory if Redis is not configured
 *
 * Production: Uses Upstash Redis for distributed rate limiting across serverless instances
 * Development: Uses in-memory store for simplicity
 *
 * @see https://upstash.com/docs/redis/features/ratelimiting
 */

// Initialize Redis client for distributed rate limiting (production)
let redis: Redis | null = null;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl !== undefined && redisUrl !== '' && redisToken !== undefined && redisToken !== '') {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    console.log('✅ Upstash Redis connected for distributed rate limiting');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Upstash Redis, falling back to in-memory rate limiting:', error);
    redis = null;
  }
} else {
  console.log('ℹ️ Using in-memory rate limiting (Redis not configured)');
}

// In-memory fallback store for rate limiting
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const inMemoryStore: RateLimitStore = {};

// Cleanup old entries every 5 minutes (only for in-memory store)
if (redis === null) {
  setInterval(() => {
    const now = Date.now();
    for (const key in inMemoryStore) {
      const entry = inMemoryStore[key];
      if (entry !== undefined && entry.resetTime < now) {
        delete inMemoryStore[key];
      }
    }
  }, 5 * 60 * 1000);
}

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
/**
 * Handle Redis-based rate limiting
 */
async function handleRedisRateLimit(
  upstashLimiter: Ratelimit,
  key: string,
  message: string,
  standardHeaders: boolean,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { success, limit, remaining, reset } = await upstashLimiter.limit(key);

  if (standardHeaders) {
    res.setHeader('RateLimit-Limit', limit.toString());
    res.setHeader('RateLimit-Remaining', remaining.toString());
    res.setHeader('RateLimit-Reset', new Date(reset).toISOString());
  }

  if (!success) {
    res.status(429).json({
      error: 'Too Many Requests',
      message,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    });
    return;
  }

  next();
}

/**
 * Handle in-memory rate limiting
 */
function handleInMemoryRateLimit(
  key: string,
  windowMs: number,
  max: number,
  message: string,
  standardHeaders: boolean,
  skipSuccessfulRequests: boolean,
  res: Response,
  next: NextFunction,
): void {
  const now = Date.now();

  // Initialize or get existing rate limit data
  const existingEntry = inMemoryStore[key];
  if (existingEntry === undefined || existingEntry.resetTime < now) {
    inMemoryStore[key] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  const entry = inMemoryStore[key]!;
  const { count, resetTime } = entry;

  // Increment request count
  entry.count++;

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
      const entry = inMemoryStore[key];
      if (res.statusCode < 400 && entry !== undefined) {
        entry.count--;
      }
      return originalSend.call(this, body);
    };
  }

  next();
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    standardHeaders = true,
    skipSuccessfulRequests = false,
    skip,
  } = options;

  // Create Upstash Ratelimit instance if Redis is available
  const upstashLimiter = redis !== null
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`),
        analytics: true,
        prefix: 'rl',
      })
    : null;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip if skip function returns true
    if (skip?.(req) === true) {
      return next();
    }

    // Get client identifier (IP address or authenticated user ID)
    const identifier = req.ip ?? req.socket.remoteAddress ?? 'unknown';

    // Create key for this endpoint and identifier
    const key = `${req.path}:${identifier}`;

    try {
      if (upstashLimiter !== null) {
        await handleRedisRateLimit(upstashLimiter, key, message, standardHeaders, res, next);
      } else {
        handleInMemoryRateLimit(key, windowMs, max, message, standardHeaders, skipSuccessfulRequests, res, next);
      }
    } catch (error) {
      // On Redis errors, fall back to allowing the request
      console.error('Rate limiter error:', error);
      next();
    }
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
 * Production Configuration:
 *
 * To enable distributed rate limiting in production, set these environment variables:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis REST token
 *
 * Get these from: https://console.upstash.com
 *
 * Without Redis configuration, the rate limiter falls back to in-memory storage,
 * which works for single-instance deployments but not for serverless environments
 * with multiple concurrent instances.
 */
