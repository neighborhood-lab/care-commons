/**
 * Create schedule scenario tables
 *
 * Enables "what-if" scenario planning for schedule changes.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Schedule scenarios table
  await knex.schema.createTable('schedule_scenarios', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.string('name', 200).notNullable();
    table.text('description');
    table
      .enum('scenario_type', [
        'VACATION_COVERAGE',
        'STAFF_CHANGE',
        'CLIENT_CHANGE',
        'OPTIMIZATION',
        'TRAINING',
        'GENERAL',
      ])
      .notNullable();
    table
      .enum('status', ['DRAFT', 'IN_REVIEW', 'APPROVED', 'APPLIED', 'REJECTED', 'ARCHIVED'])
      .notNullable()
      .defaultTo('DRAFT');
    table.date('date_range_start').notNullable();
    table.date('date_range_end').notNullable();
    table.timestamp('baseline_date').notNullable();
    table.integer('visit_count').notNullable().defaultTo(0);
    table.integer('change_count').notNullable().defaultTo(0);
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('applied_at');
    table.uuid('applied_by').references('id').inTable('users');
    table.text('notes');
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'status']);
    table.index(['organization_id', 'created_at']);
  });

  // Scenario visits table - copies of visits for scenario planning
  await knex.schema.createTable('scenario_visits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('scenario_id').notNullable().references('id').inTable('schedule_scenarios').onDelete('CASCADE');
    table.uuid('original_visit_id').references('id').inTable('visits');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('caregiver_id').references('id').inTable('users');
    table.date('scheduled_date').notNullable();
    table.time('scheduled_start_time').notNullable();
    table.time('scheduled_end_time').notNullable();
    table.string('status', 50).notNullable();
    table
      .enum('change_type', ['UNCHANGED', 'REASSIGNED', 'RESCHEDULED', 'CANCELLED', 'ADDED'])
      .notNullable()
      .defaultTo('UNCHANGED');
    table.text('change_reason');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at');

    // Indexes
    table.index(['scenario_id']);
    table.index(['scenario_id', 'change_type']);
    table.index(['original_visit_id']);
    table.index(['caregiver_id', 'scheduled_date']);
    table.index(['client_id', 'scheduled_date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('scenario_visits');
  await knex.schema.dropTableIfExists('schedule_scenarios');
}
