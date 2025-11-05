import type { Knex } from 'knex';

/**
 * Migration: Family Engagement - Communication & Messaging
 *
 * This migration creates the database schema for family-staff communication,
 * including secure messaging, automated progress updates, and read receipts.
 *
 * Tables:
 * - message_threads: Conversation groupings between families and staff
 * - messages: Individual messages within threads
 * - message_participants: Who can view/participate in each thread
 * - message_read_receipts: Track when messages are read
 * - message_attachments: Files attached to messages
 * - progress_updates: Automated care progress reports sent to families
 * - communication_templates: Reusable message templates for common communications
 */

export async function up(knex: Knex): Promise<void> {
  // ==========================================
  // 1. MESSAGE THREADS TABLE
  // ==========================================
  await knex.schema.createTable('message_threads', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients'); // All threads are about a client

    // Thread details
    table.string('subject', 500); // May be null for ongoing conversations
    table.string('thread_type', 50).notNullable().defaultTo('GENERAL'); // GENERAL, CARE_QUESTION, SCHEDULE_REQUEST, BILLING_INQUIRY, CONCERN, INCIDENT_FOLLOWUP
    table.string('priority', 20).defaultTo('NORMAL'); // LOW, NORMAL, HIGH, URGENT
    table.string('category', 100); // CARE_PLAN, MEDICATION, SCHEDULING, BILLING, GENERAL, etc.

    // Status and lifecycle
    table.string('status', 50).notNullable().defaultTo('OPEN'); // OPEN, WAITING_FAMILY, WAITING_STAFF, RESOLVED, CLOSED, ARCHIVED
    table.timestamp('last_message_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('last_message_by').references('id').inTable('users'); // Can be null if by family member
    table.uuid('last_message_by_family').references('id').inTable('family_members');
    table.integer('message_count').defaultTo(0);

    // Assignment
    table.uuid('assigned_to_user').references('id').inTable('users'); // Staff member responsible for responding
    table.uuid('assigned_to_branch').references('id').inTable('branches');
    table.timestamp('assigned_at');

    // SLA tracking
    table.timestamp('first_response_at'); // When staff first responded
    table.timestamp('resolved_at'); // When marked as resolved
    table.integer('response_time_minutes'); // Time to first response
    table.text('resolution_notes'); // How it was resolved

    // Moderation
    table.boolean('requires_moderation').defaultTo(false);
    table.boolean('is_flagged').defaultTo(false);
    table.text('flag_reason');
    table.uuid('flagged_by').references('id').inTable('users');
    table.timestamp('flagged_at');

    // Metadata
    table.jsonb('tags'); // Array of tags for categorization
    table.jsonb('custom_fields');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users'); // Can be null if initiated by family
    table.uuid('created_by_family').references('id').inTable('family_members');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('archived_at');
    table.uuid('archived_by').references('id').inTable('users');

    // Indexes
    table.index(['organization_id', 'status'], 'idx_threads_org_status');
    table.index(['client_id', 'status'], 'idx_threads_client_status');
    table.index(['assigned_to_user', 'status'], 'idx_threads_assigned_status');
    table.index(['last_message_at'], 'idx_threads_last_message');
    table.index(['status', 'priority'], 'idx_threads_status_priority');
  });

  await knex.raw("COMMENT ON TABLE message_threads IS 'Conversation threads between families and staff about clients'");
  await knex.raw("COMMENT ON COLUMN message_threads.response_time_minutes IS 'SLA metric: minutes from thread creation to first staff response'");

  // ==========================================
  // 2. MESSAGES TABLE
  // ==========================================
  await knex.schema.createTable('messages', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('thread_id').notNullable().references('id').inTable('message_threads').onDelete('CASCADE');

    // Sender (either staff user OR family member, not both)
    table.uuid('sender_user_id').references('id').inTable('users'); // Staff sender
    table.uuid('sender_family_member_id').references('id').inTable('family_members'); // Family sender
    table.string('sender_name', 255).notNullable(); // Cached for display
    table.string('sender_type', 50).notNullable(); // STAFF, FAMILY

    // Message content
    table.text('body').notNullable();
    table.string('message_type', 50).defaultTo('TEXT'); // TEXT, AUTOMATED, SYSTEM, NOTIFICATION
    table.boolean('is_draft').defaultTo(false);

    // Formatting and rendering
    table.string('content_format', 20).defaultTo('PLAIN'); // PLAIN, MARKDOWN, HTML
    table.jsonb('mentions'); // Array of @mentioned user/family member IDs
    table.jsonb('metadata'); // Additional structured data

    // Status tracking
    table.boolean('is_read').defaultTo(false); // Deprecated - use read_receipts table instead
    table.boolean('requires_response').defaultTo(false);
    table.uuid('in_reply_to').references('id').inTable('messages'); // For threading within conversation

    // Moderation
    table.boolean('is_hidden').defaultTo(false); // Hidden by moderator
    table.boolean('is_edited').defaultTo(false);
    table.timestamp('edited_at');
    table.text('edit_reason');

    // Delivery tracking
    table.string('delivery_status', 50).defaultTo('SENT'); // SENDING, SENT, DELIVERED, FAILED
    table.timestamp('delivered_at');
    table.text('delivery_error');

    // Email/SMS notification tracking (if sent externally)
    table.boolean('email_sent').defaultTo(false);
    table.timestamp('email_sent_at');
    table.boolean('sms_sent').defaultTo(false);
    table.timestamp('sms_sent_at');
    table.boolean('push_sent').defaultTo(false);
    table.timestamp('push_sent_at');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at'); // Soft delete
    table.uuid('deleted_by').references('id').inTable('users');

    // Indexes
    table.index(['thread_id', 'created_at'], 'idx_messages_thread_date');
    table.index(['sender_user_id'], 'idx_messages_sender_user');
    table.index(['sender_family_member_id'], 'idx_messages_sender_family');
    table.index(['organization_id', 'created_at'], 'idx_messages_org_date');
  });

  await knex.raw("COMMENT ON TABLE messages IS 'Individual messages within conversation threads'");
  await knex.raw("COMMENT ON COLUMN messages.sender_type IS 'STAFF or FAMILY - determines which sender ID to use'");
  await knex.raw("COMMENT ON COLUMN messages.requires_response IS 'Message contains a question or request requiring staff response'");

  // ==========================================
  // 3. MESSAGE PARTICIPANTS TABLE
  // ==========================================
  await knex.schema.createTable('message_participants', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('thread_id').notNullable().references('id').inTable('message_threads').onDelete('CASCADE');

    // Participant (either staff user OR family member, not both)
    table.uuid('user_id').references('id').inTable('users'); // Staff participant
    table.uuid('family_member_id').references('id').inTable('family_members'); // Family participant
    table.string('participant_type', 50).notNullable(); // STAFF, FAMILY

    // Participation details
    table.string('role', 50).defaultTo('PARTICIPANT'); // PARTICIPANT, MODERATOR, OBSERVER
    table.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('left_at'); // If they left/were removed from thread
    table.boolean('is_active').defaultTo(true);

    // Notification preferences (per-thread)
    table.boolean('notify_new_messages').defaultTo(true);
    table.string('notification_method', 50).defaultTo('EMAIL'); // EMAIL, SMS, PUSH, NONE

    // Read tracking
    table.timestamp('last_read_at');
    table.uuid('last_read_message_id').references('id').inTable('messages');
    table.integer('unread_count').defaultTo(0);

    // Constraints
    table.unique(['thread_id', 'user_id'], { predicate: knex.whereNotNull('user_id') });
    table.unique(['thread_id', 'family_member_id'], { predicate: knex.whereNotNull('family_member_id') });

    // Indexes
    table.index(['thread_id'], 'idx_participants_thread');
    table.index(['user_id'], 'idx_participants_user');
    table.index(['family_member_id'], 'idx_participants_family');
  });

  await knex.raw("COMMENT ON TABLE message_participants IS 'Tracks who can view and participate in each message thread'");
  await knex.raw("COMMENT ON COLUMN message_participants.unread_count IS 'Cached count of unread messages for performance'");

  // ==========================================
  // 4. MESSAGE READ RECEIPTS TABLE
  // ==========================================
  await knex.schema.createTable('message_read_receipts', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('message_id').notNullable().references('id').inTable('messages').onDelete('CASCADE');

    // Reader (either staff user OR family member, not both)
    table.uuid('reader_user_id').references('id').inTable('users');
    table.uuid('reader_family_member_id').references('id').inTable('family_members');
    table.string('reader_type', 50).notNullable(); // STAFF, FAMILY

    // Read details
    table.timestamp('read_at').notNullable().defaultTo(knex.fn.now());
    table.string('read_via', 50); // WEB, MOBILE, EMAIL, etc.

    // Constraints - each person can only read a message once (first read)
    table.unique(['message_id', 'reader_user_id'], { predicate: knex.whereNotNull('reader_user_id') });
    table.unique(['message_id', 'reader_family_member_id'], { predicate: knex.whereNotNull('reader_family_member_id') });

    // Indexes
    table.index(['message_id'], 'idx_read_receipts_message');
    table.index(['reader_user_id'], 'idx_read_receipts_user');
    table.index(['reader_family_member_id'], 'idx_read_receipts_family');
  });

  await knex.raw("COMMENT ON TABLE message_read_receipts IS 'Tracks when each participant reads each message'");

  // ==========================================
  // 5. MESSAGE ATTACHMENTS TABLE
  // ==========================================
  await knex.schema.createTable('message_attachments', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('message_id').notNullable().references('id').inTable('messages').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // File details
    table.string('file_name', 500).notNullable();
    table.string('file_type', 100); // MIME type
    table.string('file_category', 50); // IMAGE, DOCUMENT, VIDEO, AUDIO, OTHER
    table.bigInteger('file_size_bytes').notNullable();
    table.string('storage_key', 1000).notNullable(); // S3 key or storage path
    table.string('storage_url', 1000); // Signed URL or CDN URL

    // Security
    table.string('encryption_status', 50).defaultTo('ENCRYPTED'); // ENCRYPTED, UNENCRYPTED
    table.boolean('virus_scanned').defaultTo(false);
    table.string('scan_result', 50); // CLEAN, INFECTED, SKIPPED, FAILED

    // Metadata
    table.jsonb('metadata'); // Image dimensions, duration, etc.
    table.string('thumbnail_url', 1000); // For images/videos

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index(['message_id'], 'idx_attachments_message');
    table.index(['organization_id'], 'idx_attachments_org');
  });

  await knex.raw("COMMENT ON TABLE message_attachments IS 'Files attached to messages (images, documents, etc.)'");

  // ==========================================
  // 6. PROGRESS UPDATES TABLE
  // ==========================================
  await knex.schema.createTable('progress_updates', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Update details
    table.string('update_type', 50).notNullable(); // DAILY, WEEKLY, MONTHLY, MILESTONE, INCIDENT, AD_HOC
    table.string('title', 500).notNullable();
    table.text('summary').notNullable(); // Human-readable summary
    table.jsonb('content'); // Structured data: { visits_completed, goals_progress, tasks_completed, etc. }

    // Period covered
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();

    // Generation
    table.string('generation_method', 50).notNullable(); // AUTOMATED, MANUAL, HYBRID
    table.uuid('generated_by').references('id').inTable('users'); // Staff who generated/approved it
    table.timestamp('generated_at').notNullable().defaultTo(knex.fn.now());

    // Publishing and visibility
    table.string('status', 50).notNullable().defaultTo('DRAFT'); // DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED
    table.timestamp('published_at');
    table.uuid('published_by').references('id').inTable('users');
    table.boolean('is_visible_to_families').defaultTo(false);

    // Delivery tracking
    table.jsonb('recipients'); // Array of family member IDs who should receive this
    table.integer('recipients_count').defaultTo(0);
    table.integer('delivered_count').defaultTo(0);
    table.integer('read_count').defaultTo(0);
    table.timestamp('first_read_at');

    // Associated resources
    table.uuid('related_care_plan_id').references('id').inTable('care_plans');
    table.jsonb('related_visit_ids'); // Array of visit IDs included in this update
    table.jsonb('related_goal_ids'); // Array of goal IDs mentioned

    // Attachments and media
    table.jsonb('attachments'); // Array of { file_name, url, type }
    table.jsonb('highlights'); // Key achievements or concerns to highlight

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('archived_at');

    // Indexes
    table.index(['organization_id', 'published_at'], 'idx_progress_org_published');
    table.index(['client_id', 'published_at'], 'idx_progress_client_published');
    table.index(['status'], 'idx_progress_status');
    table.index(['update_type', 'period_end'], 'idx_progress_type_period');
  });

  await knex.raw("COMMENT ON TABLE progress_updates IS 'Care progress reports generated for families (automated and manual)'");
  await knex.raw("COMMENT ON COLUMN progress_updates.generation_method IS 'AUTOMATED = system-generated, MANUAL = staff-written, HYBRID = system-generated + staff-edited'");

  // ==========================================
  // 7. COMMUNICATION TEMPLATES TABLE
  // ==========================================
  await knex.schema.createTable('communication_templates', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // Template details
    table.string('template_name', 255).notNullable();
    table.string('template_code', 100).notNullable(); // Unique code for programmatic reference
    table.text('description');
    table.string('category', 100); // WELCOME, VISIT_REMINDER, SCHEDULE_CHANGE, INCIDENT, PROGRESS_UPDATE, etc.

    // Template content
    table.string('subject_template', 500); // For emails
    table.text('body_template').notNullable(); // Supports variables like {{client_name}}, {{caregiver_name}}
    table.string('content_format', 20).defaultTo('PLAIN'); // PLAIN, MARKDOWN, HTML

    // Variables and customization
    table.jsonb('available_variables'); // Array of variable names that can be used
    table.jsonb('default_values'); // Default values for optional variables
    table.boolean('requires_customization').defaultTo(false); // Staff must edit before sending

    // Usage context
    table.string('delivery_method', 50); // EMAIL, SMS, IN_APP, PUSH, ALL
    table.string('trigger_event', 100); // Event that can trigger this template (optional)
    table.boolean('is_system_template').defaultTo(false); // System templates can't be deleted
    table.boolean('is_active').defaultTo(true);

    // Localization
    table.string('language', 10).defaultTo('en'); // Language code
    table.uuid('base_template_id').references('id').inTable('communication_templates'); // For translations

    // Usage tracking
    table.integer('usage_count').defaultTo(0);
    table.timestamp('last_used_at');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.timestamp('deleted_at');

    // Constraints
    table.unique(['organization_id', 'template_code'], { predicate: knex.whereNull('deleted_at') });

    // Indexes
    table.index(['organization_id', 'category'], 'idx_templates_org_category');
    table.index(['template_code'], 'idx_templates_code');
    table.index(['is_active'], 'idx_templates_active');
  });

  await knex.raw("COMMENT ON TABLE communication_templates IS 'Reusable message templates for common family communications'");
  await knex.raw("COMMENT ON COLUMN communication_templates.template_code IS 'Unique code for programmatic reference (e.g., WELCOME_FAMILY, VISIT_REMINDER)'");

  // ==========================================
  // TRIGGERS: Auto-update updated_at
  // ==========================================
  await knex.raw(`
    CREATE TRIGGER update_message_threads_updated_at
      BEFORE UPDATE ON message_threads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_progress_updates_updated_at
      BEFORE UPDATE ON progress_updates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_communication_templates_updated_at
      BEFORE UPDATE ON communication_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // ==========================================
  // FUNCTION: Update thread message count and last message time
  // ==========================================
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_thread_on_new_message()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE message_threads
      SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        last_message_by = NEW.sender_user_id,
        last_message_by_family = NEW.sender_family_member_id,
        updated_at = NOW()
      WHERE id = NEW.thread_id;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_update_thread_on_new_message
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_thread_on_new_message()
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers and functions
  await knex.raw('DROP TRIGGER IF EXISTS trigger_update_thread_on_new_message ON messages');
  await knex.raw('DROP FUNCTION IF EXISTS update_thread_on_new_message()');
  await knex.raw('DROP TRIGGER IF EXISTS update_communication_templates_updated_at ON communication_templates');
  await knex.raw('DROP TRIGGER IF EXISTS update_progress_updates_updated_at ON progress_updates');
  await knex.raw('DROP TRIGGER IF EXISTS update_message_threads_updated_at ON message_threads');

  // Drop tables in reverse order (respecting foreign keys)
  await knex.schema.dropTableIfExists('communication_templates');
  await knex.schema.dropTableIfExists('progress_updates');
  await knex.schema.dropTableIfExists('message_attachments');
  await knex.schema.dropTableIfExists('message_read_receipts');
  await knex.schema.dropTableIfExists('message_participants');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('message_threads');
}
