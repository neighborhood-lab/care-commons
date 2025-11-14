import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';
import type { Request } from 'express';

// Redis client for distributed rate limiting (optional, fallback to memory)
let redisClient: ReturnType<typeof Redis.createClient> | null = null;

const initRedis = async (): Promise<void> => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl === undefined || redisUrl === '') {
    console.log('Redis not configured, using in-memory rate limiting');
    return;
  }

  try {
    redisClient = Redis.createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully for rate limiting');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis for rate limiting:', error);
    redisClient = null;
  }
};

// Initialize Redis on module load
initRedis().catch(console.error);

// Helper function to get Redis store if available
const getRedisStore = (prefix: string): RedisStore | undefined => {
  if (redisClient !== null) {
    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
      prefix,
    });
  }
  return undefined;
};

// General API rate limit - 100 requests per 15 minutes per IP
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: getRedisStore('rl:general:'),
  // Disable validation warnings for proxied requests (Vercel sets X-Forwarded-For)
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    retryAfter: 15 * 60, // seconds
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Strict rate limit for authentication endpoints - 5 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/signup requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore('rl:auth:'),
  // Disable validation warnings for proxied requests (Vercel sets X-Forwarded-For)
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    retryAfter: 15 * 60,
  },
});

// Very strict rate limit for password reset - 3 requests per hour per IP
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore('rl:reset:'),
  // Disable validation warnings for proxied requests (Vercel sets X-Forwarded-For)
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: 'Too many password reset attempts, please try again after an hour.',
    retryAfter: 60 * 60,
  },
});

// EVV check-in/check-out rate limit - 60 requests per hour per user
// (Caregivers typically have 4-8 visits per day, so 60/hour is generous)
export const evvLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any): string => {
    // Use user ID instead of IP for authenticated endpoints
    // @ts-expect-error - req.user is added by auth middleware
    const userId = req.user?.id;
    return userId ?? ipKeyGenerator(req.ip ?? 'unknown');
  },
  store: getRedisStore('rl:evv:'),
  // Disable validation warnings for proxied requests (Vercel sets X-Forwarded-For)
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: 'Too many EVV requests, please contact support if you need assistance.',
    retryAfter: 60 * 60,
  },
});

// Mobile sync rate limit - 120 requests per 5 minutes per user
// (Mobile apps may sync frequently when coming back online)
export const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any): string => {
    // @ts-expect-error - req.user is added by auth middleware
    const userId = req.user?.id;
    return userId ?? ipKeyGenerator(req.ip ?? 'unknown');
  },
  store: getRedisStore('rl:sync:'),
  // Disable validation warnings for proxied requests (Vercel sets X-Forwarded-For)
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: 'Sync rate limit exceeded, please wait a few minutes.',
    retryAfter: 5 * 60,
  },
});

// Report generation rate limit - 10 per hour per user
// (Reports can be expensive to generate)
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any): string => {
    // @ts-expect-error - req.user is added by auth middleware
    const userId = req.user?.id;
    return userId ?? ipKeyGenerator(req.ip ?? 'unknown');
  },
  store: getRedisStore('rl:reports:'),
  // Disable validation warnings for proxied requests (Vercel sets X-Forwarded-For)
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: 'Too many report requests, please try again later.',
    retryAfter: 60 * 60,
  },
});

export const getRedisClient = (): ReturnType<typeof Redis.createClient> | null => redisClient;
