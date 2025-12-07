/**
 * Migration: Create caregiver_burnout_snapshots table
 *
 * Stores historical burnout risk calculations for trending and analysis.
 * Snapshots are created each time burnout risk is calculated.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('caregiver_burnout_snapshots', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign keys
    table
      .uuid('caregiver_id')
      .notNullable()
      .references('id')
      .inTable('caregivers')
      .onDelete('CASCADE');

    table
      .uuid('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');

    // Snapshot metadata
    table.date('snapshot_date').notNullable();
    table.decimal('risk_score', 5, 2).notNullable().comment('Burnout risk score (0-100)');
    table
      .string('risk_level', 50)
      .notNullable()
      .comment('HEALTHY, AT_RISK, HIGH_RISK, or CRITICAL');

    // Indicators (stored as JSONB for analysis)
    table.jsonb('indicators').notNullable().comment('BurnoutIndicators snapshot');

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for efficient querying
    table.index('caregiver_id');
    table.index('organization_id');
    table.index(['caregiver_id', 'snapshot_date']);
    table.index(['organization_id', 'snapshot_date']);
    table.index('risk_level');

    // Composite index for trending queries
    table.index(['caregiver_id', 'snapshot_date'], 'idx_caregiver_trend');
  });

  // Add comment to table
  await knex.raw(`
    COMMENT ON TABLE caregiver_burnout_snapshots IS
    'Historical burnout risk snapshots for caregivers. Used for trending analysis and early intervention alerts.';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('caregiver_burnout_snapshots');
}
