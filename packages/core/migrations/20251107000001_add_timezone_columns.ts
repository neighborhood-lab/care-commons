import type { Knex } from 'knex';

/**
 * Migration: Add Timezone Columns
 * 
 * Adds timezone support to key tables for proper timestamp handling:
 * - users table: timezone preference for user-specific scheduling
 * - organizations table: default timezone for organization-wide operations
 * - branches table: timezone for branch-specific scheduling
 * - clients table: timezone for client visit scheduling
 * - caregivers table: timezone for caregiver scheduling
 * 
 * This ensures proper handling of scheduling across different timezones
 * and prevents confusion with visit times and EVV compliance.
 */
export async function up(knex: Knex): Promise<void> {
  // Add timezone column to users table
  await knex.schema.alterTable('users', (table) => {
    table.string('timezone', 50).defaultTo('America/Chicago');
    table.check(`timezone IN ('America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC', 'America/Anchorage', 'America/Honolulu', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific') OR timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$'`);
  });

  // Add timezone column to organizations table
  await knex.schema.alterTable('organizations', (table) => {
    table.string('timezone', 50).notNullable().defaultTo('America/Chicago');
    table.check(`timezone IN ('America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC', 'America/Anchorage', 'America/Honolulu', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific') OR timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$'`);
  });

  // Add timezone column to branches table
  await knex.schema.alterTable('branches', (table) => {
    table.string('timezone', 50).notNullable().defaultTo('America/Chicago');
    table.check(`timezone IN ('America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC', 'America/Anchorage', 'America/Honolulu', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific') OR timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$'`);
  });

  // Add timezone column to clients table
  await knex.schema.alterTable('clients', (table) => {
    table.string('timezone', 50).notNullable().defaultTo('America/Chicago');
    table.check(`timezone IN ('America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC', 'America/Anchorage', 'America/Honolulu', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific') OR timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$'`);
  });

  // Add timezone column to caregivers table
  await knex.schema.alterTable('caregivers', (table) => {
    table.string('timezone', 50).notNullable().defaultTo('America/Chicago');
    table.check(`timezone IN ('America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC', 'America/Anchorage', 'America/Honolulu', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific') OR timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$'`);
  });

  // Add indexes for timezone queries
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_organizations_timezone ON organizations(timezone)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_branches_timezone ON branches(timezone)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_clients_timezone ON clients(timezone)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_caregivers_timezone ON caregivers(timezone)');

  // Add comments for documentation
  await knex.raw("COMMENT ON COLUMN users.timezone IS 'User timezone preference for scheduling and display'");
  await knex.raw("COMMENT ON COLUMN organizations.timezone IS 'Organization default timezone for operations'");
  await knex.raw("COMMENT ON COLUMN branches.timezone IS 'Branch timezone for local scheduling'");
  await knex.raw("COMMENT ON COLUMN clients.timezone IS 'Client timezone for visit scheduling'");
  await knex.raw("COMMENT ON COLUMN caregivers.timezone IS 'Caregiver timezone for scheduling and availability'");

  // Update existing visits that don't have timezone set to use client's timezone
  // Note: visits table already has timezone column from previous migration
  await knex.raw(`
    UPDATE visits v
    SET timezone = COALESCE(c.timezone, 'America/Chicago')
    FROM clients c
    WHERE v.client_id = c.id
    AND v.timezone = 'America/New_York'
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop indexes
  await knex.raw('DROP INDEX IF EXISTS idx_users_timezone');
  await knex.raw('DROP INDEX IF EXISTS idx_organizations_timezone');
  await knex.raw('DROP INDEX IF EXISTS idx_branches_timezone');
  await knex.raw('DROP INDEX IF EXISTS idx_clients_timezone');
  await knex.raw('DROP INDEX IF EXISTS idx_caregivers_timezone');

  // Drop timezone columns (in reverse order)
  await knex.schema.alterTable('caregivers', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('branches', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('organizations', (table) => {
    table.dropColumn('timezone');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('timezone');
  });
}