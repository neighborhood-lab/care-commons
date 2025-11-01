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
  max?: number; // Connection pool size
  idleTimeoutMillis?: number;
}

export class Database {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.max ?? 20,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
    });
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
  if (dbInstance) {
    throw new Error('Database already initialized');
  }
  dbInstance = new Database(config);
  return dbInstance;
}

export function getDatabase(): Database {
  if (!dbInstance) {
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
