import type { Knex } from 'knex';

/**
 * Family Engagement Platform Migration
 *
 * Adds database tables to support family engagement, transparency, and communication:
 * - Family member records and relationships
 * - Family user accounts for portal access
 * - Family notifications for transparency
 * - Family messaging for two-way communication
 * - Family consent and permission management
 */
export async function up(knex: Knex): Promise<void> {
  // Family members table - stores information about family members
  await knex.schema.createTable('family_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable(); // The client they are related to
    table.uuid('organization_id').notNullable();

    // Identity
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('preferred_name', 100);
    table.date('date_of_birth');

    // Relationship
    table.string('relationship_type', 50).notNullable(); // Parent, Child, Sibling, Spouse, Guardian, etc.
    table.boolean('is_primary_contact').defaultTo(false);
    table.boolean('is_emergency_contact').defaultTo(false);
    table.boolean('is_authorized_representative').defaultTo(false);
    table.integer('contact_priority').defaultTo(99); // Lower number = higher priority

    // Contact information
    table.string('email', 255);
    table.string('phone_primary', 20);
    table.string('phone_secondary', 20);
    table.string('phone_type', 20); // Mobile, Home, Work
    table.string('preferred_contact_method', 50).defaultTo('EMAIL'); // EMAIL, PHONE, SMS, APP
    table.jsonb('communication_preferences'); // Detailed preferences

    // Address
    table.text('address_line1');
    table.text('address_line2');
    table.string('city', 100);
    table.string('state', 50);
    table.string('postal_code', 20);
    table.string('country', 100).defaultTo('United States');

    // Permissions & access
    table.boolean('can_view_care_plans').defaultTo(false);
    table.boolean('can_view_visit_logs').defaultTo(false);
    table.boolean('can_view_medical_info').defaultTo(false);
    table.boolean('can_view_billing').defaultTo(false);
    table.boolean('can_receive_notifications').defaultTo(true);
    table.boolean('can_message_care_team').defaultTo(true);
    table.jsonb('custom_permissions'); // Flexible permissions structure

    // Language & accessibility
    table.string('preferred_language', 50).defaultTo('en');
    table.jsonb('accessibility_needs'); // Screen reader, large text, etc.

    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.text('notes'); // Internal notes about the family member

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`relationship_type IN (
      'PARENT', 'CHILD', 'SIBLING', 'SPOUSE', 'GUARDIAN',
      'GRANDPARENT', 'GRANDCHILD', 'AUNT_UNCLE', 'NIECE_NEPHEW',
      'COUSIN', 'FRIEND', 'NEIGHBOR', 'OTHER'
    )`);
    table.check(`status IN ('ACTIVE', 'INACTIVE', 'DECEASED')`);
    table.check(`preferred_contact_method IN ('EMAIL', 'PHONE', 'SMS', 'APP', 'POSTAL')`);
    table.check(`contact_priority >= 1 AND contact_priority <= 99`);

    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_members
  await knex.raw('CREATE INDEX idx_family_members_client ON family_members(client_id, status)');
  await knex.raw('CREATE INDEX idx_family_members_organization ON family_members(organization_id)');
  await knex.raw('CREATE INDEX idx_family_members_primary_contact ON family_members(client_id) WHERE is_primary_contact = true AND status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_family_members_emergency ON family_members(client_id) WHERE is_emergency_contact = true AND status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_family_members_email ON family_members(email) WHERE email IS NOT NULL AND status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_family_members_phone ON family_members(phone_primary) WHERE phone_primary IS NOT NULL AND status = \'ACTIVE\'');

  // Family users table - portal accounts for family members
  await knex.schema.createTable('family_users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('family_member_id').notNullable().unique();
    table.uuid('organization_id').notNullable();

    // Authentication
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255); // Hashed password
    table.string('auth_provider', 50).defaultTo('LOCAL'); // LOCAL, GOOGLE, APPLE, etc.
    table.string('external_auth_id', 255); // ID from external auth provider

    // Account status
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.string('verification_token', 255);
    table.timestamp('verification_token_expires');

    // Security
    table.string('password_reset_token', 255);
    table.timestamp('password_reset_expires');
    table.timestamp('last_login_at');
    table.string('last_login_ip', 45); // IPv6 max length
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('account_locked_until');
    table.jsonb('security_questions'); // Optional additional security

    // Preferences
    table.jsonb('notification_preferences'); // Email, SMS, push notifications
    table.jsonb('ui_preferences'); // Theme, language, etc.
    table.string('timezone', 100).defaultTo('America/New_York');

    // Terms & privacy
    table.boolean('terms_accepted').defaultTo(false);
    table.timestamp('terms_accepted_at');
    table.string('terms_version', 50);
    table.boolean('privacy_policy_accepted').defaultTo(false);
    table.timestamp('privacy_policy_accepted_at');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')`);
    table.check(`auth_provider IN ('LOCAL', 'GOOGLE', 'APPLE', 'MICROSOFT')`);
    table.check(`failed_login_attempts >= 0 AND failed_login_attempts <= 10`);

    // Foreign keys
    table.foreign('family_member_id').references('id').inTable('family_members').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_users
  await knex.raw('CREATE UNIQUE INDEX idx_family_users_email_lower ON family_users(LOWER(email)) WHERE status != \'DEACTIVATED\'');
  await knex.raw('CREATE INDEX idx_family_users_family_member ON family_users(family_member_id)');
  await knex.raw('CREATE INDEX idx_family_users_status ON family_users(status, last_login_at DESC)');
  await knex.raw('CREATE INDEX idx_family_users_verification ON family_users(verification_token) WHERE verification_token IS NOT NULL');
  await knex.raw('CREATE INDEX idx_family_users_password_reset ON family_users(password_reset_token) WHERE password_reset_token IS NOT NULL');

  // Family notifications table - notifications sent to family members
  await knex.schema.createTable('family_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('family_member_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Notification details
    table.string('notification_type', 100).notNullable();
    table.string('category', 50).notNullable(); // VISIT, CARE_PLAN, HEALTH, BILLING, SYSTEM
    table.string('priority', 50).notNullable().defaultTo('NORMAL');
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.jsonb('data'); // Additional structured data

    // Related entities
    table.uuid('related_entity_id'); // ID of visit, care plan, etc.
    table.string('related_entity_type', 50); // visit, care_plan, task, etc.

    // Delivery
    table.jsonb('delivery_channels'); // EMAIL, SMS, APP, PUSH
    table.timestamp('scheduled_for');
    table.string('delivery_status', 50).notNullable().defaultTo('PENDING');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('read_at');
    table.jsonb('delivery_details'); // Track delivery per channel
    table.text('delivery_error');

    // User interaction
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_archived').defaultTo(false);
    table.boolean('is_starred').defaultTo(false);
    table.timestamp('archived_at');

    // Expiration
    table.timestamp('expires_at'); // Optional expiration for time-sensitive notifications

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`notification_type IN (
      'VISIT_SCHEDULED', 'VISIT_STARTED', 'VISIT_COMPLETED', 'VISIT_CANCELLED',
      'CARE_PLAN_UPDATED', 'TASK_COMPLETED', 'MEDICATION_REMINDER',
      'HEALTH_UPDATE', 'INCIDENT_REPORT', 'BILLING_STATEMENT',
      'APPOINTMENT_REMINDER', 'DOCUMENT_SHARED', 'MESSAGE_RECEIVED',
      'SYSTEM_ANNOUNCEMENT', 'SURVEY_REQUEST', 'CONSENT_REQUIRED'
    )`);
    table.check(`category IN ('VISIT', 'CARE_PLAN', 'HEALTH', 'BILLING', 'COMMUNICATION', 'SYSTEM')`);
    table.check(`priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);
    table.check(`delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED')`);

    // Foreign keys
    table.foreign('family_member_id').references('id').inTable('family_members').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_notifications
  await knex.raw('CREATE INDEX idx_family_notifications_member ON family_notifications(family_member_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_notifications_client ON family_notifications(client_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_notifications_unread ON family_notifications(family_member_id, is_read, created_at DESC) WHERE is_archived = false');
  await knex.raw('CREATE INDEX idx_family_notifications_pending ON family_notifications(delivery_status, scheduled_for) WHERE delivery_status = \'PENDING\'');
  await knex.raw('CREATE INDEX idx_family_notifications_type ON family_notifications(notification_type, organization_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_notifications_category ON family_notifications(category, family_member_id, created_at DESC)');

  // Family messages table - two-way messaging between family and care team
  await knex.schema.createTable('family_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('conversation_id').notNullable(); // Groups messages into conversations
    table.uuid('client_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Sender & recipient
    table.uuid('sender_id').notNullable(); // Can be family_member_id or user_id
    table.string('sender_type', 50).notNullable(); // FAMILY, STAFF
    table.string('sender_name', 255).notNullable(); // Cached for display

    table.uuid('recipient_id'); // Specific recipient (optional, can be broadcast)
    table.string('recipient_type', 50); // FAMILY, STAFF, CARE_TEAM

    // Message content
    table.text('message_body').notNullable();
    table.string('message_type', 50).notNullable().defaultTo('TEXT'); // TEXT, IMAGE, FILE, VOICE
    table.jsonb('attachments'); // Array of attachment objects
    table.integer('attachment_count').defaultTo(0);

    // Status
    table.string('status', 50).notNullable().defaultTo('SENT');
    table.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('delivered_at');
    table.timestamp('read_at');
    table.boolean('is_read').defaultTo(false);

    // Threading
    table.uuid('parent_message_id'); // For replies/threading
    table.integer('thread_depth').defaultTo(0);

    // Flags & categories
    table.boolean('is_urgent').defaultTo(false);
    table.boolean('is_flagged').defaultTo(false);
    table.boolean('is_archived').defaultTo(false);
    table.string('category', 50); // GENERAL, CARE_QUESTION, SCHEDULING, BILLING, etc.
    table.jsonb('tags'); // Flexible tagging system

    // Moderation
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at');
    table.uuid('deleted_by');
    table.text('deletion_reason');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`sender_type IN ('FAMILY', 'STAFF')`);
    table.check(`recipient_type IN ('FAMILY', 'STAFF', 'CARE_TEAM', NULL)`);
    table.check(`message_type IN ('TEXT', 'IMAGE', 'FILE', 'VOICE', 'VIDEO')`);
    table.check(`status IN ('DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED')`);
    table.check(`category IN ('GENERAL', 'CARE_QUESTION', 'SCHEDULING', 'BILLING', 'EMERGENCY', NULL)`);
    table.check(`thread_depth >= 0 AND thread_depth <= 10`);
    table.check(`attachment_count >= 0`);

    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('parent_message_id').references('id').inTable('family_messages').onDelete('SET NULL');
    table.foreign('deleted_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_messages
  await knex.raw('CREATE INDEX idx_family_messages_conversation ON family_messages(conversation_id, created_at ASC) WHERE is_deleted = false');
  await knex.raw('CREATE INDEX idx_family_messages_client ON family_messages(client_id, created_at DESC) WHERE is_deleted = false');
  await knex.raw('CREATE INDEX idx_family_messages_sender ON family_messages(sender_id, sender_type, created_at DESC)');
  await knex.raw('CREATE INDEX idx_family_messages_unread ON family_messages(recipient_id, is_read, created_at DESC) WHERE is_deleted = false AND status = \'SENT\'');
  await knex.raw('CREATE INDEX idx_family_messages_urgent ON family_messages(organization_id, is_urgent, created_at DESC) WHERE is_urgent = true AND is_deleted = false');
  await knex.raw('CREATE INDEX idx_family_messages_category ON family_messages(category, client_id, created_at DESC) WHERE category IS NOT NULL');

  // Family consents table - track consents for various features
  await knex.schema.createTable('family_consents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('family_member_id').notNullable();
    table.uuid('client_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Consent details
    table.string('consent_type', 100).notNullable();
    table.string('consent_category', 50).notNullable(); // MEDICAL, COMMUNICATION, DATA_SHARING, etc.
    table.string('consent_status', 50).notNullable().defaultTo('PENDING');

    // Consent text
    table.text('consent_text').notNullable(); // The actual consent language
    table.string('consent_version', 50).notNullable(); // Version of consent document

    // Response
    table.boolean('is_granted').defaultTo(false);
    table.timestamp('granted_at');
    table.timestamp('revoked_at');
    table.text('revocation_reason');
    table.uuid('revoked_by');

    // Digital signature
    table.string('signature_data', 500); // Base64 or signature identifier
    table.string('signature_method', 50); // DIGITAL, ELECTRONIC, VERBAL, WRITTEN
    table.string('ip_address', 45);
    table.jsonb('metadata'); // Device info, location, etc.

    // Expiration & renewal
    table.timestamp('expires_at');
    table.boolean('requires_renewal').defaultTo(false);
    table.timestamp('renewed_at');
    table.uuid('supersedes_consent_id'); // Links to previous consent if renewed

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`consent_type IN (
      'VIEW_CARE_PLANS', 'VIEW_VISIT_LOGS', 'VIEW_MEDICAL_INFO', 'VIEW_BILLING',
      'RECEIVE_NOTIFICATIONS', 'MESSAGE_CARE_TEAM', 'SHARE_DATA',
      'EMERGENCY_CONTACT', 'MEDICAL_DECISIONS', 'HIPAA_ACCESS'
    )`);
    table.check(`consent_category IN ('MEDICAL', 'COMMUNICATION', 'DATA_SHARING', 'LEGAL', 'MARKETING')`);
    table.check(`consent_status IN ('PENDING', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED')`);
    table.check(`signature_method IN ('DIGITAL', 'ELECTRONIC', 'VERBAL', 'WRITTEN', 'SMS', 'EMAIL')`);

    // Foreign keys
    table.foreign('family_member_id').references('id').inTable('family_members').onDelete('CASCADE');
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('supersedes_consent_id').references('id').inTable('family_consents');
    table.foreign('revoked_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_consents
  await knex.raw('CREATE INDEX idx_family_consents_member ON family_consents(family_member_id, consent_type)');
  await knex.raw('CREATE INDEX idx_family_consents_client ON family_consents(client_id)');
  await knex.raw('CREATE INDEX idx_family_consents_active ON family_consents(family_member_id, consent_type, consent_status) WHERE consent_status = \'GRANTED\' AND (expires_at IS NULL OR expires_at > NOW())');
  await knex.raw('CREATE INDEX idx_family_consents_expiring ON family_consents(organization_id, expires_at) WHERE consent_status = \'GRANTED\' AND expires_at IS NOT NULL');

  // Triggers for updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_family_members_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_family_members_updated_at
      BEFORE UPDATE ON family_members
      FOR EACH ROW
      EXECUTE FUNCTION update_family_members_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_family_users_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_family_users_updated_at
      BEFORE UPDATE ON family_users
      FOR EACH ROW
      EXECUTE FUNCTION update_family_users_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_family_notifications_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_family_notifications_updated_at
      BEFORE UPDATE ON family_notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_family_notifications_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_family_messages_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_family_messages_updated_at
      BEFORE UPDATE ON family_messages
      FOR EACH ROW
      EXECUTE FUNCTION update_family_messages_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_family_consents_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_family_consents_updated_at
      BEFORE UPDATE ON family_consents
      FOR EACH ROW
      EXECUTE FUNCTION update_family_consents_updated_at()
  `);

  // Auto-update is_read when read_at is set
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_family_notification_read_status()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
        NEW.is_read = true;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_family_notification_read_status
      BEFORE UPDATE ON family_notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_family_notification_read_status()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_family_message_read_status()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
        NEW.is_read = true;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_family_message_read_status
      BEFORE UPDATE ON family_messages
      FOR EACH ROW
      EXECUTE FUNCTION update_family_message_read_status()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE family_members IS 'Family members related to clients - stores contact and relationship information'");
  await knex.raw("COMMENT ON TABLE family_users IS 'Portal user accounts for family members to access family engagement features'");
  await knex.raw("COMMENT ON TABLE family_notifications IS 'Notifications sent to family members for transparency and updates'");
  await knex.raw("COMMENT ON TABLE family_messages IS 'Two-way messaging between family members and care team'");
  await knex.raw("COMMENT ON TABLE family_consents IS 'Tracks family member consents for various features and data access'");

  await knex.raw("COMMENT ON COLUMN family_members.is_authorized_representative IS 'Legal authorization to make decisions on behalf of client'");
  await knex.raw("COMMENT ON COLUMN family_members.custom_permissions IS 'JSONB: Flexible permissions structure for organization-specific needs'");
  await knex.raw("COMMENT ON COLUMN family_users.external_auth_id IS 'User ID from external OAuth provider (Google, Apple, etc.)'");
  await knex.raw("COMMENT ON COLUMN family_notifications.delivery_channels IS 'JSONB array: [EMAIL, SMS, APP, PUSH]'");
  await knex.raw("COMMENT ON COLUMN family_messages.conversation_id IS 'UUID grouping messages into conversations/threads'");
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_message_read_status ON family_messages');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_notification_read_status ON family_notifications');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_consents_updated_at ON family_consents');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_messages_updated_at ON family_messages');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_notifications_updated_at ON family_notifications');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_users_updated_at ON family_users');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_members_updated_at ON family_members');

  await knex.raw('DROP FUNCTION IF EXISTS update_family_message_read_status()');
  await knex.raw('DROP FUNCTION IF EXISTS update_family_notification_read_status()');
  await knex.raw('DROP FUNCTION IF EXISTS update_family_consents_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_family_messages_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_family_notifications_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_family_users_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_family_members_updated_at()');

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('family_consents');
  await knex.schema.dropTableIfExists('family_messages');
  await knex.schema.dropTableIfExists('family_notifications');
  await knex.schema.dropTableIfExists('family_users');
  await knex.schema.dropTableIfExists('family_members');
}
