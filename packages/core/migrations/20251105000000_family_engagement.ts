import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Family members table
  await knex.schema.createTable('family_members', (table) => {
    // Primary key and organization
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Identity
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('relationship', 50).notNullable();

    // Contact
    table.string('phone', 20);
    table.string('email', 255);
    table.string('preferred_contact_method', 20).notNullable().defaultTo('SMS');

    // Portal access
    table.boolean('portal_access_enabled').notNullable().defaultTo(false);
    table.string('portal_username', 100);
    table.text('portal_password_hash');
    table.timestamp('portal_last_login');

    // Communication preferences (JSONB)
    table.jsonb('notification_preferences').notNullable().defaultTo(JSON.stringify({
      visit_start: true,
      visit_end: true,
      visit_summary: true,
      missed_visit: true,
      schedule_change: true,
      emergency_alert: true,
      medication_reminder: false,
      appointment_reminder: true,
      care_plan_update: true
    }));

    // Permissions (JSONB)
    table.jsonb('permissions').notNullable().defaultTo(JSON.stringify({
      view_visit_history: true,
      view_care_plan: true,
      view_medications: false,
      view_medical_notes: false,
      view_caregiver_info: true,
      request_visit_changes: true,
      provide_feedback: true,
      view_billing: false
    }));

    // Status
    table.string('status', 20).notNullable().defaultTo('ACTIVE');
    table.boolean('is_primary_contact').notNullable().defaultTo(false);
    table.boolean('is_emergency_contact').notNullable().defaultTo(false);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('deleted_at');

    // Constraints
    table.unique(['portal_username']);
    table.check(`status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')`);
    table.check(`preferred_contact_method IN ('SMS', 'EMAIL', 'PHONE', 'PORTAL')`);
  });

  // Indexes for family_members
  await knex.raw('CREATE INDEX idx_family_members_client ON family_members(client_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_family_members_phone ON family_members(phone) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_family_members_email ON family_members(email) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_family_members_portal ON family_members(portal_username) WHERE portal_access_enabled = true AND deleted_at IS NULL');

  // Family notifications table
  await knex.schema.createTable('family_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Notification details
    table.string('notification_type', 50).notNullable();
    table.string('channel', 20).notNullable();

    // Content
    table.text('subject');
    table.text('message').notNullable();
    table.jsonb('metadata');

    // Delivery
    table.string('status', 20).notNullable().defaultTo('PENDING');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('read_at');
    table.text('failed_reason');

    // External tracking IDs (Twilio SID, SendGrid message ID, etc.)
    table.string('external_id', 255);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.check(`channel IN ('SMS', 'EMAIL', 'PORTAL', 'PUSH')`);
    table.check(`status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ')`);
  });

  // Indexes for family_notifications
  await knex.raw('CREATE INDEX idx_family_notifications_member ON family_notifications(family_member_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_notifications_status ON family_notifications(status, created_at) WHERE status IN (\'PENDING\', \'FAILED\')');

  // Family messages table (two-way messaging)
  await knex.schema.createTable('family_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Participants
    table.string('sender_type', 20).notNullable();
    table.uuid('sender_id').notNullable(); // family_member_id or user_id

    // Message
    table.text('message_text').notNullable();
    table.string('message_type', 20).notNullable().defaultTo('TEXT');
    table.jsonb('attachments');

    // Threading
    table.uuid('thread_id');
    table.uuid('parent_message_id').references('id').inTable('family_messages');

    // Status
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at');
    table.boolean('requires_response').notNullable().defaultTo(false);
    table.string('priority', 20).notNullable().defaultTo('NORMAL');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.check(`sender_type IN ('FAMILY', 'COORDINATOR', 'CAREGIVER', 'SYSTEM')`);
    table.check(`message_type IN ('TEXT', 'IMAGE', 'VOICE', 'SYSTEM')`);
    table.check(`priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);
  });

  // Indexes for family_messages
  await knex.raw('CREATE INDEX idx_family_messages_client ON family_messages(client_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_messages_thread ON family_messages(thread_id, created_at)');
  await knex.raw('CREATE INDEX idx_family_messages_unread ON family_messages(is_read, created_at) WHERE is_read = false');

  // AI chatbot conversations table
  await knex.schema.createTable('family_ai_conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Conversation
    table.uuid('session_id').notNullable(); // Groups messages in one conversation
    table.text('user_message').notNullable();
    table.text('ai_response').notNullable();

    // Context provided to AI
    table.jsonb('context_data');

    // Intent classification (for analytics)
    table.string('detected_intent', 50);
    table.decimal('confidence_score', 3, 2);

    // Outcome
    table.boolean('escalated_to_human').notNullable().defaultTo(false);
    table.text('escalation_reason');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // Indexes for family_ai_conversations
  await knex.raw('CREATE INDEX idx_family_ai_conversations_session ON family_ai_conversations(session_id, created_at)');
  await knex.raw('CREATE INDEX idx_family_ai_conversations_member ON family_ai_conversations(family_member_id, created_at DESC)');

  // Family feedback table
  await knex.schema.createTable('family_feedback', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // What they're rating
    table.string('feedback_type', 50).notNullable();
    table.uuid('visit_id'); // May not exist yet in visits table, so no FK for now
    table.uuid('caregiver_id').references('id').inTable('caregivers');

    // Rating
    table.integer('rating').notNullable();
    table.text('comment');
    table.string('sentiment', 20);

    // Follow-up
    table.boolean('requires_follow_up').notNullable().defaultTo(false);
    table.boolean('follow_up_completed').notNullable().defaultTo(false);
    table.text('follow_up_notes');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.check('rating BETWEEN 1 AND 5');
    table.check(`feedback_type IN ('VISIT_RATING', 'CAREGIVER_RATING', 'OVERALL_SATISFACTION')`);
    table.check(`sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE') OR sentiment IS NULL`);
  });

  // Indexes for family_feedback
  await knex.raw('CREATE INDEX idx_family_feedback_client ON family_feedback(client_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_feedback_caregiver ON family_feedback(caregiver_id, rating)');
  await knex.raw('CREATE INDEX idx_family_feedback_follow_up ON family_feedback(requires_follow_up, follow_up_completed) WHERE requires_follow_up = true AND follow_up_completed = false');
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await knex.schema.dropTableIfExists('family_feedback');
  await knex.schema.dropTableIfExists('family_ai_conversations');
  await knex.schema.dropTableIfExists('family_messages');
  await knex.schema.dropTableIfExists('family_notifications');
  await knex.schema.dropTableIfExists('family_members');
}
