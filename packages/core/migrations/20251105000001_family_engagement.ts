import type { Knex } from 'knex';

/**
 * Family Engagement, Transparency & Communication Migration
 *
 * Adds database tables and fields to support:
 * - Secure messaging between caregivers and families
 * - Family member registration and access controls
 * - Transparency and activity tracking
 * - Notification preferences and delivery
 * - HIPAA-compliant audit logging
 */
export async function up(knex: Knex): Promise<void> {
  // Message threads table
  await knex.schema.createTable('message_threads', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();

    // Thread metadata
    table.string('subject', 500);
    table.string('thread_type', 50).notNullable().defaultTo('DIRECT'); // DIRECT, GROUP, FAMILY, CARE_TEAM
    table.uuid('care_recipient_id'); // Optional: link to specific care recipient

    // Participants (stored as JSONB array of user IDs)
    table.jsonb('participants').notNullable().defaultTo('[]');
    table.integer('participant_count').notNullable().defaultTo(0);

    // Thread status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.timestamp('last_message_at');
    table.uuid('last_message_by');
    table.text('last_message_preview');

    // Archive/mute
    table.boolean('is_archived').defaultTo(false);
    table.timestamp('archived_at');
    table.uuid('archived_by');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`thread_type IN ('DIRECT', 'GROUP', 'FAMILY', 'CARE_TEAM')`);
    table.check(`status IN ('ACTIVE', 'ARCHIVED', 'LOCKED')`);
    table.check(`participant_count > 0`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('care_recipient_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('last_message_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for message_threads
  await knex.raw('CREATE INDEX idx_threads_organization ON message_threads(organization_id, last_message_at DESC NULLS LAST)');
  await knex.raw('CREATE INDEX idx_threads_care_recipient ON message_threads(care_recipient_id) WHERE care_recipient_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_threads_active ON message_threads(organization_id, status, last_message_at DESC) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_threads_participants ON message_threads USING GIN(participants)');

  // Messages table
  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('thread_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Message content
    table.uuid('sender_id').notNullable();
    table.text('body').notNullable();
    table.jsonb('attachments').defaultTo('[]'); // Array of file metadata
    table.string('message_type', 50).notNullable().defaultTo('TEXT'); // TEXT, SYSTEM, NOTIFICATION

    // Reply tracking
    table.uuid('reply_to_id'); // For threaded replies
    table.integer('reply_count').defaultTo(0);

    // Status
    table.string('status', 50).notNullable().defaultTo('SENT');
    table.timestamp('edited_at');
    table.timestamp('deleted_at');
    table.uuid('deleted_by');

    // Delivery tracking (recipient_id -> timestamp mapping)
    table.jsonb('read_by').defaultTo('{}'); // {user_id: timestamp}
    table.integer('read_count').defaultTo(0);

    // Priority/urgency
    table.boolean('is_urgent').defaultTo(false);
    table.boolean('requires_acknowledgment').defaultTo(false);

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`message_type IN ('TEXT', 'SYSTEM', 'NOTIFICATION', 'ALERT')`);
    table.check(`status IN ('SENT', 'EDITED', 'DELETED')`);
    table.check(`read_count >= 0`);
    table.check(`reply_count >= 0`);

    // Foreign keys
    table.foreign('thread_id').references('id').inTable('message_threads').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('sender_id').references('id').inTable('users');
    table.foreign('reply_to_id').references('id').inTable('messages').onDelete('SET NULL');
    table.foreign('deleted_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for messages
  await knex.raw('CREATE INDEX idx_messages_thread ON messages(thread_id, created_at DESC) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_messages_urgent ON messages(thread_id, is_urgent, created_at DESC) WHERE is_urgent = true AND deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_messages_unread ON messages(thread_id) WHERE read_count < (SELECT participant_count FROM message_threads WHERE id = thread_id) - 1');
  await knex.raw('CREATE INDEX idx_messages_reply_to ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL');

  // Family members table
  await knex.schema.createTable('family_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();
    table.uuid('care_recipient_id').notNullable();
    table.uuid('user_id'); // Nullable until invitation is accepted

    // Family member info
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 50);
    table.string('relationship', 100).notNullable(); // Mother, Son, Legal Guardian, etc.

    // Access control
    table.string('access_level', 50).notNullable().defaultTo('BASIC');
    table.jsonb('permissions').defaultTo('{}'); // Granular permissions
    table.boolean('is_primary_contact').defaultTo(false);
    table.boolean('is_emergency_contact').defaultTo(false);

    // Invitation status
    table.string('invitation_status', 50).notNullable().defaultTo('PENDING');
    table.string('invitation_token', 255);
    table.timestamp('invitation_sent_at');
    table.timestamp('invitation_expires_at');
    table.timestamp('invitation_accepted_at');

    // Consent and authorization (HIPAA compliance)
    table.boolean('hipaa_authorization_signed').defaultTo(false);
    table.timestamp('hipaa_authorization_date');
    table.string('hipaa_authorization_document_id', 255);
    table.jsonb('consent_preferences').defaultTo('{}'); // What they can see/receive

    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.timestamp('deactivated_at');
    table.uuid('deactivated_by');
    table.text('deactivation_reason');

    // Notification preferences
    table.jsonb('notification_preferences').defaultTo('{}');
    table.boolean('email_notifications_enabled').defaultTo(true);
    table.boolean('sms_notifications_enabled').defaultTo(false);

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`access_level IN ('BASIC', 'STANDARD', 'FULL', 'ADMIN')`);
    table.check(`invitation_status IN ('PENDING', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED')`);
    table.check(`status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED')`);
    table.unique(['care_recipient_id', 'email']);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('care_recipient_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('deactivated_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_members
  await knex.raw('CREATE INDEX idx_family_care_recipient ON family_members(care_recipient_id, status)');
  await knex.raw('CREATE INDEX idx_family_user ON family_members(user_id) WHERE user_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_family_email ON family_members(email, organization_id)');
  await knex.raw('CREATE INDEX idx_family_primary ON family_members(care_recipient_id, is_primary_contact) WHERE is_primary_contact = true');
  await knex.raw('CREATE INDEX idx_family_invitation ON family_members(invitation_token) WHERE invitation_status IN (\'PENDING\', \'SENT\')');

  // Family access rules table (granular permissions)
  await knex.schema.createTable('family_access_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('family_member_id').notNullable();
    table.uuid('organization_id').notNullable();

    // Access rule definition
    table.string('resource_type', 100).notNullable(); // CARE_PLAN, VISIT, TASK, MESSAGE, etc.
    table.string('permission', 50).notNullable(); // READ, WRITE, DELETE
    table.boolean('allowed').notNullable().defaultTo(true);

    // Optional resource-specific constraints
    table.jsonb('conditions').defaultTo('{}'); // Time-based, status-based, etc.
    table.timestamp('effective_from');
    table.timestamp('effective_until');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`permission IN ('READ', 'WRITE', 'DELETE', 'APPROVE')`);
    table.unique(['family_member_id', 'resource_type', 'permission']);

    // Foreign keys
    table.foreign('family_member_id').references('id').inTable('family_members').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for family_access_rules
  await knex.raw('CREATE INDEX idx_access_rules_member ON family_access_rules(family_member_id, resource_type)');
  await knex.raw('CREATE INDEX idx_access_rules_resource ON family_access_rules(resource_type, organization_id)');

  // Activity feed table (transparency & audit trail)
  await knex.schema.createTable('activity_feed', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();

    // Activity details
    table.uuid('actor_id'); // User who performed the action (nullable for system actions)
    table.string('actor_type', 50).notNullable().defaultTo('USER'); // USER, SYSTEM, INTEGRATION
    table.string('action', 100).notNullable(); // CREATED, UPDATED, DELETED, VIEWED, etc.
    table.string('action_category', 50).notNullable(); // CARE, VISIT, TASK, MESSAGE, ACCESS, etc.

    // Resource affected
    table.string('resource_type', 100).notNullable();
    table.uuid('resource_id').notNullable();
    table.string('resource_display_name', 500);

    // Context
    table.uuid('care_recipient_id'); // Link to care recipient for family visibility
    table.jsonb('details').defaultTo('{}'); // Action-specific details
    table.jsonb('changes').defaultTo('{}'); // Before/after for updates

    // Visibility control
    table.boolean('visible_to_family').defaultTo(false);
    table.string('visibility_level', 50).notNullable().defaultTo('INTERNAL');

    // Metadata
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.jsonb('metadata').defaultTo('{}');

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`actor_type IN ('USER', 'SYSTEM', 'INTEGRATION', 'MOBILE_APP')`);
    table.check(`visibility_level IN ('INTERNAL', 'STAFF', 'FAMILY', 'PUBLIC')`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('actor_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('care_recipient_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users');
  });

  // Indexes for activity_feed
  await knex.raw('CREATE INDEX idx_activity_organization ON activity_feed(organization_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_activity_actor ON activity_feed(actor_id, created_at DESC) WHERE actor_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_activity_resource ON activity_feed(resource_type, resource_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_activity_care_recipient ON activity_feed(care_recipient_id, created_at DESC) WHERE care_recipient_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_activity_family_visible ON activity_feed(care_recipient_id, visible_to_family, created_at DESC) WHERE visible_to_family = true');
  await knex.raw('CREATE INDEX idx_activity_category ON activity_feed(action_category, organization_id, created_at DESC)');

  // Access logs table (HIPAA §164.528 compliance)
  await knex.schema.createTable('access_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable();

    // WHO accessed
    table.uuid('user_id').notNullable();
    table.string('user_type', 50).notNullable(); // STAFF, CAREGIVER, FAMILY, ADMIN
    table.string('user_display_name', 255);

    // WHAT was accessed
    table.string('resource_type', 100).notNullable();
    table.uuid('resource_id').notNullable();
    table.string('resource_display_name', 500);

    // WHEN accessed
    table.timestamp('accessed_at').notNullable().defaultTo(knex.fn.now());

    // HOW accessed
    table.string('access_method', 50).notNullable(); // WEB, MOBILE, API, EXPORT
    table.string('action', 100).notNullable(); // VIEW, DOWNLOAD, PRINT, EXPORT, MODIFY

    // WHY accessed (optional)
    table.text('purpose');
    table.string('authorization_type', 50); // HIPAA_AUTHORIZATION, EMERGENCY_ACCESS, etc.

    // Context
    table.uuid('care_recipient_id'); // Link to care recipient
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.jsonb('metadata').defaultTo('{}');

    // Compliance flags
    table.boolean('is_patient_access').defaultTo(false); // Patient accessing their own data
    table.boolean('is_emergency_access').defaultTo(false);
    table.boolean('requires_disclosure').defaultTo(true); // HIPAA §164.528

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();

    // Constraints
    table.check(`user_type IN ('STAFF', 'CAREGIVER', 'FAMILY', 'ADMIN', 'SYSTEM')`);
    table.check(`access_method IN ('WEB', 'MOBILE', 'API', 'EXPORT', 'PRINT', 'INTEGRATION')`);

    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('user_id').references('id').inTable('users');
    table.foreign('care_recipient_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users');
  });

  // Indexes for access_logs (HIPAA requires fast retrieval)
  await knex.raw('CREATE INDEX idx_access_logs_user ON access_logs(user_id, accessed_at DESC)');
  await knex.raw('CREATE INDEX idx_access_logs_resource ON access_logs(resource_type, resource_id, accessed_at DESC)');
  await knex.raw('CREATE INDEX idx_access_logs_care_recipient ON access_logs(care_recipient_id, accessed_at DESC) WHERE care_recipient_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_access_logs_disclosure ON access_logs(organization_id, accessed_at DESC) WHERE requires_disclosure = true');
  await knex.raw('CREATE INDEX idx_access_logs_emergency ON access_logs(organization_id, accessed_at DESC) WHERE is_emergency_access = true');

  // Notification preferences table
  await knex.schema.createTable('notification_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().unique();
    table.uuid('organization_id').notNullable();

    // Channel preferences
    table.boolean('push_enabled').defaultTo(true);
    table.boolean('email_enabled').defaultTo(true);
    table.boolean('sms_enabled').defaultTo(false);
    table.boolean('in_app_enabled').defaultTo(true);

    // Notification type preferences (JSONB map: notification_type -> enabled)
    table.jsonb('type_preferences').defaultTo('{}');

    // Quiet hours
    table.time('quiet_hours_start'); // e.g., '22:00:00'
    table.time('quiet_hours_end'); // e.g., '08:00:00'
    table.string('timezone', 50).defaultTo('America/New_York');

    // Digest preferences
    table.boolean('digest_enabled').defaultTo(false);
    table.string('digest_frequency', 50).defaultTo('DAILY'); // HOURLY, DAILY, WEEKLY
    table.time('digest_time').defaultTo('09:00:00');

    // Urgency filtering
    table.string('minimum_priority', 50).defaultTo('NORMAL'); // Only send this priority and above

    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`digest_frequency IN ('HOURLY', 'DAILY', 'WEEKLY')`);
    table.check(`minimum_priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);

    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for notification_preferences
  await knex.raw('CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id)');

  // Update push_notifications table to add new notification types
  await knex.raw(`
    ALTER TABLE push_notifications
    DROP CONSTRAINT IF EXISTS push_notifications_notification_type_check
  `);

  await knex.raw(`
    ALTER TABLE push_notifications
    ADD CONSTRAINT push_notifications_notification_type_check
    CHECK (notification_type IN (
      'VISIT_REMINDER', 'VISIT_STARTED', 'VISIT_CANCELLED', 'VISIT_COMPLETED',
      'TASK_ASSIGNED', 'TASK_DUE', 'TASK_COMPLETED',
      'SCHEDULE_UPDATED', 'MESSAGE_RECEIVED', 'MESSAGE_URGENT',
      'SYSTEM_ALERT', 'COMPLIANCE_WARNING',
      'FAMILY_INVITE', 'FAMILY_MESSAGE', 'CARE_PLAN_UPDATED',
      'INCIDENT_REPORTED', 'MEDICATION_REMINDER'
    ))
  `);

  // Triggers for updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_message_threads_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_message_threads_updated_at
      BEFORE UPDATE ON message_threads
      FOR EACH ROW
      EXECUTE FUNCTION update_message_threads_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_messages_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_messages_updated_at
      BEFORE UPDATE ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_messages_updated_at()
  `);

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
    CREATE OR REPLACE FUNCTION update_family_access_rules_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_family_access_rules_updated_at
      BEFORE UPDATE ON family_access_rules
      FOR EACH ROW
      EXECUTE FUNCTION update_family_access_rules_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_notification_preferences_updated_at
      BEFORE UPDATE ON notification_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_notification_preferences_updated_at()
  `);

  // Trigger to update thread's last_message_at when message is created
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_thread_last_message()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE message_threads
      SET
        last_message_at = NEW.created_at,
        last_message_by = NEW.sender_id,
        last_message_preview = LEFT(NEW.body, 200),
        updated_at = NOW()
      WHERE id = NEW.thread_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_update_thread_last_message
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_thread_last_message()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE message_threads IS 'Message conversation threads between caregivers and families'");
  await knex.raw("COMMENT ON TABLE messages IS 'Individual messages within threads with delivery tracking'");
  await knex.raw("COMMENT ON TABLE family_members IS 'Family members registered for family portal access'");
  await knex.raw("COMMENT ON TABLE family_access_rules IS 'Granular permissions for family member access control'");
  await knex.raw("COMMENT ON TABLE activity_feed IS 'Transparency feed showing actions and changes for family visibility'");
  await knex.raw("COMMENT ON TABLE access_logs IS 'HIPAA §164.528 compliant access logs for disclosure accounting'");
  await knex.raw("COMMENT ON TABLE notification_preferences IS 'User notification channel and type preferences'");

  await knex.raw("COMMENT ON COLUMN family_members.hipaa_authorization_signed IS 'HIPAA authorization required before family access'");
  await knex.raw("COMMENT ON COLUMN family_members.consent_preferences IS 'JSONB: What information family member is authorized to see'");
  await knex.raw("COMMENT ON COLUMN access_logs.requires_disclosure IS 'Whether access must be disclosed per HIPAA §164.528'");
  await knex.raw("COMMENT ON COLUMN activity_feed.visible_to_family IS 'Whether activity is visible in family portal'");
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS trigger_update_thread_last_message ON messages');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_notification_preferences_updated_at ON notification_preferences');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_access_rules_updated_at ON family_access_rules');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_family_members_updated_at ON family_members');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_message_threads_updated_at ON message_threads');

  await knex.raw('DROP FUNCTION IF EXISTS update_thread_last_message()');
  await knex.raw('DROP FUNCTION IF EXISTS update_notification_preferences_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_family_access_rules_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_family_members_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_messages_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_message_threads_updated_at()');

  // Restore original push_notifications constraint
  await knex.raw(`
    ALTER TABLE push_notifications
    DROP CONSTRAINT IF EXISTS push_notifications_notification_type_check
  `);

  await knex.raw(`
    ALTER TABLE push_notifications
    ADD CONSTRAINT push_notifications_notification_type_check
    CHECK (notification_type IN (
      'VISIT_REMINDER', 'VISIT_STARTED', 'VISIT_CANCELLED',
      'TASK_ASSIGNED', 'TASK_DUE', 'TASK_COMPLETED',
      'SCHEDULE_UPDATED', 'MESSAGE_RECEIVED',
      'SYSTEM_ALERT', 'COMPLIANCE_WARNING'
    ))
  `);

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('access_logs');
  await knex.schema.dropTableIfExists('activity_feed');
  await knex.schema.dropTableIfExists('family_access_rules');
  await knex.schema.dropTableIfExists('family_members');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('message_threads');
}
