/**
 * Query Result Caching Layer
 *
 * Provides intelligent caching for frequently accessed database queries
 * using Redis to reduce database load and improve response times.
 */

import { CacheService } from '../service/cache-service.js';
import type { QueryResult } from 'pg';

export interface QueryCacheOptions {
  /**
   * TTL in seconds (default: 300 = 5 minutes)
   */
  ttl?: number;

  /**
   * Cache key prefix (default: 'query')
   */
  prefix?: string;

  /**
   * Skip cache and force query execution
   */
  skipCache?: boolean;
}

export class QueryCache {
  private cacheService: CacheService;
  private defaultTTL: number = 300; // 5 minutes
  private defaultPrefix: string = 'query';

  constructor() {
    this.cacheService = CacheService.getInstance();
  }

  /**
   * Generate a cache key from query text and parameters
   */
  private generateCacheKey(
    queryText: string,
    params: unknown[] | undefined,
    prefix: string
  ): string {
    // Normalize query text (remove extra whitespace)
    const normalizedQuery = queryText.replace(/\s+/g, ' ').trim();

    // Create a stable key including params
    const paramsStr = params !== undefined ? JSON.stringify(params) : '';
    const keyData = `${normalizedQuery}:${paramsStr}`;

    // Use a simple hash for the key (could use crypto.createHash for production)
    return `${prefix}:${this.simpleHash(keyData)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Execute a query with caching
   *
   * @param queryFn Function that executes the actual query
   * @param queryText SQL query text (used for cache key generation)
   * @param params Query parameters
   * @param options Cache options
   * @returns Query result (from cache or fresh)
   */
  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    queryFn: () => Promise<QueryResult<T>>,
    queryText: string,
    params?: unknown[],
    options: QueryCacheOptions = {}
  ): Promise<QueryResult<T>> {
    const {
      ttl = this.defaultTTL,
      prefix = this.defaultPrefix,
      skipCache = false,
    } = options;

    // Skip cache if requested
    if (skipCache) {
      return await queryFn();
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(queryText, params, prefix);

    // Try to get from cache
    const cached = await this.cacheService.get<QueryResult<T>>(cacheKey);
    if (cached !== null) {
      console.log(`Query cache HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`Query cache MISS: ${cacheKey}`);

    // Execute query
    const result = await queryFn();

    // Store in cache (fire and forget)
    void this.cacheService.set(cacheKey, result, ttl).catch((error) => {
      console.error('Failed to cache query result:', error);
    });

    return result;
  }

  /**
   * Invalidate cache by pattern
   *
   * @param pattern Cache key pattern (e.g., 'query:users:*')
   */
  async invalidate(pattern: string): Promise<void> {
    await this.cacheService.invalidatePattern(pattern);
  }

  /**
   * Invalidate cache for a specific table
   * Useful for invalidating all queries related to a table after mutations
   *
   * @param tableName Table name
   */
  async invalidateTable(tableName: string): Promise<void> {
    await this.invalidate(`${this.defaultPrefix}:*${tableName}*`);
  }

  /**
   * Clear all query cache
   */
  async clear(): Promise<void> {
    await this.invalidate(`${this.defaultPrefix}:*`);
  }
}

/**
 * Singleton instance
 */
let queryCacheInstance: QueryCache | null = null;

export function getQueryCache(): QueryCache {
  if (queryCacheInstance === null) {
    queryCacheInstance = new QueryCache();
  }
  return queryCacheInstance;
}

/**
 * Helper function for caching SELECT queries
 *
 * Usage:
 * ```typescript
 * const result = await cacheQuery(
 *   () => db.query('SELECT * FROM users WHERE org_id = $1', [orgId]),
 *   'SELECT * FROM users WHERE org_id = $1',
 *   [orgId],
 *   { ttl: 600, prefix: 'users' }
 * );
 * ```
 */
export async function cacheQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  queryFn: () => Promise<QueryResult<T>>,
  queryText: string,
  params?: unknown[],
  options: QueryCacheOptions = {}
): Promise<QueryResult<T>> {
  const cache = getQueryCache();
  return await cache.query(queryFn, queryText, params, options);
}
