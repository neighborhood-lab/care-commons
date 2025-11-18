import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';

// Redis client for distributed rate limiting (optional, fallback to memory)
let redisClient: ReturnType<typeof Redis.createClient> | null = null;

/**
 * Initialize Redis for rate limiting
 * Supports both local Redis and Upstash Redis (TLS)
 */
const initRedis = async (): Promise<void> => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl === undefined || redisUrl === '') {
    console.log('Redis not configured, using in-memory rate limiting');
    return;
  }

  try {
    // Determine if TLS is required based on URL protocol
    // Upstash uses rediss:// for TLS connections
    const useTLS = redisUrl.startsWith('rediss://');

    const clientOptions: Redis.RedisClientOptions = {
      url: redisUrl,
    };

    // Enable TLS for Upstash and other cloud Redis providers
    if (useTLS) {
      clientOptions.socket = {
        tls: true,
        // Disable certificate verification for Vercel deployments
        // (Vercel's serverless functions may have issues with cert chains)
        rejectUnauthorized: false,
      };
    }

    redisClient = Redis.createClient(clientOptions);

    redisClient.on('error', (err) => {
      console.error('Redis rate limiting error:', err);
    });

    redisClient.on('connect', () => {
      console.log(`Redis connected successfully for rate limiting (TLS: ${useTLS})`);
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis for rate limiting:', error);
    console.log('Falling back to in-memory rate limiting');
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

// General API rate limit
// - Authenticated users: 5000 requests per 15 minutes (~5.5 req/sec avg, based on user ID)
// - Unauthenticated: 200 requests per 15 minutes (based on IP)
// This allows normal app usage and rapid testing while still preventing abuse
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased for demo testing (was 2000)
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req): string => {
    // Use user ID for authenticated requests (much higher limit)
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (userId !== undefined) {
      return `user:${userId}`;
    }
    // Fall back to IP for unauthenticated requests (lower limit enforced separately)
    return `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`;
  },
  store: getRedisStore('rl:general:'),
  // Disable validation warnings for proxied requests (Vercel sets X-Forwarded-For)
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: 'Too many requests, please slow down and try again in a few moments.',
    retryAfter: 15 * 60, // seconds
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Auth rate limit - 50 failed attempts per 5 minutes per IP
// Generous limit for demo environment with frequent role-switching and testing
// Only counts failed login attempts (skipSuccessfulRequests: true)
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // High limit for demo testing and role switching
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore('rl:auth:'),
  // Disable validation warnings for proxied requests (Vercel sets X-Forwarded-For)
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    error: 'Too many login attempts. Please wait 5 minutes before trying again.',
    retryAfter: 5 * 60,
  },
  // Custom handler to provide better error messages
  handler: (_req, res) => {
    const retryAfter = res.getHeader('Retry-After') as string;
    const retrySeconds = parseInt(retryAfter, 10);
    const finalRetrySeconds = !isNaN(retrySeconds) && retrySeconds > 0 ? retrySeconds : 300;
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please wait before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
      context: {
        retryAfter: finalRetrySeconds, // seconds
        message: `You can try again in ${Math.ceil(finalRetrySeconds / 60)} minutes.`,
      },
    });
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

// EVV check-in/check-out rate limit - 200 requests per hour per user
// (Increased for demo testing while preventing automated abuse)
export const evvLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // Increased for demo testing (was 60)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req): string => {
    // Use user ID instead of IP for authenticated endpoints
    const userId = (req as { user?: { id?: string } }).user?.id;
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
  keyGenerator: (req): string => {
    const userId = (req as { user?: { id?: string } }).user?.id;
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

// Report generation rate limit - 100 per hour per user
// (Increased for demo testing - reports can be expensive but need testing)
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased for demo testing (was 10)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req): string => {
    const userId = (req as { user?: { id?: string } }).user?.id;
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
