/**
 * Cache Service using Redis
 *
 * Provides caching capabilities for frequently accessed data
 * Implements singleton pattern for shared Redis connection
 */

import { createClient, RedisClientType } from 'redis';

export class CacheService {
  private static instance: CacheService | null = null;
  private client: RedisClientType;
  private connected: boolean = false;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      socket: {
        // eslint-disable-next-line sonarjs/function-return-type
        reconnectStrategy: (retries: number): number | false => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            // Return false to stop reconnecting
            return false;
          }
          // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
          return Math.min(retries * 50, 3000);
        }
      }
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
      this.connected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis: Connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis: Disconnected');
      this.connected = false;
    });
  }

  /**
   * Get singleton instance of CacheService
   */
  static getInstance(): CacheService {
    CacheService.instance ??= new CacheService();
    return CacheService.instance;
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.client.isOpen !== true) {
      await this.client.connect();
    }
  }

  /**
   * Check if connected to Redis
   */
  isConnected(): boolean {
    return this.connected && this.client.isOpen;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected()) {
        console.warn('Redis: Not connected, skipping cache read');
        return null;
      }

      const value = await this.client.get(key);
      if (value === null || value === '') {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis: Error getting key', { key, error });
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds (default: 1 hour)
   */
  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    try {
      if (!this.isConnected()) {
        console.warn('Redis: Not connected, skipping cache write');
        return;
      }

      await this.client.set(key, JSON.stringify(value), {
        EX: ttlSeconds
      });
    } catch (error) {
      console.error('Redis: Error setting key', { key, error });
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected()) {
        console.warn('Redis: Not connected, skipping cache delete');
        return;
      }

      await this.client.del(key);
    } catch (error) {
      console.error('Redis: Error deleting key', { key, error });
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async delMany(keys: string[]): Promise<void> {
    try {
      if (!this.isConnected()) {
        console.warn('Redis: Not connected, skipping cache delete');
        return;
      }

      if (keys.length === 0) {
        return;
      }

      await this.client.del(keys);
    } catch (error) {
      console.error('Redis: Error deleting keys', { keys, error });
    }
  }

  /**
   * Invalidate all keys matching a pattern
   * Use with caution - scans all keys
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected()) {
        console.warn('Redis: Not connected, skipping pattern invalidation');
        return;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Redis: Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error('Redis: Error invalidating pattern', { pattern, error });
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis: Error checking key existence', { key, error });
      return false;
    }
  }

  /**
   * Get time to live for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected()) {
        return -2;
      }

      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis: Error getting TTL', { key, error });
      return -2;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    try {
      if (!this.isConnected()) {
        console.warn('Redis: Not connected, cannot increment');
        return 0;
      }

      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis: Error incrementing key', { key, error });
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    try {
      if (!this.isConnected()) {
        console.warn('Redis: Not connected, cannot decrement');
        return 0;
      }

      return await this.client.decr(key);
    } catch (error) {
      console.error('Redis: Error decrementing key', { key, error });
      return 0;
    }
  }

  /**
   * Flush all keys in the current database
   * WARNING: Use only in development/testing
   */
  async flushAll(): Promise<void> {
    try {
      if (!this.isConnected()) {
        console.warn('Redis: Not connected, cannot flush');
        return;
      }

      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cannot flush cache in production');
      }

      await this.client.flushDb();
      console.log('Redis: Flushed all keys');
    } catch (error) {
      console.error('Redis: Error flushing database', error);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client.isOpen === true) {
        // Use quit() for graceful shutdown
        await this.client.quit();
      }
    } catch (error) {
      console.error('Redis: Error disconnecting', error);
    }
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    CacheService.instance = null;
  }
}

// Export singleton instance getter
export const getCacheService = (): CacheService => CacheService.getInstance();
