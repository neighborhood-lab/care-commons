/**
 * Create schedule change history table for undo/redo support
 *
 * Tracks all schedule changes to enable undo/redo functionality.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('schedule_change_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').references('id').inTable('branches');

    // User who made the change
    table.uuid('user_id').notNullable().references('id').inTable('users');

    // Change type and entity tracking
    table
      .enum('change_type', [
        'VISIT_CREATE',
        'VISIT_UPDATE',
        'VISIT_DELETE',
        'VISIT_ASSIGN',
        'VISIT_UNASSIGN',
        'VISIT_STATUS_CHANGE',
        'VISIT_RESCHEDULE',
        'PATTERN_CREATE',
        'PATTERN_UPDATE',
        'PATTERN_DELETE',
        'BULK_CREATE',
        'BULK_UPDATE',
        'BULK_DELETE',
      ])
      .notNullable();
    table.enum('entity_type', ['VISIT', 'SERVICE_PATTERN']).notNullable();
    table.uuid('entity_id'); // The main entity affected (null for bulk operations)
    table.specificType('entity_ids', 'uuid[]'); // For bulk operations

    // Change data - stores before/after state for reversal
    table.jsonb('before_state'); // State before the change
    table.jsonb('after_state'); // State after the change
    table.jsonb('change_details'); // Additional details about the change

    // Undo/redo tracking
    table.boolean('is_undone').notNullable().defaultTo(false);
    table.uuid('undone_by').references('id').inTable('users');
    table.timestamp('undone_at');
    table.boolean('is_redone').notNullable().defaultTo(false);
    table.uuid('redone_by').references('id').inTable('users');
    table.timestamp('redone_at');

    // Session tracking - allows grouping related changes
    table.uuid('session_id'); // Groups changes made in same editing session
    table.integer('sequence_number'); // Order within session for proper undo sequence

    // Metadata
    table.text('description'); // Human-readable description of the change
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at'); // Optional expiration for old changes

    // Indexes
    table.index(['organization_id', 'user_id', 'created_at']);
    table.index(['entity_type', 'entity_id']);
    table.index(['session_id', 'sequence_number']);
    table.index(['is_undone', 'organization_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('schedule_change_history');
}
