/**
 * Database Query Logger
 *
 * Monitors and logs database queries for performance analysis
 * Automatically detects slow queries and provides warnings
 */

import type { Knex } from 'knex';

export interface QueryLogConfig {
  /**
   * Enable query logging
   * Set via LOG_QUERIES=true environment variable
   */
  enabled: boolean;

  /**
   * Log all queries (verbose mode)
   * Set via VERBOSE_QUERIES=true environment variable
   */
  verbose: boolean;

  /**
   * Threshold for slow query warnings (milliseconds)
   * Set via SLOW_QUERY_THRESHOLD_MS environment variable
   * Default: 500ms
   */
  slowQueryThreshold: number;

  /**
   * Enable query response logging
   * Set via LOG_QUERY_RESPONSES=true environment variable
   */
  logResponses: boolean;
}

export interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
}

/**
 * Query Logger for monitoring database performance
 */
export class QueryLogger {
  private config: QueryLogConfig;
  private stats: QueryStats = {
    totalQueries: 0,
    slowQueries: 0,
    averageDuration: 0,
    maxDuration: 0,
    minDuration: Number.POSITIVE_INFINITY
  };
  private queryDurations: number[] = [];

  constructor(config?: Partial<QueryLogConfig>) {
    const slowQueryEnv = process.env.SLOW_QUERY_THRESHOLD_MS ?? '500';
    this.config = {
      enabled: process.env.LOG_QUERIES === 'true',
      verbose: process.env.VERBOSE_QUERIES === 'true',
      slowQueryThreshold: parseInt(slowQueryEnv, 10),
      logResponses: process.env.LOG_QUERY_RESPONSES === 'true',
      ...config
    };
  }

  /**
   * Attach query logger to a Knex instance
   */
  attach(knex: Knex): void {
    if (!this.config.enabled && !this.config.verbose) {
      return;
    }

    // Log query execution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    knex.on('query', (query: { sql: string; bindings?: any[] }) => {
      if (this.config.verbose) {
        console.log('📝 Query:', query.sql);
        if (query.bindings !== undefined && query.bindings.length > 0) {
          console.log('📌 Bindings:', query.bindings);
        }
      }

      // Track query start time for duration calculation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (query as any).__startTime = Date.now();
    });

    // Log query response with timing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    knex.on('query-response', (response: any, query: any) => {
      const duration = Date.now() - (query.__startTime ?? Date.now());
      this.recordQueryDuration(duration);

      if (duration > this.config.slowQueryThreshold) {
        console.warn(`🐌 Slow query (${duration}ms):`, query.sql);
        if (query.bindings !== undefined && query.bindings.length > 0) {
          console.warn('📌 Bindings:', query.bindings);
        }
      } else if (this.config.verbose) {
        console.log(`⚡ Query completed (${duration}ms)`);
      }

      if (this.config.logResponses && this.config.verbose) {
        console.log('📦 Response:', response);
      }
    });

    // Log query errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    knex.on('query-error', (error: Error, query: any) => {
      console.error('❌ Query error:', error.message);
      console.error('📝 Failed query:', query.sql);
      if (query.bindings !== undefined && query.bindings.length > 0) {
        console.error('📌 Bindings:', query.bindings);
      }
    });

    console.log('✅ Query logger attached');
  }

  /**
   * Record query duration for statistics
   */
  private recordQueryDuration(duration: number): void {
    this.stats.totalQueries++;
    this.queryDurations.push(duration);

    if (duration > this.config.slowQueryThreshold) {
      this.stats.slowQueries++;
    }

    this.stats.maxDuration = Math.max(this.stats.maxDuration, duration);
    this.stats.minDuration = Math.min(this.stats.minDuration, duration);

    // Calculate average
    const sum = this.queryDurations.reduce((a, b) => a + b, 0);
    this.stats.averageDuration = sum / this.queryDurations.length;
  }

  /**
   * Get current query statistics
   */
  getStats(): QueryStats {
    return { ...this.stats };
  }

  /**
   * Reset query statistics
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      averageDuration: 0,
      maxDuration: 0,
      minDuration: Number.POSITIVE_INFINITY
    };
    this.queryDurations = [];
  }

  /**
   * Print query statistics summary
   */
  printStats(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Query Performance Statistics');
    console.log('='.repeat(60));
    console.log(`Total Queries: ${this.stats.totalQueries}`);
    console.log(`Slow Queries: ${this.stats.slowQueries}`);
    console.log(`Average Duration: ${this.stats.averageDuration.toFixed(2)}ms`);
    console.log(`Min Duration: ${this.stats.minDuration === Number.POSITIVE_INFINITY ? 'N/A' : this.stats.minDuration.toFixed(2) + 'ms'}`);
    console.log(`Max Duration: ${this.stats.maxDuration.toFixed(2)}ms`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Enable query logging
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable query logging
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

/**
 * Create and configure a query logger
 */
export function createQueryLogger(config?: Partial<QueryLogConfig>): QueryLogger {
  return new QueryLogger(config);
}

/**
 * Simplified query logging setup
 * Call this after creating your Knex instance
 */
export function setupQueryLogging(knex: Knex, config?: Partial<QueryLogConfig>): QueryLogger {
  const logger = createQueryLogger(config);
  logger.attach(knex);
  return logger;
}
