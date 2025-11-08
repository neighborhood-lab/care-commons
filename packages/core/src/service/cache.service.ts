import { Redis } from 'ioredis';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl: number; // Default TTL in seconds
}

export class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: unknown; expires: number }> = new Map();
  private isRedisAvailable = false;

  constructor(private config?: CacheConfig) {}

  async initialize(): Promise<void> {
    if (!this.config) {
      console.log('Cache service: Using in-memory cache (no Redis configured)');
      this.isRedisAvailable = false;
      return;
    }

    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db || 0,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('Redis connection failed after 3 retries, falling back to memory cache');
            this.isRedisAvailable = false;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000); // Exponential backoff
        },
      });

      // Test connection
      await this.redis.ping();
      this.isRedisAvailable = true;
      console.log('Cache service: Redis connected successfully');
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
      console.log('Cache service: Falling back to in-memory cache');
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const value = await this.redis.get(key);
        if (value === null) {
          return null;
        }
        return JSON.parse(value) as T;
      } else {
        // Memory cache fallback
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value as T;
        }
        if (cached) {
          this.memoryCache.delete(key); // Clean up expired
        }
        return null;
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const ttlSeconds = ttl || this.config?.ttl || 300;

      if (this.isRedisAvailable && this.redis) {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } else {
        // Memory cache fallback
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.memoryCache.set(key, { value, expires: expiresAt });

        // Basic memory cache cleanup (remove old entries when size > 1000)
        if (this.memoryCache.size > 1000) {
          const now = Date.now();
          for (const [k, v] of this.memoryCache.entries()) {
            if (v.expires < now) {
              this.memoryCache.delete(k);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Memory cache: simple prefix matching
        const keysToDelete: string[] = [];
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            keysToDelete.push(key);
          }
        }
        for (const key of keysToDelete) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Get or compute a value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export const initCacheService = async (config?: CacheConfig): Promise<CacheService> => {
  if (!cacheService) {
    cacheService = new CacheService(config);
    await cacheService.initialize();
  }
  return cacheService;
};

export const getCacheService = (): CacheService => {
  if (!cacheService) {
    throw new Error('Cache service not initialized. Call initCacheService first.');
  }
  return cacheService;
};
