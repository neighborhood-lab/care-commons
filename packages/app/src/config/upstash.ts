import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

let upstashClient: Redis | null = null;
let rateLimiter: Ratelimit | null = null;

/**
 * Initialize Upstash Redis client for serverless environments
 * Uses REST API which is optimized for edge/serverless functions
 *
 * Falls back to null if not configured (in-memory fallback will be used)
 */
export const initUpstashRedis = (): Redis | null => {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    console.log('Upstash Redis not configured, using in-memory fallback');
    return null;
  }

  try {
    upstashClient = new Redis({
      url: restUrl,
      token: restToken,
    });

    console.log('Upstash Redis initialized successfully');
    return upstashClient;
  } catch (error) {
    console.error('Failed to initialize Upstash Redis:', error);
    return null;
  }
};

/**
 * Get existing Upstash Redis client
 */
export const getUpstashClient = (): Redis | null => {
  if (!upstashClient) {
    upstashClient = initUpstashRedis();
  }
  return upstashClient;
};

/**
 * Initialize rate limiter with Upstash Redis backend
 *
 * Configurations:
 * - API routes: 100 requests per 60 seconds per IP
 * - Auth routes: 5 requests per 60 seconds per IP (stricter)
 */
export const initRateLimiter = (): Ratelimit | null => {
  const client = getUpstashClient();

  if (!client) {
    console.log('Rate limiter not initialized - Redis not available');
    return null;
  }

  try {
    // Default rate limiter: 100 requests per minute
    rateLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(100, '60 s'),
      analytics: true,
      prefix: '@folk-care/api',
    });

    console.log('Rate limiter initialized successfully');
    return rateLimiter;
  } catch (error) {
    console.error('Failed to initialize rate limiter:', error);
    return null;
  }
};

/**
 * Create a custom rate limiter with specific limits
 */
export const createRateLimiter = (
  requests: number,
  windowMs: number,
  prefix?: string
): Ratelimit | null => {
  const client = getUpstashClient();

  if (!client) {
    return null;
  }

  try {
    // Convert milliseconds to seconds for Upstash Duration format
    const windowSeconds = Math.floor(windowMs / 1000);
    return new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
      analytics: true,
      prefix: prefix || '@folk-care/api',
    });
  } catch (error) {
    console.error('Failed to create rate limiter:', error);
    return null;
  }
};

/**
 * Get existing rate limiter instance
 */
export const getRateLimiter = (): Ratelimit | null => {
  if (!rateLimiter) {
    rateLimiter = initRateLimiter();
  }
  return rateLimiter;
};

/**
 * Test Redis connection by performing a simple SET/GET operation
 */
export const testUpstashConnection = async (): Promise<boolean> => {
  const client = getUpstashClient();

  if (!client) {
    return false;
  }

  try {
    const testKey = 'folk-care:health-check';
    const testValue = Date.now().toString();

    await client.set(testKey, testValue, { ex: 10 }); // Expire in 10 seconds
    const retrieved = await client.get(testKey);

    if (retrieved === testValue) {
      console.log('✅ Upstash Redis connection test passed');
      return true;
    }

    console.error('❌ Upstash Redis connection test failed: value mismatch');
    return false;
  } catch (error) {
    console.error('❌ Upstash Redis connection test failed:', error);
    return false;
  }
};

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get a cached value
   */
  get: async <T>(key: string): Promise<T | null> => {
    const client = getUpstashClient();
    if (!client) return null;

    try {
      const value = await client.get(key);
      return value as T | null;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a cached value with optional TTL (in seconds)
   */
  set: async <T>(key: string, value: T, ttl?: number): Promise<boolean> => {
    const client = getUpstashClient();
    if (!client) return false;

    try {
      if (ttl) {
        await client.set(key, value, { ex: ttl });
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete a cached value
   */
  del: async (key: string): Promise<boolean> => {
    const client = getUpstashClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache DEL error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Check if a key exists
   */
  exists: async (key: string): Promise<boolean> => {
    const client = getUpstashClient();
    if (!client) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  },
};
