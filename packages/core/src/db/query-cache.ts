/**
 * Query Result Caching Utility
 *
 * Provides a decorator and utility functions for caching database query results.
 * Automatically handles cache invalidation on data mutations.
 */

import { CacheService, getCacheService } from '../service/cache.service.js';
import { CacheTTL } from '../constants/cache-keys.js';
import crypto from 'node:crypto';

/**
 * Cache key prefixes for different data types
 */
export const CachePrefix = {
  CLIENT: 'client',
  CAREGIVER: 'caregiver',
  VISIT: 'visit',
  CARE_PLAN: 'care_plan',
  TASK: 'task',
  ORGANIZATION: 'organization',
  USER: 'user',
  INVOICE: 'invoice',
  TIMESHEET: 'timesheet',
  EVV: 'evv',
  ANALYTICS: 'analytics',
  DASHBOARD: 'dashboard',
} as const;

/**
 * Generate a cache key from query parameters
 */
export function generateCacheKey(
  prefix: string,
  ...params: (string | number | boolean | object | undefined)[]
): string {
  const serialized = params.map(p => {
    if (p == null) return 'null'; // Intentionally using == to catch both null and undefined
    if (typeof p === 'object') return JSON.stringify(p);
    return String(p);
  }).join(':');

  // For long parameter lists, hash them to keep key length manageable
  // Using MD5 for non-security-critical cache key generation only
  if (serialized.length > 100) {
    const hash = crypto.createHash('md5').update(serialized).digest('hex');
    return `${prefix}:${hash}`;
  }

  return `${prefix}:${serialized}`;
}

/**
 * Cached query executor
 * Wraps a query function with caching logic
 */
export async function cachedQuery<T>(
  options: {
    key: string;
    ttl?: number;
    queryFn: () => Promise<T>;
    shouldCache?: (result: T) => boolean;
  }
): Promise<T> {
  const { key, ttl = CacheTTL.MEDIUM, queryFn, shouldCache = () => true } = options;
  const cache = getCacheService();

  // Try to get from cache first
  try {
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    // Cache read failure - continue to execute query
    console.warn('Cache read failed, executing query:', error);
  }

  // Execute query
  const result = await queryFn();

  // Cache the result if caching is available and result should be cached
  if (shouldCache(result)) {
    try {
      await cache.set(key, result, ttl);
    } catch (error) {
      // Cache write failure - log but don't fail the query
      console.warn('Cache write failed:', error);
    }
  }

  return result;
}

/**
 * Invalidate cache entries for a specific entity
 */
export async function invalidateEntityCache(
  prefix: string,
  entityId?: string
): Promise<void> {
  const cache = getCacheService();

  if (entityId !== undefined) {
    // Invalidate specific entity
    await cache.del(generateCacheKey(prefix, entityId));
    // Also invalidate list queries containing this entity
    await cache.delPattern(`${prefix}:list:*`);
  } else {
    // Invalidate all queries for this entity type
    await cache.delPattern(`${prefix}:*`);
  }
}

/**
 * Invalidate cache entries for an organization
 * Use when organization-wide data changes
 */
export async function invalidateOrganizationCache(
  organizationId: string,
  prefix?: string
): Promise<void> {
  const cache = getCacheService();

  if (prefix !== undefined) {
    // Invalidate specific entity type for organization
    await cache.delPattern(`${prefix}:org:${organizationId}:*`);
  } else {
    // Invalidate all organization data
    await cache.delPattern(`*:org:${organizationId}:*`);
  }
}

/**
 * Query result caching middleware
 * Use this to wrap repository methods for automatic caching
 */
export function withQueryCache<TArgs extends unknown[], TResult>(
  options: {
    prefix: string;
    ttl?: number;
    keyGenerator: (...args: TArgs) => string;
  }
) {
  return function(
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: TArgs): Promise<TResult> {
      const cacheKey = generateCacheKey(options.prefix, options.keyGenerator(...args));

      return await cachedQuery<TResult>({
        key: cacheKey,
        ttl: options.ttl,
        queryFn: async () => await originalMethod.apply(this, args),
      });
    };

    return descriptor;
  };
}

/**
 * Cache warming utility
 * Pre-populate cache with frequently accessed data
 */
export class CacheWarmer {
  }

  /**
   * Warm cache for a specific organization
   * Call this during off-peak hours or after data migrations
   */
  async warmOrganizationCache(
    organizationId: string,
    warmers: Array<() => Promise<void>>
  ): Promise<void> {
    console.log(`Warming cache for organization: ${organizationId}`);

    for (const warmer of warmers) {
      try {
        await warmer();
      } catch (error) {
        console.error('Cache warming failed:', error);
        // Continue with other warmers even if one fails
      }
    }

    console.log(`Cache warming completed for organization: ${organizationId}`);
  }

  /**
   * Check cache health
   * Returns cache hit rate and other metrics
   */
  async getCacheHealth(): Promise<{
    connected: boolean;
    hitRate?: number;
    keyCount?: number;
  }> {

    // NOTE: Hit rate tracking not yet implemented
    // This would require adding instrumentation to cache reads

    return {
      connected: true,
    };
  }
}

/**
 * Query performance tracking
 * Use this to identify slow queries and optimize them
 */
export class QueryPerformanceMonitor {
  private static readonly SLOW_QUERY_THRESHOLD_MS = 100;
  private static queryTimes = new Map<string, number[]>();

  /**
   * Track a query execution time
   */
  static recordQuery(queryName: string, durationMs: number): void {
    if (!this.queryTimes.has(queryName)) {
      this.queryTimes.set(queryName, []);
    }

    const times = this.queryTimes.get(queryName)!;
    times.push(durationMs);

    // Keep only last 100 executions to avoid memory bloat
    if (times.length > 100) {
      times.shift();
    }

    // Log slow queries
    if (durationMs > this.SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`Slow query detected: ${queryName} took ${durationMs}ms`);
    }
  }

  /**
   * Get performance statistics for a query
   */
  static getQueryStats(queryName: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const times = this.queryTimes.get(queryName);
    if (times === undefined || times.length === 0) {
      return null;
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      count: sorted.length,
      avg: sum / sorted.length,
      min: sorted[0]!,
      max: sorted[sorted.length - 1]!,
      p95: sorted[Math.floor(sorted.length * 0.95)]!,
    };
  }

  /**
   * Get all slow queries (p95 > threshold)
   */
  static getSlowQueries(thresholdMs = 100): Array<{
    name: string;
    stats: ReturnType<typeof QueryPerformanceMonitor.getQueryStats>;
  }> {
    const slowQueries: Array<{ name: string; stats: ReturnType<typeof QueryPerformanceMonitor.getQueryStats> }> = [];

    for (const [name] of this.queryTimes) {
      const stats = this.getQueryStats(name);
      if (stats !== null && stats.p95 > thresholdMs) {
        slowQueries.push({ name, stats });
      }
    }

    return slowQueries.sort((a, b) => (b.stats?.p95 ?? 0) - (a.stats?.p95 ?? 0));
  }

  /**
   * Reset all statistics
   */
  static reset(): void {
    this.queryTimes.clear();
  }
}

/**
 * Measure and record query execution time
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    return await queryFn();
  } finally {
    const duration = Date.now() - startTime;
    QueryPerformanceMonitor.recordQuery(queryName, duration);
  }
}
