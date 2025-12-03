import { cache as upstashCache } from '../config/upstash.js';

/**
 * Cache Service
 *
 * Provides caching for expensive database queries and API responses.
 * Uses Upstash Redis when available, falls back to no caching.
 *
 * Cache Keys Convention:
 * - analytics:{organizationId}:{metric}:{timeframe}
 * - reports:{organizationId}:{reportType}:{params}
 * - aggregates:{resource}:{aggregationType}:{params}
 */
export class CacheService {
  /**
   * Cache analytics query results
   * TTL: 5 minutes (analytics don't need real-time precision)
   */
  async cacheAnalytics<T>(
    organizationId: string,
    metric: string,
    timeframe: string,
    data: T
  ): Promise<void> {
    const key = `analytics:${organizationId}:${metric}:${timeframe}`;
    await upstashCache.set(key, data, 300); // 5 minutes
  }

  /**
   * Get cached analytics
   */
  async getAnalytics<T>(
    organizationId: string,
    metric: string,
    timeframe: string
  ): Promise<T | null> {
    const key = `analytics:${organizationId}:${metric}:${timeframe}`;
    return upstashCache.get<T>(key);
  }

  /**
   * Cache report results
   * TTL: 1 hour (reports are expensive to generate)
   */
  async cacheReport<T>(
    organizationId: string,
    reportType: string,
    params: Record<string, unknown>,
    data: T
  ): Promise<void> {
    const paramsHash = this.hashParams(params);
    const key = `reports:${organizationId}:${reportType}:${paramsHash}`;
    await upstashCache.set(key, data, 3600); // 1 hour
  }

  /**
   * Get cached report
   */
  async getReport<T>(
    organizationId: string,
    reportType: string,
    params: Record<string, unknown>
  ): Promise<T | null> {
    const paramsHash = this.hashParams(params);
    const key = `reports:${organizationId}:${reportType}:${paramsHash}`;
    return upstashCache.get<T>(key);
  }

  /**
   * Cache aggregate query results
   * TTL: 10 minutes (aggregates change infrequently)
   */
  async cacheAggregate<T>(
    resource: string,
    aggregationType: string,
    params: Record<string, unknown>,
    data: T
  ): Promise<void> {
    const paramsHash = this.hashParams(params);
    const key = `aggregates:${resource}:${aggregationType}:${paramsHash}`;
    await upstashCache.set(key, data, 600); // 10 minutes
  }

  /**
   * Get cached aggregate
   */
  async getAggregate<T>(
    resource: string,
    aggregationType: string,
    params: Record<string, unknown>
  ): Promise<T | null> {
    const paramsHash = this.hashParams(params);
    const key = `aggregates:${resource}:${aggregationType}:${paramsHash}`;
    return upstashCache.get<T>(key);
  }

  /**
   * Invalidate cache for a specific organization
   * Useful when data changes that affects analytics/reports
   */
  async invalidateOrganization(organizationId: string): Promise<void> {
    // Note: Redis doesn't have a built-in way to delete by pattern in @upstash/redis
    // We'd need to track keys or use a different approach
    // For now, individual cache entries will expire naturally
    console.log(`Cache invalidation requested for organization ${organizationId}`);
    // TODO: Implement key tracking or use Redis SCAN command via traditional client
  }

  /**
   * Generic cache method with custom TTL
   */
  async cache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    await upstashCache.set(`custom:${key}`, data, ttlSeconds);
  }

  /**
   * Generic get method
   */
  async get<T>(key: string): Promise<T | null> {
    return upstashCache.get<T>(`custom:${key}`);
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<void> {
    await upstashCache.del(`custom:${key}`);
  }

  /**
   * Check if cache entry exists
   */
  async exists(key: string): Promise<boolean> {
    return upstashCache.exists(`custom:${key}`);
  }

  /**
   * Helper: Create deterministic hash from params object
   */
  private hashParams(params: Record<string, unknown>): string {
    // Sort keys for consistent hashing
    const sorted = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, unknown>
      );

    // Create simple hash from JSON
    return Buffer.from(JSON.stringify(sorted)).toString('base64').slice(0, 32);
  }
}

// Singleton instance
export const cacheService = new CacheService();
