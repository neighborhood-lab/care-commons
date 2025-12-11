/**
 * Create callouts table for tracking caregiver callouts
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('callouts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('caregiver_id').notNullable().references('id').inTable('users');
    table.date('callout_date').notNullable();
    table
      .enum('reason', [
        'SICK',
        'FAMILY_EMERGENCY',
        'CAR_TROUBLE',
        'WEATHER',
        'PERSONAL',
        'NO_SHOW',
        'OTHER',
      ])
      .notNullable();
    table.text('reason_details');
    table.timestamp('reported_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('reported_by').notNullable().references('id').inTable('users');
    table.integer('affected_visit_count').notNullable().defaultTo(0);
    table.timestamp('resolved_at');
    table.text('resolution_notes');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'callout_date']);
    table.index(['caregiver_id', 'callout_date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('callouts');
}
