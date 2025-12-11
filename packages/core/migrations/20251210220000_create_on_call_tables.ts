/**
 * Create on-call schedule management tables
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // On-call rotations (templates for generating shifts)
  await knex.schema.createTable('on_call_rotations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');
    table.string('name', 100).notNullable();
    table.text('description');
    table
      .enum('period_type', ['WEEKDAY', 'WEEKEND', 'HOLIDAY', 'OVERNIGHT', 'CUSTOM'])
      .notNullable();
    table.time('default_start_time').notNullable();
    table.time('default_end_time').notNullable();
    table
      .enum('rotation_pattern', ['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY'])
      .notNullable()
      .defaultTo('WEEKLY');
    table.specificType('caregiver_ids', 'uuid[]').notNullable();
    table.specificType('backup_caregiver_ids', 'uuid[]');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'is_active']);
    table.index(['branch_id']);
  });

  // On-call shifts (actual scheduled on-call periods)
  await knex.schema.createTable('on_call_shifts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');
    table.uuid('rotation_id').references('id').inTable('on_call_rotations');
    table.uuid('caregiver_id').notNullable().references('id').inTable('users');
    table
      .enum('period_type', ['WEEKDAY', 'WEEKEND', 'HOLIDAY', 'OVERNIGHT', 'CUSTOM'])
      .notNullable();
    table.timestamp('start_date_time').notNullable();
    table.timestamp('end_date_time').notNullable();
    table
      .enum('status', ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
      .notNullable()
      .defaultTo('SCHEDULED');
    table.integer('escalation_level').notNullable().defaultTo(0);
    table.uuid('backup_caregiver_id').references('id').inTable('users');
    table.text('notes');
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['organization_id', 'start_date_time', 'end_date_time']);
    table.index(['caregiver_id', 'start_date_time']);
    table.index(['branch_id', 'start_date_time']);
    table.index(['status']);
  });

  // On-call escalations (track when shifts are escalated)
  await knex.schema.createTable('on_call_escalations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('shift_id').notNullable().references('id').inTable('on_call_shifts');
    table.uuid('from_caregiver_id').notNullable().references('id').inTable('users');
    table.uuid('to_caregiver_id').notNullable().references('id').inTable('users');
    table.integer('escalation_level').notNullable();
    table.text('reason').notNullable();
    table.uuid('escalated_by').notNullable().references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['shift_id']);
    table.index(['from_caregiver_id']);
    table.index(['to_caregiver_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('on_call_escalations');
  await knex.schema.dropTableIfExists('on_call_shifts');
  await knex.schema.dropTableIfExists('on_call_rotations');
}
