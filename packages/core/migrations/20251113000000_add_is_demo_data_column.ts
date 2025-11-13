/**
 * Migration: Add is_demo_data Column
 *
 * Adds boolean column is_demo_data to tables to track which records
 * are demo/test data vs real production data. This enables easy cleanup
 * of demo data and prevents accidental mixing of test and real data.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // List of tables that need the is_demo_data column
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
    'open_shifts',
    'assignment_proposals',
    'users',
  ];

  for (const tableName of tables) {
    // Add column if it doesn't exist
    await knex.raw(`
      ALTER TABLE ${tableName}
      ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT false
    `);

    // Create index for efficient filtering
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS idx_${tableName}_is_demo_data
      ON ${tableName}(is_demo_data)
      WHERE is_demo_data = true
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
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
    'open_shifts',
    'assignment_proposals',
    'users',
  ];

  for (const tableName of tables) {
    // Drop indexes
    await knex.raw(`DROP INDEX IF EXISTS idx_${tableName}_is_demo_data`);

    // Drop columns
    await knex.raw(`ALTER TABLE ${tableName} DROP COLUMN IF EXISTS is_demo_data`);
  }
}
