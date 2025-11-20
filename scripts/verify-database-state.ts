#!/usr/bin/env tsx

/**
 * Database State Verification Script
 * 
 * Verifies the current state of a database:
 * - Schema exists (tables, migrations)
 * - Data counts (organizations, users, etc.)
 * - Migration history
 * 
 * Usage:
 *   DATABASE_URL=<url> tsx scripts/verify-database-state.ts
 *   PREVIEW_DATABASE_URL=<url> tsx scripts/verify-database-state.ts --preview
 *   tsx scripts/verify-database-state.ts --both
 */

import { Pool } from 'pg';

interface TableCount {
  table: string;
  count: number;
}

interface MigrationRecord {
  id: number;
  name: string;
  executedAt?: string;
}

interface DatabaseState {
  environment: string;
  connected: boolean;
  migrationsTableExists: boolean;
  migrations: MigrationRecord[];
  totalTables: number;
  tableNames: string[];
  dataCounts: TableCount[];
  isEmpty: boolean;
  error?: string;
}

async function verifyDatabase(
  name: string,
  connectionString: string | undefined
): Promise<DatabaseState> {
  const state: DatabaseState = {
    environment: name,
    connected: false,
    migrationsTableExists: false,
    migrations: [],
    totalTables: 0,
    tableNames: [],
    dataCounts: [],
    isEmpty: true,
  };

  if (!connectionString) {
    state.error = `${name}_DATABASE_URL not configured`;
    return state;
  }

  const pool = new Pool({ connectionString });

  try {
    // Test connection
    await pool.query('SELECT 1');
    state.connected = true;

    // Check for migrations table
    const migrationsTableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'migrations'
    `);
    state.migrationsTableExists = migrationsTableCheck.rows.length > 0;

    // Get migration history if table exists
    if (state.migrationsTableExists) {
      const migrationsResult = await pool.query(`
        SELECT id, name, executed_at 
        FROM migrations 
        ORDER BY id
      `);
      state.migrations = migrationsResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        executedAt: row.executed_at,
      }));
    }

    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    state.totalTables = tablesResult.rows.length;
    state.tableNames = tablesResult.rows.map((row) => row.table_name);

    // Get row counts for key tables
    const keyTables = [
      'organizations',
      'users',
      'clients',
      'caregivers',
      'visits',
      'permissions',
      'roles',
    ];

    for (const table of keyTables) {
      if (state.tableNames.includes(table)) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = parseInt(countResult.rows[0].count, 10);
          state.dataCounts.push({ table, count });
          if (count > 0) {
            state.isEmpty = false;
          }
        } catch (err) {
          // Table exists but query failed - skip
          console.warn(`Could not count rows in ${table}:`, err);
        }
      }
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
  } finally {
    await pool.end();
  }

  return state;
}

function printState(state: DatabaseState): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${state.environment.toUpperCase()} DATABASE STATE`);
  console.log('='.repeat(60));

  if (state.error) {
    console.log(`❌ ERROR: ${state.error}`);
    return;
  }

  console.log(`\n✅ Connected: ${state.connected}`);
  console.log(`📊 Total Tables: ${state.totalTables}`);
  console.log(`📝 Migrations Table: ${state.migrationsTableExists ? '✅ Exists' : '❌ Missing'}`);

  if (state.migrations.length > 0) {
    console.log(`\n🔄 Migrations Applied (${state.migrations.length}):`);
    state.migrations.forEach((m) => {
      console.log(`   ${m.id.toString().padStart(3, ' ')}. ${m.name}`);
    });
  } else {
    console.log('\n⚠️  No migrations found');
  }

  if (state.dataCounts.length > 0) {
    console.log(`\n📈 Data Counts:`);
    state.dataCounts.forEach((tc) => {
      const icon = tc.count > 0 ? '📦' : '📭';
      console.log(`   ${icon} ${tc.table.padEnd(20, ' ')}: ${tc.count.toLocaleString()} rows`);
    });
  }

  console.log(`\n🗄️  Database Status: ${state.isEmpty ? '📭 EMPTY (schema only)' : '📦 HAS DATA'}`);

  if (state.tableNames.length > 0 && state.tableNames.length <= 50) {
    console.log(`\n📋 All Tables (${state.totalTables}):`);
    state.tableNames.forEach((name) => {
      console.log(`   - ${name}`);
    });
  }

  console.log('='.repeat(60));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const checkPreview = args.includes('--preview') || args.includes('--both');
  const checkProduction = args.includes('--production') || args.includes('--both') || args.length === 0;

  const results: DatabaseState[] = [];

  if (checkPreview) {
    const previewState = await verifyDatabase('preview', process.env.PREVIEW_DATABASE_URL);
    results.push(previewState);
    printState(previewState);
  }

  if (checkProduction) {
    const prodState = await verifyDatabase('production', process.env.DATABASE_URL);
    results.push(prodState);
    printState(prodState);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  results.forEach((state) => {
    const status = state.error
      ? `❌ ${state.error}`
      : state.connected
        ? `✅ Connected, ${state.totalTables} tables, ${state.migrations.length} migrations, ${state.isEmpty ? 'EMPTY' : 'HAS DATA'}`
        : '❌ Not connected';

    console.log(`${state.environment.padEnd(12, ' ')}: ${status}`);
  });

  console.log('='.repeat(60) + '\n');

  // Exit with error if any database had errors
  const hasErrors = results.some((s) => s.error !== undefined);
  process.exit(hasErrors ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { verifyDatabase, DatabaseState };
