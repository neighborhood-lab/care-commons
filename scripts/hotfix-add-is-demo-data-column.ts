#!/usr/bin/env tsx
/**
 * HOTFIX: Add is_demo_data Column to All Tables
 *
 * This script manually adds the is_demo_data column to all tables
 * that need it. This is a hotfix for deployment failures where the
 * Knex migration was marked as run but didn't actually execute.
 *
 * SAFE TO RUN MULTIPLE TIMES: Uses IF NOT EXISTS
 */

import pg from 'pg';
const { Client } = pg;

const tables = [
  'clients',
  'caregivers',
  'visits',
  'evv_records',
  'care_plans',
  'task_instances',
  'progress_notes',
  'family_members',
  'family_notifications',
  'messages',
  'invoices',
  'payments',
  'open_shifts',
  'assignment_proposals',
  'users',
];

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔧 HOTFIX: Adding is_demo_data column to all tables...\n');
  console.log(`📝 Database: ${connectionString.split('@')[1]?.split('/')[0] || 'unknown'}\n`);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const tableName of tables) {
      console.log(`  📋 Processing table: ${tableName}`);

      // Check if column exists
      const checkResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'is_demo_data'
      `, [tableName]);

      if (checkResult.rows.length > 0) {
        console.log(`     ✅ Column already exists, skipping`);
        continue;
      }

      // Add column
      await client.query(`
        ALTER TABLE ${tableName}
        ADD COLUMN is_demo_data BOOLEAN DEFAULT false
      `);
      console.log(`     ✅ Column added`);

      // Create index
      const indexName = `idx_${tableName}_is_demo_data`;
      await client.query(`
        CREATE INDEX IF NOT EXISTS ${indexName}
        ON ${tableName}(is_demo_data)
        WHERE is_demo_data = true
      `);
      console.log(`     ✅ Index created`);
    }

    console.log('\n✅ Hotfix complete! All tables now have is_demo_data column.\n');
  } catch (error) {
    console.error('\n❌ Hotfix failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
