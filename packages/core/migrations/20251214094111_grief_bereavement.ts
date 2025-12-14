/**
 * Grief and Bereavement Resources Migration
 *
 * Creates tables for sensitive handling of end-of-life situations
 * with appropriate resources, counseling referrals, and memorial features.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // Bereavement Resources Table
  // ============================================================================
  await knex.schema.createTable('bereavement_resources', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Resource identification
    table.string('title', 500).notNullable();
    table.text('description').notNullable();
    table.string('category', 50).notNullable();
    table.string('resource_type', 50).notNullable();
    table.string('status', 20).notNullable().defaultTo('ACTIVE');

    // Content
    table.text('content'); // For articles/guides (markdown)
    table.string('external_url', 2000);
    table.string('file_url', 2000);

    // Contact info (for services)
    table.string('contact_name', 255);
    table.string('contact_phone', 50);
    table.string('contact_email', 255);
    table.text('address');
    table.string('hours_of_operation', 255);

    // Metadata
    table.string('grief_stage', 20).notNullable().defaultTo('ANY');
    table.specificType('tags', 'text[]').defaultTo('{}');
    table.string('language', 10).notNullable().defaultTo('en');
    table.integer('estimated_read_time'); // In minutes

    // Applicability
    table.boolean('is_national').notNullable().defaultTo(true);
    table.specificType('states_covered', 'text[]');
    table.string('religion_specific', 100);

    // Quality/curation
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.integer('view_count').notNullable().defaultTo(0);
    table.integer('helpful_count').notNullable().defaultTo(0);
    table.timestamp('last_reviewed_at');
    table.uuid('reviewed_by');

    // Organization scope
    table.uuid('organization_id'); // null = system-wide resource

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index(['category', 'status']);
    table.index(['resource_type', 'status']);
    table.index(['grief_stage', 'status']);
    table.index(['organization_id', 'status']);
    table.index(['is_featured', 'sort_order']);
    table.index('is_deleted');
  });

  // ============================================================================
  // Bereavement Support Table
  // ============================================================================
  await knex.schema.createTable('bereavement_support', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Family context
    table.uuid('client_id').notNullable();
    table.uuid('family_member_id').notNullable();

    // Loss details
    table.string('loss_type', 30).notNullable();
    table.date('date_of_loss');
    table.date('anticipated_date');

    // Support status
    table.string('status', 20).notNullable().defaultTo('ACTIVE');
    table.date('start_date').notNullable();
    table.date('end_date');

    // Assigned support
    table.uuid('assigned_coordinator_id');

    // Support plan
    table.text('initial_assessment_notes');
    table.text('support_plan_notes');
    table.text('special_considerations');

    // Communication preferences
    table.string('preferred_contact_method', 20);
    table.string('contact_frequency', 20);
    table.date('do_not_contact_until');

    // Follow-up tracking
    table.date('next_follow_up_date');
    table.date('last_contact_date');
    table.integer('total_contacts').notNullable().defaultTo(0);

    // Resources shared
    table.specificType('resources_shared', 'uuid[]').defaultTo('{}');

    // Memorial info
    table.uuid('memorial_id');

    // Family feedback
    table.text('family_feedback');

    // Organization context
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('client_id');
    table.index('family_member_id');
    table.index(['status', 'organization_id']);
    table.index(['assigned_coordinator_id', 'status']);
    table.index('next_follow_up_date');
    table.index('is_deleted');
  });

  // ============================================================================
  // Support Interactions Table
  // ============================================================================
  await knex.schema.createTable('bereavement_support_interactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('bereavement_support_id').notNullable();
    table.uuid('client_id').notNullable();

    // Interaction details
    table.string('interaction_type', 30).notNullable();
    table.date('interaction_date').notNullable();
    table.string('interaction_time', 10);
    table.integer('duration_minutes');

    // Participants
    table.uuid('coordinator_id').notNullable();
    table.specificType('family_member_ids', 'uuid[]').defaultTo('{}');

    // Notes
    table.text('summary').notNullable();
    table.string('emotional_state', 100);
    table.text('concerns_raised');
    table.text('next_steps');

    // Resources/referrals
    table.specificType('resources_shared', 'uuid[]').defaultTo('{}');
    table.specificType('referrals_made', 'text[]').defaultTo('{}');

    // Follow-up
    table.boolean('requires_follow_up').notNullable().defaultTo(false);
    table.date('follow_up_date');
    table.text('follow_up_notes');

    // Organization context
    table.uuid('organization_id').notNullable();

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('bereavement_support_id');
    table.index('client_id');
    table.index(['interaction_date', 'coordinator_id']);
    table.index(['requires_follow_up', 'follow_up_date']);
    table.index('is_deleted');
  });

  // ============================================================================
  // Memorials Table
  // ============================================================================
  await knex.schema.createTable('memorials', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('client_id').notNullable();

    // Memorial content
    table.string('title', 500).notNullable();
    table.text('biography');
    table.text('obituary');

    // Media
    table.string('photo_url', 2000);
    table.specificType('additional_photos', 'text[]').defaultTo('{}');
    table.string('video_url', 2000);

    // Key dates
    table.date('birth_date');
    table.date('death_date');
    table.date('service_date');
    table.string('service_location', 500);

    // Donations
    table.jsonb('donation_info');

    // Guestbook settings
    table.boolean('allow_guestbook').notNullable().defaultTo(true);
    table.boolean('allow_candles').notNullable().defaultTo(true);

    // Privacy and access
    table.string('privacy', 20).notNullable().defaultTo('PRIVATE');
    table.string('access_code', 50);
    table.boolean('is_published').notNullable().defaultTo(false);
    table.timestamp('published_at');

    // Family management
    table.uuid('created_by_family_member_id').notNullable();
    table.specificType('family_admin_ids', 'uuid[]').defaultTo('{}');

    // Organization context
    table.uuid('organization_id').notNullable();

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('client_id');
    table.index(['is_published', 'privacy']);
    table.index('organization_id');
    table.index('is_deleted');
  });

  // ============================================================================
  // Memorial Guestbook Entries Table
  // ============================================================================
  await knex.schema.createTable('memorial_guestbook_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('memorial_id').notNullable();

    // Author info
    table.string('author_name', 255).notNullable();
    table.string('author_email', 255);
    table.string('author_relationship', 100);

    // Content
    table.text('message').notNullable();
    table.boolean('is_candle').notNullable().defaultTo(false);

    // Moderation
    table.boolean('is_approved').notNullable().defaultTo(false);
    table.uuid('approved_by');
    table.timestamp('approved_at');
    table.boolean('is_reported').notNullable().defaultTo(false);
    table.text('report_reason');

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('memorial_id');
    table.index(['memorial_id', 'is_approved']);
    table.index(['is_reported', 'is_approved']);
    table.index('is_deleted');
  });

  // ============================================================================
  // Bereavement Support Requests Table
  // ============================================================================
  await knex.schema.createTable('bereavement_support_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('bereavement_support_id'); // May be null before support record exists
    table.uuid('client_id').notNullable();
    table.uuid('family_member_id').notNullable();

    // Request details
    table.string('request_type', 30).notNullable();
    table.string('status', 20).notNullable().defaultTo('PENDING');
    table.text('description').notNullable();
    table.string('urgency', 10).notNullable().defaultTo('MEDIUM');

    // Response
    table.uuid('assigned_to');
    table.text('response_notes');
    table.timestamp('completed_at');

    // Organization context
    table.uuid('organization_id').notNullable();

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('bereavement_support_id');
    table.index('client_id');
    table.index('family_member_id');
    table.index(['status', 'urgency']);
    table.index(['assigned_to', 'status']);
    table.index('is_deleted');
  });

  // ============================================================================
  // Family Saved Resources Table (bookmarks)
  // ============================================================================
  await knex.schema.createTable('bereavement_saved_resources', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('family_member_id').notNullable();
    table.uuid('resource_id').notNullable();
    table.boolean('was_helpful'); // "Was this helpful?" feedback
    table.text('notes'); // Personal notes on resource

    // Entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Unique constraint - one save per family member per resource
    table.unique(['family_member_id', 'resource_id']);

    // Indexes
    table.index('family_member_id');
    table.index('resource_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('bereavement_saved_resources');
  await knex.schema.dropTableIfExists('bereavement_support_requests');
  await knex.schema.dropTableIfExists('memorial_guestbook_entries');
  await knex.schema.dropTableIfExists('memorials');
  await knex.schema.dropTableIfExists('bereavement_support_interactions');
  await knex.schema.dropTableIfExists('bereavement_support');
  await knex.schema.dropTableIfExists('bereavement_resources');
}
