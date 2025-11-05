import type { Knex } from 'knex';

/**
 * Family Engagement & Transparency Migration
 *
 * Adds database tables and fields to support family portal and communication:
 * - Authorized family contacts with role-based access
 * - Family-friendly progress summaries
 * - Family notification preferences and delivery tracking
 * - Care team messaging between coordinators and caregivers
 */
export async function up(knex: Knex): Promise<void> {
  // Authorized Family Contacts Table
  await knex.schema.createTable('authorized_family_contacts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Contact information
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 50);
    table.string('relationship', 100).notNullable(); // Parent, Spouse, Guardian, etc.

    // Access control
    table.string('role', 50).notNullable().defaultTo('VIEW_ONLY');
    table.jsonb('permissions').notNullable().defaultTo('{}');
    table.string('access_level', 50).notNullable().defaultTo('BASIC');

    // Portal access
    table.uuid('portal_user_id'); // Links to users table if they have login
    table.string('access_code', 100).unique(); // Unique access code for portal login
    table.timestamp('access_code_expires_at');
    table.boolean('portal_access_enabled').defaultTo(true);
    table.timestamp('last_portal_access_at');

    // Consent & authorization
    table.boolean('is_legal_guardian').defaultTo(false);
    table.boolean('consent_given').defaultTo(false);
    table.timestamp('consent_date');
    table.string('consent_method', 50); // E_SIGNATURE, VERBAL, WRITTEN, etc.
    table.text('consent_notes');
    table.jsonb('consent_documents'); // Array of document references

    // Communication preferences
    table.boolean('notify_by_email').defaultTo(true);
    table.boolean('notify_by_sms').defaultTo(false);
    table.boolean('notify_by_push').defaultTo(false);
    table.jsonb('notification_preferences'); // Detailed notification settings

    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.text('status_notes');
    table.timestamp('activated_at');
    table.timestamp('deactivated_at');
    table.uuid('deactivated_by');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`role IN ('VIEW_ONLY', 'RECEIVE_UPDATES', 'CARE_COORDINATOR', 'EMERGENCY_CONTACT')`);
    table.check(`access_level IN ('BASIC', 'STANDARD', 'FULL')`);
    table.check(`status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED')`);
    table.check(`consent_method IN ('E_SIGNATURE', 'VERBAL', 'WRITTEN', 'DIGITAL', NULL)`);

    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.foreign('portal_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('deactivated_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for authorized_family_contacts
  await knex.raw('CREATE INDEX idx_family_contacts_client ON authorized_family_contacts(client_id, status)');
  await knex.raw('CREATE INDEX idx_family_contacts_organization ON authorized_family_contacts(organization_id, status)');
  await knex.raw('CREATE INDEX idx_family_contacts_email ON authorized_family_contacts(email) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_family_contacts_access_code ON authorized_family_contacts(access_code) WHERE portal_access_enabled = true');
  await knex.raw('CREATE INDEX idx_family_contacts_portal_user ON authorized_family_contacts(portal_user_id) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_family_contacts_guardian ON authorized_family_contacts(client_id) WHERE is_legal_guardian = true AND status = \'ACTIVE\'');

  // Family Progress Summaries Table
  await knex.schema.createTable('family_progress_summaries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable();
    table.uuid('organization_id').notNullable();
    table.uuid('care_plan_id');
    table.uuid('progress_note_id'); // Link to original progress note

    // Summary details
    table.string('summary_type', 50).notNullable(); // DAILY, WEEKLY, MONTHLY, INCIDENT, MILESTONE
    table.date('summary_date').notNullable();
    table.daterange('date_range'); // PostgreSQL daterange type for period summaries

    // Content - Plain language for families
    table.string('title', 255).notNullable();
    table.text('summary').notNullable(); // Plain-language summary
    table.text('highlights'); // Key achievements or positive observations
    table.text('areas_of_focus'); // Current focus areas in simple terms
    table.jsonb('activities_completed'); // Array of activity descriptions

    // Progress indicators
    table.jsonb('goal_updates'); // Array of goal progress in family-friendly terms
    table.string('overall_status', 50); // EXCELLENT, GOOD, STABLE, NEEDS_ATTENTION
    table.integer('engagement_score'); // 1-10 scale of client engagement
    table.integer('wellbeing_score'); // 1-10 scale of overall wellbeing

    // Health & safety observations
    table.jsonb('health_observations'); // General health observations (non-clinical)
    table.jsonb('safety_notes'); // Any safety concerns or updates
    table.jsonb('mood_behavior'); // Mood and behavior observations

    // Care team insights
    table.text('caregiver_notes'); // Notes from caregiver to family
    table.text('coordinator_notes'); // Notes from care coordinator
    table.jsonb('recommendations'); // Suggestions for family involvement

    // Multimedia
    table.jsonb('photos'); // Array of photo references (with consent)
    table.jsonb('attachments'); // Other documents or media

    // Visibility & approval
    table.boolean('visible_to_family').defaultTo(true);
    table.boolean('requires_review').defaultTo(false);
    table.boolean('reviewed').defaultTo(false);
    table.uuid('reviewed_by');
    table.timestamp('reviewed_at');
    table.text('review_notes');

    // Delivery tracking
    table.string('delivery_status', 50).notNullable().defaultTo('DRAFT');
    table.timestamp('sent_at');
    table.jsonb('sent_to'); // Array of family contact IDs who received this
    table.jsonb('read_by'); // Array of {contact_id, read_at} objects

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`summary_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'INCIDENT', 'MILESTONE', 'AD_HOC')`);
    table.check(`overall_status IN ('EXCELLENT', 'GOOD', 'STABLE', 'NEEDS_ATTENTION', 'CONCERNING')`);
    table.check(`delivery_status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SENT', 'READ')`);
    table.check(`engagement_score IS NULL OR (engagement_score >= 1 AND engagement_score <= 10)`);
    table.check(`wellbeing_score IS NULL OR (wellbeing_score >= 1 AND wellbeing_score <= 10)`);

    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.foreign('care_plan_id').references('id').inTable('care_plans').onDelete('SET NULL');
    table.foreign('progress_note_id').references('id').inTable('progress_notes').onDelete('SET NULL');
    table.foreign('reviewed_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_progress_summaries
  await knex.raw('CREATE INDEX idx_family_summaries_client ON family_progress_summaries(client_id, summary_date DESC)');
  await knex.raw('CREATE INDEX idx_family_summaries_organization ON family_progress_summaries(organization_id, summary_date DESC)');
  await knex.raw('CREATE INDEX idx_family_summaries_care_plan ON family_progress_summaries(care_plan_id, summary_date DESC)');
  await knex.raw('CREATE INDEX idx_family_summaries_type ON family_progress_summaries(summary_type, summary_date DESC)');
  await knex.raw('CREATE INDEX idx_family_summaries_visible ON family_progress_summaries(client_id, summary_date DESC) WHERE visible_to_family = true');
  await knex.raw('CREATE INDEX idx_family_summaries_pending_review ON family_progress_summaries(organization_id) WHERE requires_review = true AND reviewed = false');
  await knex.raw('CREATE INDEX idx_family_summaries_delivery ON family_progress_summaries(delivery_status, sent_at DESC)');
  await knex.raw('CREATE INDEX idx_family_summaries_date_range ON family_progress_summaries USING GIST (date_range)');

  // Family Notifications Table
  await knex.schema.createTable('family_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('family_contact_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Notification details
    table.string('notification_type', 100).notNullable();
    table.string('category', 50).notNullable(); // PROGRESS, SCHEDULE, CARE_PLAN, COMMUNICATION, ALERT
    table.string('priority', 50).notNullable().defaultTo('NORMAL');

    // Content
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.text('summary'); // Short summary for SMS/push
    table.jsonb('data'); // Additional structured data

    // Related entities
    table.string('related_entity_type', 100); // progress_summary, visit, message, etc.
    table.uuid('related_entity_id');
    table.string('action_url', 500); // Deep link to relevant content in portal

    // Scheduling
    table.timestamp('scheduled_for');
    table.boolean('send_immediately').defaultTo(false);

    // Delivery channels
    table.boolean('send_email').defaultTo(false);
    table.boolean('send_sms').defaultTo(false);
    table.boolean('send_push').defaultTo(false);
    table.boolean('show_in_portal').defaultTo(true);

    // Delivery tracking
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('read_at');
    table.timestamp('acknowledged_at');

    // Email delivery
    table.string('email_status', 50);
    table.string('email_message_id', 255);
    table.text('email_error');
    table.timestamp('email_sent_at');
    table.timestamp('email_opened_at');
    table.timestamp('email_clicked_at');

    // SMS delivery
    table.string('sms_status', 50);
    table.string('sms_message_id', 255);
    table.text('sms_error');
    table.timestamp('sms_sent_at');
    table.timestamp('sms_delivered_at');

    // Push delivery
    table.string('push_status', 50);
    table.string('push_message_id', 255);
    table.text('push_error');
    table.timestamp('push_sent_at');
    table.timestamp('push_delivered_at');

    // Retry logic
    table.integer('retry_count').defaultTo(0);
    table.timestamp('next_retry_at');
    table.text('failure_reason');

    // Expiration
    table.timestamp('expires_at');
    table.boolean('expired').defaultTo(false);

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`category IN ('PROGRESS', 'SCHEDULE', 'CARE_PLAN', 'COMMUNICATION', 'ALERT', 'SYSTEM')`);
    table.check(`priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);
    table.check(`status IN ('PENDING', 'SCHEDULED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED', 'EXPIRED')`);
    table.check(`retry_count >= 0 AND retry_count <= 5`);

    // Foreign keys
    table.foreign('family_contact_id').references('id').inTable('authorized_family_contacts').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_notifications
  await knex.raw('CREATE INDEX idx_family_notifications_contact ON family_notifications(family_contact_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_notifications_client ON family_notifications(client_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_notifications_organization ON family_notifications(organization_id, status, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_notifications_status ON family_notifications(status, scheduled_for)');
  await knex.raw('CREATE INDEX idx_family_notifications_pending ON family_notifications(status, scheduled_for) WHERE status IN (\'PENDING\', \'SCHEDULED\')');
  await knex.raw('CREATE INDEX idx_family_notifications_failed ON family_notifications(status, retry_count, next_retry_at) WHERE status = \'FAILED\'');
  await knex.raw('CREATE INDEX idx_family_notifications_unread ON family_notifications(family_contact_id, read_at) WHERE read_at IS NULL AND show_in_portal = true');
  await knex.raw('CREATE INDEX idx_family_notifications_priority ON family_notifications(priority, status, created_at DESC) WHERE priority IN (\'HIGH\', \'URGENT\')');
  await knex.raw('CREATE INDEX idx_family_notifications_related ON family_notifications(related_entity_type, related_entity_id)');

  // Care Team Messages Table
  await knex.schema.createTable('care_team_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();
    table.uuid('client_id'); // Optional - message may be client-specific or general

    // Thread management
    table.uuid('thread_id'); // For grouping related messages
    table.uuid('parent_message_id'); // For replies
    table.integer('thread_depth').defaultTo(0);

    // Participants
    table.uuid('sender_id').notNullable();
    table.string('sender_type', 50).notNullable(); // USER, CAREGIVER, COORDINATOR, SYSTEM
    table.jsonb('recipients').notNullable(); // Array of {user_id, type} objects
    table.jsonb('cc'); // Carbon copy recipients

    // Message content
    table.string('subject', 255);
    table.text('message').notNullable();
    table.string('message_type', 50).notNullable().defaultTo('DIRECT');
    table.string('category', 50); // SCHEDULE, CARE_PLAN, INCIDENT, QUESTION, GENERAL
    table.string('priority', 50).notNullable().defaultTo('NORMAL');

    // Attachments
    table.jsonb('attachments'); // Array of file references
    table.boolean('has_attachments').defaultTo(false);

    // Related entities
    table.uuid('visit_id'); // Link to specific visit
    table.uuid('care_plan_id'); // Link to care plan
    table.uuid('task_id'); // Link to specific task
    table.string('related_entity_type', 100);
    table.uuid('related_entity_id');

    // Delivery & read status
    table.jsonb('delivery_status'); // Per-recipient delivery tracking
    table.jsonb('read_status'); // Per-recipient read tracking
    table.timestamp('first_read_at');
    table.boolean('all_read').defaultTo(false);

    // Flags & status
    table.boolean('is_urgent').defaultTo(false);
    table.boolean('requires_response').defaultTo(false);
    table.boolean('is_pinned').defaultTo(false);
    table.boolean('is_archived').defaultTo(false);
    table.string('status', 50).notNullable().defaultTo('SENT');

    // Response tracking
    table.boolean('has_responses').defaultTo(false);
    table.integer('response_count').defaultTo(0);
    table.timestamp('last_response_at');

    // Notifications sent
    table.boolean('email_sent').defaultTo(false);
    table.boolean('push_sent').defaultTo(false);
    table.boolean('sms_sent').defaultTo(false);
    table.timestamp('notifications_sent_at');

    // Expiration & cleanup
    table.timestamp('expires_at');
    table.boolean('deleted').defaultTo(false);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`sender_type IN ('USER', 'CAREGIVER', 'COORDINATOR', 'ADMINISTRATOR', 'SYSTEM')`);
    table.check(`message_type IN ('DIRECT', 'BROADCAST', 'ANNOUNCEMENT', 'ALERT', 'REMINDER')`);
    table.check(`category IN ('SCHEDULE', 'CARE_PLAN', 'INCIDENT', 'QUESTION', 'GENERAL', 'TRAINING', 'POLICY', NULL)`);
    table.check(`priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);
    table.check(`status IN ('DRAFT', 'SENT', 'DELIVERED', 'READ', 'ARCHIVED', 'DELETED')`);
    table.check(`thread_depth >= 0 AND thread_depth <= 10`);
    table.check(`response_count >= 0`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('SET NULL');
    table.foreign('sender_id').references('id').inTable('users');
    table.foreign('parent_message_id').references('id').inTable('care_team_messages').onDelete('SET NULL');
    table.foreign('visit_id').references('id').inTable('visits').onDelete('SET NULL');
    table.foreign('care_plan_id').references('id').inTable('care_plans').onDelete('SET NULL');
    table.foreign('deleted_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for care_team_messages
  await knex.raw('CREATE INDEX idx_care_messages_organization ON care_team_messages(organization_id, created_at DESC) WHERE deleted = false');
  await knex.raw('CREATE INDEX idx_care_messages_sender ON care_team_messages(sender_id, created_at DESC) WHERE deleted = false');
  await knex.raw('CREATE INDEX idx_care_messages_client ON care_team_messages(client_id, created_at DESC) WHERE deleted = false AND client_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_care_messages_thread ON care_team_messages(thread_id, created_at ASC) WHERE thread_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_care_messages_parent ON care_team_messages(parent_message_id) WHERE parent_message_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_care_messages_recipients ON care_team_messages USING GIN (recipients)');
  await knex.raw('CREATE INDEX idx_care_messages_unread ON care_team_messages(organization_id, created_at DESC) WHERE all_read = false AND deleted = false');
  await knex.raw('CREATE INDEX idx_care_messages_urgent ON care_team_messages(organization_id, created_at DESC) WHERE is_urgent = true AND deleted = false');
  await knex.raw('CREATE INDEX idx_care_messages_requires_response ON care_team_messages(organization_id, created_at) WHERE requires_response = true AND has_responses = false AND deleted = false');
  await knex.raw('CREATE INDEX idx_care_messages_visit ON care_team_messages(visit_id) WHERE visit_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_care_messages_care_plan ON care_team_messages(care_plan_id) WHERE care_plan_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_care_messages_category ON care_team_messages(category, created_at DESC) WHERE deleted = false AND category IS NOT NULL');

  // Full-text search indexes
  await knex.raw(`
    CREATE INDEX idx_family_summaries_fulltext ON family_progress_summaries
    USING GIN (to_tsvector('english', title || ' ' || summary || ' ' || COALESCE(highlights, '') || ' ' || COALESCE(areas_of_focus, '')))
  `);

  await knex.raw(`
    CREATE INDEX idx_care_messages_fulltext ON care_team_messages
    USING GIN (to_tsvector('english', COALESCE(subject, '') || ' ' || message))
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await knex.schema.dropTableIfExists('care_team_messages');
  await knex.schema.dropTableIfExists('family_notifications');
  await knex.schema.dropTableIfExists('family_progress_summaries');
  await knex.schema.dropTableIfExists('authorized_family_contacts');
}
