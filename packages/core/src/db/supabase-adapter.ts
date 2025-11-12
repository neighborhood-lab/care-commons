/**
 * Supabase Database Adapter for Cloudflare Workers
 * 
 * Provides a simple adapter to use with Hyperdrive connection pooling.
 * This is specifically designed for serverless environments.
 */

import pg from 'pg';
const { Pool } = pg;

/**
 * Environment interface for Cloudflare Workers
 */
export interface CloudflareEnv {
  HYPERDRIVE?: {
    connectionString: string;
  };
  DATABASE_URL?: string;
  NODE_ENV?: string;
}

/**
 * Create Supabase connection pool for Cloudflare Workers
 * 
 * IMPORTANT: Use with Hyperdrive for proper connection pooling
 * 
 * Setup Hyperdrive:
 * ```bash
 * wrangler hyperdrive create care-commons-db \
 *   --connection-string="postgres://postgres.[ref]:[pwd]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
 * ```
 */
export function createSupabasePool(env: CloudflareEnv): InstanceType<typeof Pool> {
  const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL ?? '';

  if (connectionString === '') {
    throw new Error('No database connection string. Set HYPERDRIVE or DATABASE_URL.');
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1, // Hyperdrive handles pooling
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Helper to build Supabase connection strings
 */
export function buildSupabaseConnectionString(options: {
  projectRef: string;
  password: string;
  region?: string;
  usePooler?: boolean;
}): string {
  const { projectRef, password, region = 'us-east-2', usePooler = true } = options;

  if (usePooler) {
    // Transaction mode pooler (port 6543) - for applications
    return `postgres://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
  } else {
    // Direct connection (port 5432) - for migrations
    return `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
  }
}

/**
 * Example usage in Cloudflare Worker:
 * 
 * ```typescript
 * import { createSupabasePool } from '@care-commons/core/db/supabase-adapter.js';
 * 
 * export default {
 *   async fetch(request: Request, env: Env) {
 *     const pool = createSupabasePool(env);
 *     const result = await pool.query('SELECT NOW()');
 *     return Response.json({ time: result.rows[0] });
 *   }
 * }
 * ```
 */
