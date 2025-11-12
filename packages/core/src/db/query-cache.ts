/**
 * Query Result Cache
 *
 * Simple in-memory cache for database query results with TTL support.
 * Useful for caching frequently accessed, rarely changed data like:
 * - Organization/branch settings
 * - Rate schedules
 * - Matching configurations
 * - User permissions
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class QueryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private defaultTTL: number;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(defaultTTLSeconds: number = 300) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds

    // Clean up expired entries every minute
    this.cleanupIntervalId = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (entry === undefined) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Destroy the cache instance and cleanup resources
   * Should be called when the cache is no longer needed to prevent memory leaks
   */
  destroy(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or set a value using a loader function
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await loader();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Wrap a function with caching
   */
  wrap<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyGenerator: (...args: TArgs) => string,
    ttlSeconds?: number
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), ttlSeconds);
    };
  }
}

/**
 * Singleton cache instance
 */
let cacheInstance: QueryCache | null = null;

export function initializeQueryCache(defaultTTLSeconds?: number): QueryCache {
  if (cacheInstance === null) {
    cacheInstance = new QueryCache(defaultTTLSeconds);
  }
  return cacheInstance;
}

export function getQueryCache(): QueryCache {
  if (cacheInstance === null) {
    // Auto-initialize with default TTL
    cacheInstance = new QueryCache();
  }
  return cacheInstance;
}

/**
 * Reset cache instance - for testing only
 */
export function resetQueryCache(): void {
  if (cacheInstance !== null) {
    cacheInstance.destroy();
  }
  cacheInstance = null;
}

/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
  organization: (id: string) => `org:${id}`,
  branch: (id: string) => `branch:${id}`,
  user: (id: string) => `user:${id}`,
  rateSchedule: (orgId: string, payerId?: string, date?: Date) =>
    `rate:${orgId}:${payerId ?? 'default'}:${date?.toISOString().split('T')[0] ?? 'current'}`,
  matchingConfig: (orgId: string, branchId?: string) =>
    `matching:${orgId}:${branchId ?? 'default'}`,
  payer: (id: string) => `payer:${id}`,
  payersByOrg: (orgId: string) => `payers:org:${orgId}`,
  authorization: (authNumber: string) => `auth:${authNumber}`,
  caregiverPreferences: (caregiverId: string) => `caregiver:prefs:${caregiverId}`,
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  organization: (id: string) => {
    const cache = getQueryCache();
    cache.deletePattern(`^org:${id}`);
  },

  branch: (id: string) => {
    const cache = getQueryCache();
    cache.deletePattern(`^branch:${id}`);
  },

  user: (id: string) => {
    const cache = getQueryCache();
    cache.delete(CacheKeys.user(id));
  },

  rateSchedule: (orgId: string) => {
    const cache = getQueryCache();
    cache.deletePattern(`^rate:${orgId}`);
  },

  matchingConfig: (orgId: string, branchId?: string) => {
    const cache = getQueryCache();
    if (typeof branchId === 'string' && branchId.length > 0) {
      cache.delete(CacheKeys.matchingConfig(orgId, branchId));
    } else {
      cache.deletePattern(`^matching:${orgId}`);
    }
  },

  payer: (id: string, orgId?: string) => {
    const cache = getQueryCache();
    cache.delete(CacheKeys.payer(id));
    if (typeof orgId === 'string' && orgId.length > 0) {
      cache.delete(CacheKeys.payersByOrg(orgId));
    }
  },

  authorization: (authNumber: string) => {
    const cache = getQueryCache();
    cache.delete(CacheKeys.authorization(authNumber));
  },
};
