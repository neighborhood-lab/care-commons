import { createClient, type RedisClientType } from 'redis';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl: number; // Default TTL in seconds
}

export class CacheService {
  private redis: RedisClientType | null = null;
  private memoryCache: Map<string, { value: unknown; expires: number }> = new Map();
  private isRedisAvailable = false;

  constructor(private config?: CacheConfig) {}

  async initialize(): Promise<void> {
    if (this.config === undefined) {
      console.log('Cache service: Using in-memory cache (no Redis configured)');
      this.isRedisAvailable = false;
      return;
    }

    try {
      const passwordPart = this.config.password !== undefined ? `:${this.config.password}@` : '';

      // Determine protocol based on TLS requirement
      // Use 'rediss://' for TLS (Upstash, Vercel KV, etc.)
      // Check if we should use TLS (environment variable or port 6380 which is common for TLS Redis)
      const useTLS = process.env.REDIS_USE_TLS === 'true' || this.config.port === 6380;
      const protocol = useTLS ? 'rediss' : 'redis';

      const url = `${protocol}://${passwordPart}${this.config.host}:${this.config.port}/${this.config.db ?? 0}`;

      const clientOptions: Parameters<typeof createClient>[0] = { url };

      // Enable TLS for Upstash and other cloud Redis providers
      if (useTLS) {
        clientOptions.socket = {
          tls: true,
          // Disable certificate verification for Vercel deployments
          // (Vercel's serverless functions may have issues with cert chains)
          rejectUnauthorized: false,
        };
      }

      const client = createClient(clientOptions);

      client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isRedisAvailable = false;
      });

      await client.connect();

      // Test connection
      await client.ping();

      // Only assign after successful connection
      this.redis = client as RedisClientType;
      this.isRedisAvailable = true;
      console.log(`Cache service: Redis connected successfully (TLS: ${useTLS})`);
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
      if (this.isRedisAvailable && this.redis !== null) {
        const value = await this.redis.get(key);
        if (value === null) {
          return null;
        }
        return JSON.parse(value) as T;
      } else {
        // Memory cache fallback
        const cached = this.memoryCache.get(key);
        if (cached !== undefined && cached.expires > Date.now()) {
          return cached.value as T;
        }
        if (cached !== undefined) {
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
      const ttlSeconds = ttl ?? this.config?.ttl ?? 300;

      if (this.isRedisAvailable && this.redis !== null) {
        await this.redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
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
      if (this.isRedisAvailable && this.redis !== null) {
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
      if (this.isRedisAvailable && this.redis !== null) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
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
   * 
   * NOTE: Does NOT cache null values to prevent cache poisoning
   * (e.g., looking up a user before they're created shouldn't cache "not found")
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
    
    // Don't cache null/undefined values to prevent cache poisoning
    if (value != null) {
      await this.set(key, value, ttl);
    }
    
    return value;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<
    | { type: 'redis'; info: Record<string, string> }
    | { type: 'memory'; size: number }
  > {
    if (this.isRedisAvailable && this.redis !== null) {
      const info = await this.redis.info();
      const lines = info.split('\r\n');
      const stats: Record<string, string> = {};
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (key !== undefined && key !== '' && value !== undefined && value !== '') {
            stats[key] = value;
          }
        }
      }
      return { type: 'redis', info: stats };
    } else {
      return { type: 'memory', size: this.memoryCache.size };
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    if (this.isRedisAvailable && this.redis !== null) {
      await this.redis.flushDb();
    } else {
      this.memoryCache.clear();
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis !== null) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export const initCacheService = async (config?: CacheConfig): Promise<CacheService> => {
  if (cacheService === null) {
    cacheService = new CacheService(config);
    await cacheService.initialize();
  }
  return cacheService;
};

export const getCacheService = (): CacheService => {
  if (cacheService === null) {
    throw new Error('Cache service not initialized. Call initCacheService first.');
  }
  return cacheService;
};
