import type { Knex } from 'knex';

/**
 * Family Engagement Platform Migration
 *
 * Creates tables for:
 * - Family member portal accounts
 * - Family-client access permissions
 * - Portal activity logging
 * - Conversations and messaging
 * - Notifications
 * - AI chatbot sessions
 *
 * HIPAA Compliance:
 * - All PHI access is audited
 * - Fine-grained permission controls
 * - Encryption support for sensitive data
 * - Consent tracking
 */

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // FAMILY PORTAL TABLES
  // ============================================================================

  // Family members table
  await knex.schema.createTable('family_members', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // Identity
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone_number', 50);

    // Authentication
    table.string('auth_provider_id', 255); // External auth provider ID
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.timestamp('email_verified_at');

    // Portal Access
    table.string('status', 50).notNullable().defaultTo('INVITED');
    table.timestamp('last_login_at');
    table.timestamp('invited_at');
    table.uuid('invited_by').references('id').inTable('users');
    table.timestamp('accepted_at');

    // Preferences
    table.string('preferred_language', 10);
    table.string('timezone', 50);
    table.jsonb('notification_preferences').notNullable().defaultTo(JSON.stringify({
      email: {
        visitReminders: true,
        visitCompletions: true,
        carePlanUpdates: true,
        messages: true,
        systemAlerts: true,
      },
      sms: {
        visitReminders: true,
        visitCompletions: true,
        urgentMessages: true,
      },
      push: {
        messages: true,
        updates: true,
      },
    }));

    // Security
    table.boolean('two_factor_enabled').notNullable().defaultTo(false);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Constraints
    table.unique(['organization_id', 'email']);
    table.check(`status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'EXPIRED')`);
  });

  // Family-client access table
  await knex.schema.createTable('family_client_access', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Relationships
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Relationship Type
    table.string('relationship_type', 50).notNullable();
    table.boolean('is_primary_contact').notNullable().defaultTo(false);

    // Access Permissions
    table.jsonb('permissions').notNullable().defaultTo(JSON.stringify({
      viewCarePlan: true,
      viewCarePlanGoals: true,
      viewCarePlanTasks: false,
      viewScheduledVisits: true,
      viewVisitHistory: true,
      viewVisitNotes: false,
      viewCaregiverInfo: true,
      viewMedicalInfo: false,
      viewMedications: false,
      viewVitalSigns: false,
      viewProgressNotes: false,
      sendMessages: true,
      receiveMessages: true,
      requestVisitChanges: false,
      viewDocuments: false,
      downloadDocuments: false,
      uploadDocuments: false,
      viewBillingInfo: false,
      viewInvoices: false,
    }));

    // Legal Authorization
    table.string('consent_status', 50).notNullable().defaultTo('PENDING');
    table.timestamp('consent_date');
    table.uuid('consent_form_id'); // Reference to document
    table.string('legal_authority', 50);

    // Access Control
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.timestamp('granted_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('granted_by').notNullable().references('id').inTable('users');
    table.timestamp('revoked_at');
    table.uuid('revoked_by').references('id').inTable('users');
    table.text('revoked_reason');

    // Audit
    table.timestamp('last_accessed_at');
    table.integer('access_count').notNullable().defaultTo(0);

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.unique(['family_member_id', 'client_id']);
    table.check(`relationship_type IN ('PARENT', 'CHILD', 'SPOUSE', 'SIBLING', 'GRANDPARENT', 'GRANDCHILD', 'GUARDIAN', 'POWER_OF_ATTORNEY', 'HEALTHCARE_PROXY', 'AUTHORIZED_REPRESENTATIVE', 'OTHER')`);
    table.check(`consent_status IN ('PENDING', 'GRANTED', 'EXPIRED', 'REVOKED', 'DENIED')`);
    table.check(`status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED')`);
    table.check(`legal_authority IN ('HEALTHCARE_POA', 'DURABLE_POA', 'GUARDIANSHIP', 'CONSERVATORSHIP', 'HIPAA_AUTHORIZATION', 'CLIENT_CONSENT')`);
  });

  // Portal activity log
  await knex.schema.createTable('portal_activity_log', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Who
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // What
    table.string('activity_type', 50).notNullable();
    table.string('resource_type', 100).notNullable();
    table.uuid('resource_id');
    table.string('action', 20).notNullable();

    // Details
    table.text('description').notNullable();
    table.jsonb('metadata');

    // When & Where
    table.timestamp('occurred_at').notNullable().defaultTo(knex.fn.now());
    table.string('ip_address', 45); // IPv6 max length
    table.text('user_agent');
    table.jsonb('device_info');

    // PHI Access Tracking (HIPAA §164.528)
    table.boolean('is_phi_access').notNullable().defaultTo(false);
    table.string('phi_disclosure_type', 100);

    // Constraints
    table.check(`activity_type IN ('LOGIN', 'LOGOUT', 'VIEW_CARE_PLAN', 'VIEW_VISIT', 'VIEW_DOCUMENT', 'DOWNLOAD_DOCUMENT', 'SEND_MESSAGE', 'READ_MESSAGE', 'UPDATE_PREFERENCES', 'ACCEPT_INVITATION', 'REVOKE_ACCESS')`);
    table.check(`action IN ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'DOWNLOAD')`);
  });

  // Family invitations
  await knex.schema.createTable('family_invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.string('email', 255).notNullable();
    table.string('relationship_type', 50).notNullable();
    table.jsonb('permissions').notNullable();
    table.uuid('invited_by').notNullable().references('id').inTable('users');
    table.timestamp('invited_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.string('token', 255).notNullable().unique();
    table.string('status', 20).notNullable().defaultTo('PENDING');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.check(`status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')`);
  });

  // ============================================================================
  // MESSAGING & CONVERSATIONS
  // ============================================================================

  // Conversations table
  await knex.schema.createTable('conversations', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Context
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.string('subject', 255);
    table.string('conversation_type', 50).notNullable().defaultTo('DIRECT');

    // Participants (stored as JSONB array)
    table.jsonb('participants').notNullable().defaultTo('[]');

    // Status
    table.string('status', 20).notNullable().defaultTo('ACTIVE');

    // Latest Message
    table.timestamp('last_message_at');
    table.text('last_message_preview');
    table.uuid('last_message_sender_id');

    // Settings
    table.boolean('is_archived').notNullable().defaultTo(false);
    table.boolean('is_pinned').notNullable().defaultTo(false);
    table.jsonb('tags');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Constraints
    table.check(`conversation_type IN ('DIRECT', 'GROUP', 'CARE_TEAM', 'FAMILY_UPDATES', 'SUPPORT')`);
    table.check(`status IN ('ACTIVE', 'ARCHIVED', 'CLOSED')`);
  });

  // Messages table
  await knex.schema.createTable('messages', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Conversation
    table.uuid('conversation_id').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Sender
    table.uuid('sender_id').notNullable();
    table.string('sender_type', 50).notNullable();

    // Content
    table.text('content').notNullable();
    table.string('content_type', 50).notNullable().defaultTo('TEXT');

    // Rich Content
    table.jsonb('attachments');
    table.jsonb('mentions');

    // Reply/Thread
    table.uuid('reply_to_message_id').references('id').inTable('messages');
    table.uuid('thread_id');

    // Delivery
    table.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('delivered_at');
    table.string('delivery_status', 20).notNullable().defaultTo('PENDING');

    // Read Receipts
    table.jsonb('read_by').notNullable().defaultTo('[]');

    // Reactions
    table.jsonb('reactions');

    // Editing
    table.timestamp('edited_at');
    table.jsonb('edit_history');

    // System Messages
    table.boolean('is_system_message').notNullable().defaultTo(false);
    table.string('system_message_type', 50);

    // Security
    table.boolean('contains_phi').notNullable().defaultTo(false);
    table.string('encryption_status', 20);

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Constraints
    table.check(`sender_type IN ('FAMILY_MEMBER', 'CARE_COORDINATOR', 'CAREGIVER', 'NURSE', 'ADMIN', 'SYSTEM')`);
    table.check(`content_type IN ('TEXT', 'RICH_TEXT', 'ATTACHMENT', 'SYSTEM')`);
    table.check(`delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')`);
  });

  // Message drafts (auto-save)
  await knex.schema.createTable('message_drafts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('conversation_id').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.uuid('user_id').notNullable();
    table.text('content').notNullable();
    table.jsonb('attachments');
    table.uuid('reply_to_message_id').references('id').inTable('messages');
    table.timestamp('saved_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();

    table.unique(['conversation_id', 'user_id']);
  });

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  // Notifications table
  await knex.schema.createTable('notifications', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Recipient
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Notification Details
    table.string('type', 50).notNullable();
    table.string('category', 50).notNullable();
    table.string('priority', 20).notNullable().defaultTo('NORMAL');

    // Content
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.text('action_url');
    table.string('action_text', 100);

    // Context
    table.string('resource_type', 100);
    table.uuid('resource_id');
    table.jsonb('metadata');

    // Delivery
    table.jsonb('delivery_channels').notNullable().defaultTo('["IN_APP"]');
    table.string('delivery_status', 20).notNullable().defaultTo('PENDING');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('failed_at');
    table.text('failure_reason');

    // User Interaction
    table.timestamp('read_at');
    table.timestamp('clicked_at');
    table.timestamp('dismissed_at');

    // Scheduling
    table.timestamp('scheduled_for');
    table.timestamp('expires_at');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.check(`category IN ('CARE_UPDATES', 'MESSAGES', 'SYSTEM', 'ALERTS', 'REMINDERS', 'BILLING')`);
    table.check(`priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);
    table.check(`delivery_status IN ('PENDING', 'SCHEDULED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')`);
  });

  // Notification deliveries (multi-channel tracking)
  await knex.schema.createTable('notification_deliveries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('notification_id').notNullable().references('id').inTable('notifications').onDelete('CASCADE');
    table.string('channel', 20).notNullable();
    table.string('status', 20).notNullable().defaultTo('PENDING');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('failed_at');
    table.text('error_message');
    table.integer('retry_count').notNullable().defaultTo(0);
    table.integer('max_retries').notNullable().defaultTo(3);
    table.jsonb('channel_data'); // Email/SMS/Push specific data
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.check(`channel IN ('IN_APP', 'EMAIL', 'SMS', 'PUSH')`);
    table.check(`status IN ('PENDING', 'SCHEDULED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')`);
  });

  // ============================================================================
  // AI CHATBOT
  // ============================================================================

  // Chat sessions table
  await knex.schema.createTable('chat_sessions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // User Context
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Session State
    table.string('status', 20).notNullable().defaultTo('ACTIVE');
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_activity_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('ended_at');

    // Context Management
    table.jsonb('context').notNullable().defaultTo('{}');
    table.jsonb('conversation_history').notNullable().defaultTo('[]');

    // Session Metadata
    table.integer('total_messages').notNullable().defaultTo(0);
    table.integer('total_tokens_used').defaultTo(0);
    table.string('language', 10);

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Constraints
    table.check(`status IN ('ACTIVE', 'IDLE', 'ENDED', 'ESCALATED')`);
  });

  // Chat messages table
  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('session_id').notNullable().references('id').inTable('chat_sessions').onDelete('CASCADE');

    // Message Details
    table.string('role', 20).notNullable();
    table.text('content').notNullable();
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());

    // AI Processing
    table.string('intent', 100);
    table.decimal('confidence', 5, 4); // 0.0000 to 1.0000
    table.jsonb('entities');

    // Response Generation
    table.string('response_type', 50);
    table.jsonb('suggested_actions');
    table.jsonb('quick_replies');

    // Metadata
    table.integer('tokens_used');
    table.integer('processing_time_ms');
    table.string('model_version', 50);

    // PHI Protection
    table.boolean('contains_phi').notNullable().defaultTo(false);
    table.boolean('sanitized').notNullable().defaultTo(false);

    table.check(`role IN ('USER', 'ASSISTANT', 'SYSTEM')`);
  });

  // Chat feedback
  await knex.schema.createTable('chat_feedback', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('session_id').notNullable().references('id').inTable('chat_sessions').onDelete('CASCADE');
    table.uuid('message_id').references('id').inTable('chat_messages').onDelete('CASCADE');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');

    // Feedback
    table.integer('rating').notNullable(); // 1-5
    table.string('feedback_type', 50).notNullable();
    table.text('comment');
    table.jsonb('issues');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.check('rating >= 1 AND rating <= 5');
    table.check(`feedback_type IN ('HELPFUL', 'NOT_HELPFUL', 'INCORRECT', 'INAPPROPRIATE', 'SUGGESTION')`);
  });

  // Chat escalations
  await knex.schema.createTable('chat_escalations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('session_id').notNullable().references('id').inTable('chat_sessions').onDelete('CASCADE');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Escalation Details
    table.string('reason', 50).notNullable();
    table.string('priority', 20).notNullable().defaultTo('NORMAL');
    table.text('description').notNullable();

    // Assignment
    table.uuid('assigned_to').references('id').inTable('users');
    table.timestamp('assigned_at');
    table.string('status', 20).notNullable().defaultTo('PENDING');

    // Resolution
    table.timestamp('resolved_at');
    table.uuid('resolved_by').references('id').inTable('users');
    table.text('resolution');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.check(`reason IN ('USER_REQUESTED', 'COMPLEX_QUESTION', 'REQUIRES_AUTHORIZATION', 'SAFETY_CONCERN', 'COMPLAINT', 'TECHNICAL_ISSUE', 'LOW_CONFIDENCE', 'REPEATED_FAILURES')`);
    table.check(`priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);
    table.check(`status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')`);
  });

  // Knowledge base for AI (RAG)
  await knex.schema.createTable('knowledge_base_articles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // Article Details
    table.string('title', 255).notNullable();
    table.text('content').notNullable();
    table.string('category', 50).notNullable();
    table.jsonb('tags');

    // Embeddings (for semantic search)
    // Vector type may need pgvector extension
    table.specificType('embedding', 'vector(1536)'); // OpenAI ada-002 embedding size
    table.string('embedding_model', 100);

    // Relevance
    table.decimal('relevance_score', 5, 4);
    table.integer('usage_count').notNullable().defaultTo(0);

    // Status
    table.boolean('is_published').notNullable().defaultTo(false);
    table.timestamp('published_at');

    // State-Specific
    table.jsonb('applicable_states');

    // Metadata
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.check(`category IN ('CARE_SERVICES', 'MEDICATIONS', 'BILLING', 'SCHEDULING', 'CAREGIVER_INFO', 'EMERGENCY_PROCEDURES', 'COMPLIANCE', 'FAQ', 'TROUBLESHOOTING')`);
  });

  // ============================================================================
  // INDEXES
  // ============================================================================

  // Family members indexes
  await knex.raw('CREATE INDEX idx_family_members_email ON family_members(email) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_family_members_status ON family_members(status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_family_members_org ON family_members(organization_id) WHERE deleted_at IS NULL');

  // Family-client access indexes
  await knex.raw('CREATE INDEX idx_family_client_access_family ON family_client_access(family_member_id)');
  await knex.raw('CREATE INDEX idx_family_client_access_client ON family_client_access(client_id)');
  await knex.raw('CREATE INDEX idx_family_client_access_status ON family_client_access(status)');

  // Portal activity indexes
  await knex.raw('CREATE INDEX idx_portal_activity_family ON portal_activity_log(family_member_id)');
  await knex.raw('CREATE INDEX idx_portal_activity_client ON portal_activity_log(client_id)');
  await knex.raw('CREATE INDEX idx_portal_activity_occurred ON portal_activity_log(occurred_at DESC)');
  await knex.raw('CREATE INDEX idx_portal_activity_phi ON portal_activity_log(is_phi_access) WHERE is_phi_access = true');

  // Conversations indexes
  await knex.raw('CREATE INDEX idx_conversations_client ON conversations(client_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_conversations_status ON conversations(status) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_conversations_participants ON conversations USING gin(participants)');

  // Messages indexes
  await knex.raw('CREATE INDEX idx_messages_conversation ON messages(conversation_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_messages_sender ON messages(sender_id, sender_type) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_messages_phi ON messages(contains_phi) WHERE contains_phi = true AND deleted_at IS NULL');

  // Notifications indexes
  await knex.raw('CREATE INDEX idx_notifications_family ON notifications(family_member_id)');
  await knex.raw('CREATE INDEX idx_notifications_client ON notifications(client_id)');
  await knex.raw('CREATE INDEX idx_notifications_status ON notifications(delivery_status)');
  await knex.raw('CREATE INDEX idx_notifications_read ON notifications(read_at)');
  await knex.raw('CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL');

  // Chat sessions indexes
  await knex.raw('CREATE INDEX idx_chat_sessions_family ON chat_sessions(family_member_id)');
  await knex.raw('CREATE INDEX idx_chat_sessions_client ON chat_sessions(client_id)');
  await knex.raw('CREATE INDEX idx_chat_sessions_status ON chat_sessions(status)');
  await knex.raw('CREATE INDEX idx_chat_sessions_last_activity ON chat_sessions(last_activity_at DESC)');

  // Chat messages indexes
  await knex.raw('CREATE INDEX idx_chat_messages_session ON chat_messages(session_id)');
  await knex.raw('CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC)');

  // Knowledge base indexes
  await knex.raw('CREATE INDEX idx_knowledge_base_org ON knowledge_base_articles(organization_id)');
  await knex.raw('CREATE INDEX idx_knowledge_base_category ON knowledge_base_articles(category) WHERE is_published = true');
  await knex.raw('CREATE INDEX idx_knowledge_base_published ON knowledge_base_articles(is_published)');

  // Full-text search indexes
  await knex.raw(`
    CREATE INDEX idx_messages_search ON messages USING gin(
      to_tsvector('english', content)
    ) WHERE deleted_at IS NULL
  `);

  await knex.raw(`
    CREATE INDEX idx_knowledge_base_search ON knowledge_base_articles USING gin(
      to_tsvector('english', title || ' ' || content)
    ) WHERE is_published = true
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order (respecting foreign keys)
  await knex.schema.dropTableIfExists('knowledge_base_articles');
  await knex.schema.dropTableIfExists('chat_escalations');
  await knex.schema.dropTableIfExists('chat_feedback');
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_sessions');
  await knex.schema.dropTableIfExists('notification_deliveries');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('message_drafts');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('conversations');
  await knex.schema.dropTableIfExists('family_invitations');
  await knex.schema.dropTableIfExists('portal_activity_log');
  await knex.schema.dropTableIfExists('family_client_access');
  await knex.schema.dropTableIfExists('family_members');
}
