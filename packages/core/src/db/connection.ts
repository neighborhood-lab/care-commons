/**
 * Database connection and transaction management
 * Enhanced with performance optimization features
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { QueryPerformanceMonitor } from './query-cache.js';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number; // Connection pool size
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  statementTimeout?: number; // Query timeout in milliseconds
  enableQueryLogging?: boolean;
  enablePerformanceTracking?: boolean;
}

export class Database {
  private pool: Pool;
  private enableQueryLogging: boolean;
  private enablePerformanceTracking: boolean;

  constructor(config: DatabaseConfig) {
    this.enableQueryLogging = config.enableQueryLogging ?? (process.env.NODE_ENV === 'development');
    this.enablePerformanceTracking = config.enablePerformanceTracking ?? true;

    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl === true ? { rejectUnauthorized: false } : false,

      // Connection pool optimization
      max: config.max ?? 20, // Maximum pool size
      min: 2, // Minimum idle connections
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000, // Close idle connections after 30s
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 10000, // Wait 10s for connection

      // Statement timeout (prevent runaway queries)
      statement_timeout: config.statementTimeout ?? 30000, // 30 second default

      // Query timeout
      query_timeout: config.statementTimeout ?? 30000,

      // Application name for monitoring
      application_name: 'care_commons_app',

      // Keep-alive for long-lived connections
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Pool error handler
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected database pool error:', err);
    });

    // Pool connection handler (useful for monitoring)
    this.pool.on('connect', (client: PoolClient) => {
      if (this.enableQueryLogging) {
        console.log('New database connection established');
      }

      // Set session-level optimizations on each connection
      client.query('SET search_path TO public').catch(err => {
        console.error('Failed to set search_path:', err);
      });
    });
  }

  /**
   * Execute a query with performance tracking
   */
  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
    queryName?: string
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      // Log query execution
      if (this.enableQueryLogging) {
        console.log('Executed query', {
          name: queryName,
          duration,
          rows: result.rowCount,
          text: text.substring(0, 100), // Truncate for logging
        });
      }

      // Track query performance
      if (this.enablePerformanceTracking && queryName !== undefined) {
        QueryPerformanceMonitor.recordQuery(queryName, duration);
      }

      return result;
    } catch (error) {
      console.error('Query error', { name: queryName, text: text.substring(0, 100), error });
      throw error;
    }
  }

  /**
   * Get a client for transaction management
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute within a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Get the underlying pool (for advanced use cases like pagination helpers)
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(queryName?: string): unknown {
    if (queryName !== undefined) {
      return QueryPerformanceMonitor.getQueryStats(queryName);
    }
    return QueryPerformanceMonitor.getSlowQueries();
  }

  /**
   * Reset query performance statistics
   */
  resetQueryStats(): void {
    QueryPerformanceMonitor.reset();
  }
}

/**
 * Singleton database instance
 */
let dbInstance: Database | null = null;

export function initializeDatabase(config: DatabaseConfig): Database {
  if (dbInstance !== null) {
    throw new Error('Database already initialized');
  }
  dbInstance = new Database(config);
  return dbInstance;
}

export function getDatabase(): Database {
  if (dbInstance === null) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dbInstance;
}

/**
 * Reset database instance - for testing only
 */
export function resetDatabase(): void {
  dbInstance = null;
}
