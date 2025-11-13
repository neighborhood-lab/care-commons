/**
 * Database connection and transaction management
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number; // Connection pool size (default: 20)
  min?: number; // Minimum pool size (default: 2)
  idleTimeoutMillis?: number; // Connection idle timeout (default: 30000)
  connectionTimeoutMillis?: number; // Connection acquisition timeout (default: 10000)
  statementTimeout?: number; // Query statement timeout in ms (default: 30000)
  queryTimeout?: number; // Query timeout in ms (default: 30000)
  allowExitOnIdle?: boolean; // Allow process to exit when all connections are idle (default: false)
  application_name?: string; // Application name for pg_stat_activity (default: 'care-commons')
}

export class Database {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    // Detect serverless environment for optimized pool settings
    const isServerless = process.env.VERCEL !== undefined || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined || process.env.WORKER_NAME !== undefined;
    
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl === true ? { rejectUnauthorized: false } : false,
      // Connection pool settings optimized for serverless
      max: config.max ?? (isServerless ? 1 : 20), // 1 connection for serverless, 20 for traditional
      min: config.min ?? (isServerless ? 0 : 2), // 0 min for serverless to allow complete cleanup
      idleTimeoutMillis: config.idleTimeoutMillis ?? (isServerless ? 1000 : 30000), // Fast cleanup in serverless
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 3000, // 3s timeout to prevent hangs
      allowExitOnIdle: config.allowExitOnIdle ?? isServerless, // Allow exit in serverless
      // Query timeout settings
      statement_timeout: config.statementTimeout ?? 30000, // 30s statement timeout
      query_timeout: config.queryTimeout ?? 30000, // 30s query timeout
      // Application name for monitoring
      application_name: config.application_name ?? 'care-commons',
    });

    // Log pool errors (only if pool has event emitter methods)
    if (typeof this.pool.on === 'function') {
      this.pool.on('error', (err) => {
        console.error('Unexpected pool error', err);
      });

      // Log pool connection events in development
      if (process.env.NODE_ENV === 'development') {
        this.pool.on('connect', () => {
          console.log('New database connection established');
        });

        this.pool.on('remove', () => {
          console.log('Database connection removed from pool');
        });
      }
    }
  }

  /**
   * Get the underlying connection pool
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Execute a query
   */
  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Query error', { text, error });
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
