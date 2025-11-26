/**
 * Check Slow Queries Script
 * 
 * Queries pg_stat_statements to find slow queries in production.
 * Requires pg_stat_statements extension to be enabled.
 * 
 * Usage: npx tsx scripts/check-slow-queries.ts
 */

import { config as dotenvConfig } from 'dotenv';
import { initializeDatabase, getDatabase } from '../packages/core/src/db/connection.js';

dotenvConfig({ path: '.env', quiet: true });

// Initialize database connection
initializeDatabase({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'care_commons1',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const db = getDatabase();

interface SlowQuery {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  maxTime: number;
  rows: number;
}

async function checkSlowQueries(): Promise<void> {
  console.log('🔍 Checking for Slow Queries...\n');

  try {
    // Check if pg_stat_statements is available
    const extensionCheck = await db.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      ) as has_extension
    `);

    const hasExtension = extensionCheck.rows[0]?.has_extension === true;

    if (!hasExtension) {
      console.log('⚠️  pg_stat_statements extension not found');
      console.log('   Enable it with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;');
      console.log('   You may need superuser privileges or ask your database admin.\n');
      return;
    }

    // Get slow queries (>100ms mean time)
    const result = await db.query<{
      query: string;
      calls: string;
      total_exec_time: string;
      mean_exec_time: string;
      max_exec_time: string;
      rows: string;
    }>(`
      SELECT 
        query,
        calls::text,
        total_exec_time::text,
        mean_exec_time::text,
        max_exec_time::text,
        rows::text
      FROM pg_stat_statements
      WHERE mean_exec_time > 100
        AND query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `);

    if (result.rows.length === 0) {
      console.log('✅ No slow queries found (all queries <100ms mean time)\n');
      return;
    }

    console.log(`⚠️  Found ${result.rows.length} slow queries (>100ms mean time):\n`);

    const slowQueries: SlowQuery[] = result.rows.map(row => ({
      query: row.query,
      calls: parseInt(row.calls),
      totalTime: parseFloat(row.total_exec_time),
      meanTime: parseFloat(row.mean_exec_time),
      maxTime: parseFloat(row.max_exec_time),
      rows: parseInt(row.rows),
    }));

    for (let i = 0; i < slowQueries.length; i++) {
      const q = slowQueries[i];
      console.log(`${i + 1}. Query:`);
      console.log(`   ${q.query.substring(0, 100)}${q.query.length > 100 ? '...' : ''}`);
      console.log(`   Calls: ${q.calls}`);
      console.log(`   Mean: ${q.meanTime.toFixed(2)}ms`);
      console.log(`   Max: ${q.maxTime.toFixed(2)}ms`);
      console.log(`   Total: ${(q.totalTime / 1000).toFixed(2)}s`);
      console.log(`   Rows: ${q.rows}`);
      console.log();
    }

    // Get most called queries
    console.log('📊 Most Frequently Called Queries:\n');

    const frequentResult = await db.query<{
      query: string;
      calls: string;
      mean_exec_time: string;
    }>(`
      SELECT 
        query,
        calls::text,
        mean_exec_time::text
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY calls DESC
      LIMIT 10
    `);

    for (let i = 0; i < frequentResult.rows.length; i++) {
      const q = frequentResult.rows[i];
      console.log(`${i + 1}. ${q.query.substring(0, 80)}...`);
      console.log(`   Calls: ${q.calls}, Mean: ${parseFloat(q.mean_exec_time).toFixed(2)}ms\n`);
    }

    // Check for missing indexes
    console.log('🔍 Checking for Missing Indexes...\n');

    const missingIndexes = await db.query(`
      SELECT 
        schemaname,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexdef
    `);

    const tables = await db.query(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

    console.log('📊 Largest Tables:\n');
    for (const table of tables.rows) {
      const tableIndexCount = missingIndexes.rows.filter(
        idx => idx.tablename === table.tablename
      ).length;
      console.log(`   ${table.tablename}: ${table.size} (${tableIndexCount} indexes)`);
    }
    console.log();

  } catch (error) {
    console.error('Error checking slow queries:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run the script
checkSlowQueries().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
