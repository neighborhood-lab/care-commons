import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Family Portal Users table - Family members who can access the portal
  await knex.schema.createTable('family_portal_users', (table) => {
    // Primary key and organization
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Identity
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable();
    table.jsonb('phone');

    // Relationship to client
    table.string('relationship', 100).notNullable(); // e.g., 'parent', 'spouse', 'adult_child', 'guardian', 'power_of_attorney'
    table.boolean('is_primary_contact').notNullable().defaultTo(false);
    table.boolean('is_emergency_contact').notNullable().defaultTo(false);
    table.boolean('has_legal_authority').notNullable().defaultTo(false); // POA, guardian, etc.

    // Account and access
    table.string('password_hash', 255); // For portal login
    table.string('status', 50).notNullable().defaultTo('INVITED'); // INVITED, ACTIVE, SUSPENDED, INACTIVE
    table.timestamp('last_login_at');
    table.timestamp('invitation_sent_at');
    table.timestamp('invitation_accepted_at');
    table.string('invitation_token', 255);

    // Permissions and preferences
    table.jsonb('permissions').notNullable().defaultTo('{}'); // What they can view/do
    table.jsonb('notification_preferences').notNullable().defaultTo('{}');
    table.boolean('can_view_care_notes').notNullable().defaultTo(true);
    table.boolean('can_view_schedule').notNullable().defaultTo(true);
    table.boolean('can_view_medications').notNullable().defaultTo(false);
    table.boolean('can_view_billing').notNullable().defaultTo(false);
    table.boolean('can_message_caregivers').notNullable().defaultTo(true);
    table.boolean('can_request_schedule_changes').notNullable().defaultTo(false);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.timestamp('deleted_at');

    // Indexes
    table.index('client_id');
    table.index('email');
    table.index('status');
    table.unique(['email', 'organization_id']);
  });

  // Conversations table - Message threads between family, caregivers, coordinators
  await knex.schema.createTable('conversations', (table) => {
    // Primary key and organization
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Conversation metadata
    table.string('type', 50).notNullable(); // DIRECT, GROUP, CARE_TEAM, AI_CHAT
    table.string('subject', 255);
    table.string('status', 50).notNullable().defaultTo('ACTIVE'); // ACTIVE, ARCHIVED, CLOSED

    // Participants (stored as arrays of UUIDs)
    table.specificType('family_member_ids', 'UUID[]').notNullable().defaultTo('{}');
    table.specificType('caregiver_ids', 'UUID[]').notNullable().defaultTo('{}');
    table.specificType('coordinator_ids', 'UUID[]').notNullable().defaultTo('{}');

    // AI chatbot metadata
    table.boolean('is_ai_conversation').notNullable().defaultTo(false);
    table.string('ai_conversation_context', 100); // e.g., 'general', 'medication_question', 'schedule_inquiry'

    // Tracking
    table.timestamp('last_message_at');
    table.integer('message_count').notNullable().defaultTo(0);
    table.integer('unread_count').notNullable().defaultTo(0);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index('client_id');
    table.index('type');
    table.index('status');
    table.index('is_ai_conversation');
    table.index('last_message_at');
  });

  // Messages table - Individual messages within conversations
  await knex.schema.createTable('messages', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('conversation_id').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // Sender information
    table.string('sender_type', 50).notNullable(); // FAMILY_MEMBER, CAREGIVER, COORDINATOR, AI_BOT, SYSTEM
    table.uuid('sender_id'); // References family_portal_users, caregivers, or users table depending on sender_type
    table.string('sender_name', 200); // Denormalized for display

    // Message content
    table.text('content').notNullable();
    table.string('content_type', 50).notNullable().defaultTo('TEXT'); // TEXT, IMAGE, FILE, SYSTEM_NOTIFICATION
    table.jsonb('metadata'); // For attachments, formatting, AI response metadata, etc.

    // AI-specific fields
    table.boolean('is_ai_generated').notNullable().defaultTo(false);
    table.text('ai_prompt'); // The prompt that generated this message (if AI)
    table.jsonb('ai_context'); // Context used for AI response
    table.integer('ai_token_count'); // For usage tracking

    // Status tracking
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at');
    table.specificType('read_by', 'UUID[]').defaultTo('{}'); // Who has read this message

    // Reply/threading
    table.uuid('reply_to_message_id').references('id').inTable('messages');

    // Moderation
    table.boolean('is_flagged').notNullable().defaultTo(false);
    table.text('flag_reason');
    table.boolean('is_hidden').notNullable().defaultTo(false);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index('conversation_id');
    table.index('sender_type');
    table.index('sender_id');
    table.index('is_ai_generated');
    table.index('created_at');
    table.index('is_read');
  });

  // Care Activity Feed - Timeline of care activities visible to family
  await knex.schema.createTable('care_activity_feed', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Activity information
    table.string('activity_type', 100).notNullable();
    // VISIT_COMPLETED, VISIT_STARTED, VISIT_MISSED, CARE_PLAN_UPDATED,
    // MEDICATION_ADMINISTERED, INCIDENT_REPORTED, NOTE_ADDED, SCHEDULE_CHANGED
    table.string('title', 255).notNullable();
    table.text('description');
    table.jsonb('details'); // Structured data about the activity

    // Related entities
    table.uuid('related_visit_id').references('id').inTable('visits');
    table.uuid('related_caregiver_id').references('id').inTable('caregivers');
    table.uuid('related_care_plan_id').references('id').inTable('care_plans');

    // Actor
    table.uuid('actor_id'); // Who performed this action
    table.string('actor_type', 50); // CAREGIVER, COORDINATOR, SYSTEM
    table.string('actor_name', 200); // Denormalized for display

    // Visibility
    table.boolean('visible_to_family').notNullable().defaultTo(true);
    table.string('sensitivity_level', 50).notNullable().defaultTo('NORMAL'); // NORMAL, SENSITIVE, CONFIDENTIAL
    table.timestamp('occurred_at').notNullable(); // When the activity actually happened

    // Engagement tracking
    table.boolean('is_read').notNullable().defaultTo(false);
    table.specificType('read_by_family_members', 'UUID[]').defaultTo('{}');
    table.timestamp('first_read_at');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('deleted_at');

    // Indexes
    table.index('client_id');
    table.index('activity_type');
    table.index('occurred_at');
    table.index('visible_to_family');
    table.index(['client_id', 'occurred_at']);
  });

  // AI Chatbot Sessions - Track AI conversations for analytics and improvement
  await knex.schema.createTable('chatbot_sessions', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('conversation_id').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_portal_users');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Session metadata
    table.string('session_type', 100); // GENERAL_INQUIRY, SCHEDULE_QUESTION, CARE_INFO, MEDICATION_QUESTION
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('ended_at');
    table.integer('duration_seconds');

    // AI model information
    table.string('ai_model', 100).notNullable().defaultTo('claude-3-5-sonnet-20241022');
    table.integer('total_messages').notNullable().defaultTo(0);
    table.integer('total_tokens').notNullable().defaultTo(0);
    table.decimal('estimated_cost', 10, 4).notNullable().defaultTo(0);

    // Context and quality
    table.jsonb('initial_context'); // What context was provided to AI at session start
    table.jsonb('topics_discussed'); // Array of topics covered
    table.boolean('was_helpful'); // User feedback
    table.integer('helpfulness_rating'); // 1-5 scale
    table.text('user_feedback');

    // Handoff tracking
    table.boolean('required_human_handoff').notNullable().defaultTo(false);
    table.string('handoff_reason', 255);
    table.uuid('handed_off_to'); // User ID if handed off to human
    table.timestamp('handoff_at');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('family_member_id');
    table.index('client_id');
    table.index('started_at');
    table.index('session_type');
    table.index('was_helpful');
  });

  // Notification Queue - For sending notifications to family members
  await knex.schema.createTable('family_notifications', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_portal_users');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Notification details
    table.string('notification_type', 100).notNullable();
    // NEW_MESSAGE, VISIT_COMPLETED, VISIT_MISSED, CARE_UPDATE,
    // SCHEDULE_CHANGE, INCIDENT_ALERT, MEDICATION_REMINDER
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.jsonb('data'); // Additional structured data

    // Related entity
    table.uuid('related_id'); // ID of related message, visit, etc.
    table.string('related_type', 50); // MESSAGE, VISIT, CARE_PLAN, etc.

    // Delivery channels
    table.boolean('send_email').notNullable().defaultTo(false);
    table.boolean('send_sms').notNullable().defaultTo(false);
    table.boolean('send_push').notNullable().defaultTo(false);
    table.boolean('in_app_only').notNullable().defaultTo(true);

    // Status tracking
    table.string('status', 50).notNullable().defaultTo('PENDING'); // PENDING, SENT, FAILED, READ
    table.timestamp('scheduled_for'); // For delayed notifications
    table.timestamp('sent_at');
    table.timestamp('read_at');
    table.timestamp('failed_at');
    table.text('failure_reason');
    table.integer('retry_count').notNullable().defaultTo(0);

    // Priority
    table.string('priority', 50).notNullable().defaultTo('NORMAL'); // LOW, NORMAL, HIGH, URGENT

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('family_member_id');
    table.index('status');
    table.index('notification_type');
    table.index('scheduled_for');
    table.index(['family_member_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('family_notifications');
  await knex.schema.dropTableIfExists('chatbot_sessions');
  await knex.schema.dropTableIfExists('care_activity_feed');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('conversations');
  await knex.schema.dropTableIfExists('family_portal_users');
}
