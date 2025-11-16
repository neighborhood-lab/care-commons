/**
 * Organization-Scoped Database Wrapper
 * 
 * Provides a database interface that automatically sets RLS (Row-Level Security)
 * session variables to enforce organization-level multi-tenancy isolation.
 * 
 * CRITICAL SECURITY: This wrapper must be used for all database operations
 * to ensure RLS policies are properly enforced.
 */

import { Database } from './connection.js';
import { UUID } from '../types/base.js';
import { PoolClient, QueryResult } from 'pg';

export interface ScopedDatabaseContext {
  organizationId: UUID;
  userId: UUID;
  isSuperAdmin?: boolean;
}

/**
 * Scoped database wrapper that automatically enforces organization context
 * 
 * This wrapper ensures that all database queries are executed with the proper
 * RLS (Row-Level Security) context variables set, preventing cross-organization
 * data leaks at the database layer.
 * 
 * @example
 * ```typescript
 * const scopedDb = new ScopedDatabase(db, {
 *   organizationId: user.organizationId,
 *   userId: user.userId
 * });
 * 
 * // All queries will automatically be scoped to the organization
 * const result = await scopedDb.query('SELECT * FROM clients WHERE status = $1', ['ACTIVE']);
 * ```
 */
export class ScopedDatabase {
  constructor(
    private db: Database,
    private context: ScopedDatabaseContext
  ) {}

  /**
   * Set RLS context variables on a database client
   * 
   * This must be called at the start of each transaction/query to ensure
   * RLS policies have the necessary context.
   */
  private async setRLSContext(client: PoolClient): Promise<void> {
    // Set current organization ID
    await client.query(
      'SET LOCAL app.current_organization_id = $1',
      [this.context.organizationId]
    );

    // Set super admin flag if applicable
    if (this.context.isSuperAdmin === true) {
      await client.query('SET LOCAL app.is_super_admin = $1', ['true']);
    }
  }

  /**
   * Execute a query with automatic RLS context
   * 
   * @param text - SQL query text
   * @param params - Query parameters
   * @returns Query result
   */
  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    // For simple queries, we need to use a client from the pool
    // to ensure session variables persist
    const client = await this.db.getClient();
    try {
      await this.setRLSContext(client);
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  }

  /**
   * Execute within a transaction with automatic RLS context
   * 
   * @param callback - Function to execute within transaction
   * @returns Result from callback
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await this.setRLSContext(client);
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
   * Get the underlying database instance (use with caution)
   * 
   * WARNING: Using the underlying database directly bypasses RLS context.
   * Only use this for operations that don't require organization scoping
   * (e.g., health checks, migrations).
   */
  getUnscopedDatabase(): Database {
    return this.db;
  }

  /**
   * Get the current organization context
   */
  getContext(): ScopedDatabaseContext {
    return { ...this.context };
  }

  /**
   * Create a new scoped database with different context
   * Useful for operations that need to temporarily act as a different user
   * (e.g., super admin operations)
   */
  withContext(newContext: Partial<ScopedDatabaseContext>): ScopedDatabase {
    return new ScopedDatabase(this.db, {
      ...this.context,
      ...newContext
    });
  }

  /**
   * Close all connections (delegates to underlying database)
   */
  async close(): Promise<void> {
    await this.db.close();
  }

  /**
   * Health check (delegates to underlying database)
   */
  async healthCheck(): Promise<boolean> {
    return await this.db.healthCheck();
  }
}

/**
 * Create a scoped database instance from context
 * 
 * This is a convenience function for creating scoped database instances.
 * 
 * @param db - Underlying database instance
 * @param context - Organization and user context
 * @returns Scoped database instance
 */
export function createScopedDatabase(
  db: Database,
  context: ScopedDatabaseContext
): ScopedDatabase {
  return new ScopedDatabase(db, context);
}
