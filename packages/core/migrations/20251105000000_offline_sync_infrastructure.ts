/**
 * Migration: Offline Sync Infrastructure
 * 
 * Adds tables and columns necessary for offline-first synchronization:
 * 1. sync_queue table - Tracks operations pending sync from clients
 * 2. sync_conflicts table - Tracks conflicts requiring manual resolution
 * 3. version columns - Added to key tables for optimistic locking
 * 
 * This migration enables the offline-first architecture that allows
 * caregivers to work without connectivity and sync when online.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Create sync_queue table for server-side tracking
  await knex.schema.createTable('sync_queue', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Operation details
    table.string('operation_type', 20).notNullable(); // CREATE, UPDATE, DELETE
    table.string('entity_type', 50).notNullable(); // VISIT, EVV_RECORD, etc.
    table.uuid('entity_id').notNullable();
    table.jsonb('payload').notNullable();
    
    // Client information
    table.string('device_id', 100).notNullable();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    
    // Retry logic
    table.integer('retry_count').notNullable().defaultTo(0);
    table.integer('max_retries').notNullable().defaultTo(5);
    table.timestamp('next_retry_at', { useTz: true });
    
    // Status tracking
    table.string('status', 20).notNullable().defaultTo('PENDING'); // PENDING, IN_PROGRESS, RETRY, FAILED, SYNCED
    table.text('error_message');
    table.jsonb('error_details');
    
    // Priority (higher = more important)
    table.integer('priority').notNullable().defaultTo(10);
    
    // Version for conflict detection
    table.integer('client_version').notNullable().defaultTo(0);
    table.integer('server_version').notNullable().defaultTo(0);
    
    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('synced_at', { useTz: true });
    
    // Indexes for efficient queries
    table.index(['organization_id', 'status'], 'idx_sync_queue_org_status');
    table.index(['user_id', 'status'], 'idx_sync_queue_user_status');
    table.index(['entity_type', 'entity_id'], 'idx_sync_queue_entity');
    table.index(['status', 'priority', 'created_at'], 'idx_sync_queue_processing');
    table.index('next_retry_at', 'idx_sync_queue_retry');
  });

  // 2. Create sync_conflicts table for manual review
  await knex.schema.createTable('sync_conflicts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Conflict details
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').notNullable();
    table.string('field_name', 100).notNullable();
    
    // Values
    table.jsonb('local_value').notNullable();
    table.timestamp('local_updated_at', { useTz: true }).notNullable();
    table.jsonb('remote_value').notNullable();
    table.timestamp('remote_updated_at', { useTz: true }).notNullable();
    
    // Versions
    table.integer('client_version').notNullable();
    table.integer('server_version').notNullable();
    
    // Resolution
    table.string('resolution_strategy', 50); // LAST_WRITE_WINS, MERGE_ARRAYS, MANUAL_REVIEW, etc.
    table.string('resolution_status', 20).notNullable().defaultTo('PENDING'); // PENDING, RESOLVED, REJECTED
    table.jsonb('resolved_value');
    table.string('resolved_by_type', 20); // SYSTEM, SUPERVISOR, ADMINISTRATOR
    table.uuid('resolved_by_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at', { useTz: true });
    table.text('resolution_notes');
    
    // Organization
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    
    // Metadata
    table.jsonb('metadata');
    
    // Timestamps
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['organization_id', 'resolution_status'], 'idx_sync_conflicts_org_status');
    table.index(['entity_type', 'entity_id'], 'idx_sync_conflicts_entity');
    table.index('resolution_status', 'idx_sync_conflicts_status');
  });

  // 3. Add version column to visits table for optimistic locking
  await knex.schema.alterTable('visits', (table) => {
    table.integer('version').notNullable().defaultTo(1);
    table.index('version', 'idx_visits_version');
  });

  // 4. Add version column to evv_records table
  await knex.schema.alterTable('evv_records', (table) => {
    table.integer('version').notNullable().defaultTo(1);
    table.index('version', 'idx_evv_records_version');
  });

  // 5. Add version column to time_entries table
  await knex.schema.alterTable('time_entries', (table) => {
    table.integer('version').notNullable().defaultTo(1);
    table.index('version', 'idx_time_entries_version');
  });

  // 6. Add version column to care_plan_tasks table
  await knex.schema.alterTable('care_plan_tasks', (table) => {
    table.integer('version').notNullable().defaultTo(1);
    table.index('version', 'idx_care_plan_tasks_version');
  });

  // 7. Add version column to clients table
  await knex.schema.alterTable('clients', (table) => {
    table.integer('version').notNullable().defaultTo(1);
    table.index('version', 'idx_clients_version');
  });

  // 8. Add version column to caregivers table
  await knex.schema.alterTable('caregivers', (table) => {
    table.integer('version').notNullable().defaultTo(1);
    table.index('version', 'idx_caregivers_version');
  });

  // 9. Create function to auto-increment version on update
  await knex.raw(`
    CREATE OR REPLACE FUNCTION increment_version()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 10. Create triggers for version increment on all relevant tables
  const tables = [
    'visits',
    'evv_records',
    'time_entries',
    'care_plan_tasks',
    'clients',
    'caregivers',
  ];

  for (const tableName of tables) {
    await knex.raw(`
      CREATE TRIGGER ${tableName}_version_trigger
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      WHEN (OLD.* IS DISTINCT FROM NEW.*)
      EXECUTE FUNCTION increment_version();
    `);
  }

  // 11. Create view for sync queue statistics
  await knex.raw(`
    CREATE VIEW sync_queue_stats AS
    SELECT 
      organization_id,
      status,
      COUNT(*) as count,
      AVG(retry_count) as avg_retry_count,
      MAX(created_at) as last_created,
      MAX(synced_at) as last_synced
    FROM sync_queue
    GROUP BY organization_id, status;
  `);

  // 12. Create view for conflict statistics
  await knex.raw(`
    CREATE VIEW sync_conflict_stats AS
    SELECT 
      organization_id,
      entity_type,
      resolution_status,
      COUNT(*) as count,
      MAX(created_at) as last_conflict
    FROM sync_conflicts
    GROUP BY organization_id, entity_type, resolution_status;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop views
  await knex.raw('DROP VIEW IF EXISTS sync_conflict_stats;');
  await knex.raw('DROP VIEW IF EXISTS sync_queue_stats;');

  // Drop triggers
  const tables = [
    'visits',
    'evv_records',
    'time_entries',
    'care_plan_tasks',
    'clients',
    'caregivers',
  ];

  for (const tableName of tables) {
    await knex.raw(`DROP TRIGGER IF EXISTS ${tableName}_version_trigger ON ${tableName};`);
  }

  // Drop function
  await knex.raw('DROP FUNCTION IF EXISTS increment_version();');

  // Remove version columns
  await knex.schema.alterTable('caregivers', (table) => {
    table.dropColumn('version');
  });

  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('version');
  });

  await knex.schema.alterTable('care_plan_tasks', (table) => {
    table.dropColumn('version');
  });

  await knex.schema.alterTable('time_entries', (table) => {
    table.dropColumn('version');
  });

  await knex.schema.alterTable('evv_records', (table) => {
    table.dropColumn('version');
  });

  await knex.schema.alterTable('visits', (table) => {
    table.dropColumn('version');
  });

  // Drop tables
  await knex.schema.dropTableIfExists('sync_conflicts');
  await knex.schema.dropTableIfExists('sync_queue');
}
