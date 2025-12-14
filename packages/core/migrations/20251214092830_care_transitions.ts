/**
 * Care Transitions Migration
 *
 * Creates tables for transition of care support:
 * - care_transitions: Main transition records
 * - transition_checklist_items: Checklist items for transitions
 * - transition_support_resources: Support resources for families
 * - transition_communications: Communication logs
 * - transition_updates: Updates for activity feed
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Care Transitions table
  await knex.schema.createTable('care_transitions', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    // Client and family
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members');

    // Transition details
    table.string('transition_type', 50).notNullable();
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.string('urgency', 50).notNullable().defaultTo('PLANNED');

    // Timing
    table.date('anticipated_date');
    table.date('actual_start_date');
    table.date('actual_end_date');

    // Location details (JSON)
    table.jsonb('from_location').notNullable();
    table.jsonb('to_location').notNullable();

    // Reason and notes
    table.text('reason').notNullable();
    table.string('diagnosis_related', 500);
    table.text('coordinator_notes');
    table.text('family_visible_notes');

    // Care coordination
    table.uuid('assigned_coordinator_id').references('id').inTable('users');
    table.string('primary_physician', 255);
    table.string('discharge_manager', 255);

    // Follow-up
    table.boolean('follow_up_required').notNullable().defaultTo(false);
    table.date('follow_up_date');
    table.text('follow_up_notes');

    // Organization context
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('branch_id').notNullable().references('id').inTable('branches');

    // Audit fields
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('client_id');
    table.index('family_member_id');
    table.index('status');
    table.index('transition_type');
    table.index('organization_id');
    table.index('branch_id');
    table.index('assigned_coordinator_id');
    table.index(['status', 'organization_id']);
    table.index(['client_id', 'status']);
  });

  // Transition Checklist Items table
  await knex.schema.createTable('transition_checklist_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    table.uuid('transition_id').notNullable().references('id').inTable('care_transitions').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Item details
    table.string('category', 50).notNullable();
    table.string('title', 500).notNullable();
    table.text('description');
    table.string('priority', 20).notNullable().defaultTo('MEDIUM');

    // Completion
    table.boolean('is_completed').notNullable().defaultTo(false);
    table.timestamp('completed_at');
    table.uuid('completed_by').references('id').inTable('users');
    table.text('completion_notes');

    // Deadlines
    table.date('due_date');
    table.boolean('is_overdue').notNullable().defaultTo(false);

    // Assignment
    table.string('assigned_to', 50);
    table.uuid('assigned_user_id').references('id').inTable('users');

    // Order
    table.integer('sort_order').notNullable().defaultTo(0);

    // Organization context
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // Audit fields
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('transition_id');
    table.index('client_id');
    table.index('category');
    table.index('is_completed');
    table.index('due_date');
    table.index(['transition_id', 'is_completed']);
  });

  // Transition Support Resources table
  await knex.schema.createTable('transition_support_resources', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    table.string('transition_type', 50).notNullable();
    table.string('resource_type', 50).notNullable();

    // Content
    table.string('title', 500).notNullable();
    table.text('description');
    table.text('content');
    table.string('url', 2000);
    table.string('file_url', 2000);

    // Contact info
    table.string('contact_name', 255);
    table.string('contact_phone', 50);
    table.string('contact_email', 255);
    table.string('contact_role', 255);

    // Display
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);

    // Targeting
    table.boolean('available_for_all_orgs').notNullable().defaultTo(false);
    table.uuid('organization_id').references('id').inTable('organizations');

    // Audit fields
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('transition_type');
    table.index('resource_type');
    table.index('is_active');
    table.index('organization_id');
    table.index(['transition_type', 'is_active']);
  });

  // Transition Communications table
  await knex.schema.createTable('transition_communications', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    table.uuid('transition_id').notNullable().references('id').inTable('care_transitions').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members');

    // Communication details
    table.string('communication_type', 50).notNullable();
    table.string('subject', 500).notNullable();
    table.text('summary').notNullable();

    // Direction
    table.string('direction', 20).notNullable();

    // Staff involved
    table.uuid('staff_user_id').notNullable().references('id').inTable('users');
    table.string('staff_name', 255).notNullable();

    // Outcome
    table.text('outcome');
    table.boolean('follow_up_required').notNullable().defaultTo(false);
    table.date('follow_up_date');

    // Organization context
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // Audit fields
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('transition_id');
    table.index('client_id');
    table.index('family_member_id');
    table.index('communication_type');
    table.index('staff_user_id');
  });

  // Transition Updates table
  await knex.schema.createTable('transition_updates', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    table.uuid('transition_id').notNullable().references('id').inTable('care_transitions').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Update details
    table.string('update_type', 50).notNullable();
    table.string('title', 500).notNullable();
    table.text('description').notNullable();

    // Visibility
    table.boolean('is_public').notNullable().defaultTo(false);

    // Author
    table.uuid('author_user_id').notNullable().references('id').inTable('users');
    table.string('author_name', 255).notNullable();

    // Organization context
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // Audit fields
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('transition_id');
    table.index('client_id');
    table.index('update_type');
    table.index('is_public');
    table.index(['transition_id', 'is_public']);
  });

  // Care Transitions Revisions table for audit trail
  await knex.schema.createTable('care_transitions_revisions', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('entity_id').notNullable().references('id').inTable('care_transitions');
    table.string('revision_type', 50).notNullable();
    table.jsonb('before_data');
    table.jsonb('after_data');
    table.specificType('changed_fields', 'text[]');
    table.uuid('changed_by').references('id').inTable('users');
    table.string('change_reason', 1000);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('entity_id');
    table.index('changed_by');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('care_transitions_revisions');
  await knex.schema.dropTableIfExists('transition_updates');
  await knex.schema.dropTableIfExists('transition_communications');
  await knex.schema.dropTableIfExists('transition_support_resources');
  await knex.schema.dropTableIfExists('transition_checklist_items');
  await knex.schema.dropTableIfExists('care_transitions');
}
