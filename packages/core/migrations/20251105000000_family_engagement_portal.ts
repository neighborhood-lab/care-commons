import type { Knex } from 'knex';

/**
 * Family Engagement Platform - Transparency & Communication
 *
 * Creates tables for:
 * - Family member portal access
 * - Notifications and alerts
 * - Activity feed
 * - Messaging between family and care team
 * - Visit summaries for family transparency
 * - Care plan progress reports
 * - Consent and authorization tracking
 */
export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // Family Members & Portal Access
  // ============================================================================

  const hasFamilyMembersTable = await knex.schema.hasTable('family_members');
  if (!hasFamilyMembersTable) {
    await knex.schema.createTable('family_members', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

      // Client relationship
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
      table.string('relationship', 50).notNullable();
      table.text('relationship_note');
      table.boolean('is_primary_contact').notNullable().defaultTo(false);

      // Personal information
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('email', 255).notNullable();
      table.string('phone_number', 50).notNullable();
      table.string('preferred_contact_method', 20).notNullable().defaultTo('EMAIL');

      // Portal access
      table.string('portal_access_level', 50).notNullable().defaultTo('VIEW_BASIC');
      table.uuid('access_granted_by').notNullable().references('id').inTable('users');
      table.timestamp('access_granted_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('access_expires_at');

      // Status
      table.string('status', 20).notNullable().defaultTo('ACTIVE');
      table.string('invitation_status', 20).notNullable().defaultTo('PENDING');
      table.timestamp('invitation_sent_at');
      table.timestamp('invitation_accepted_at');

      // Preferences
      table.boolean('receive_notifications').notNullable().defaultTo(true);
      table.jsonb('notification_preferences').notNullable().defaultTo('{}');

      // Security
      table.timestamp('last_login_at');
      table.boolean('password_reset_required').notNullable().defaultTo(true);

      // Organization context
      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');
      table.integer('version').notNullable().defaultTo(1);

      // Constraints
      table.check(`relationship IN ('SPOUSE', 'PARENT', 'CHILD', 'SIBLING', 'GRANDPARENT', 'GRANDCHILD', 'GUARDIAN', 'POWER_OF_ATTORNEY', 'HEALTHCARE_PROXY', 'OTHER')`);
      table.check(`preferred_contact_method IN ('EMAIL', 'PHONE', 'SMS', 'PORTAL')`);
      table.check(`portal_access_level IN ('VIEW_BASIC', 'VIEW_DETAILED', 'VIEW_MEDICAL', 'VIEW_FINANCIAL', 'FULL_ACCESS')`);
      table.check(`status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')`);
      table.check(`invitation_status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED')`);
      table.unique(['client_id', 'email']);
    });
  }

  // Portal invitations table
  const hasPortalInvitationsTable = await knex.schema.hasTable('portal_invitations');
  if (!hasPortalInvitationsTable) {
    await knex.schema.createTable('portal_invitations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

      // Invitation details
      table.string('invitation_code', 100).notNullable().unique();
      table.string('status', 20).notNullable().defaultTo('PENDING');
      table.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('expires_at').notNullable();
      table.timestamp('accepted_at');
      table.timestamp('declined_at');
      table.timestamp('revoked_at');
      table.uuid('revoked_by').references('id').inTable('users');
      table.text('revoked_reason');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      table.check(`status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED')`);
    });
  }

  // ============================================================================
  // Notifications & Alerts
  // ============================================================================

  const hasNotificationsTable = await knex.schema.hasTable('family_notifications');
  if (!hasNotificationsTable) {
    await knex.schema.createTable('family_notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

      // Content
      table.string('category', 50).notNullable();
      table.string('priority', 20).notNullable().defaultTo('NORMAL');
      table.string('title', 255).notNullable();
      table.text('message').notNullable();
      table.string('action_url', 500);
      table.string('action_label', 100);

      // Metadata
      table.string('related_entity_type', 50);
      table.uuid('related_entity_id');

      // Delivery
      table.string('delivery_status', 20).notNullable().defaultTo('PENDING');
      table.timestamp('sent_at');
      table.timestamp('delivered_at');
      table.timestamp('read_at');
      table.timestamp('dismissed_at');

      // Channels
      table.boolean('email_sent').notNullable().defaultTo(false);
      table.boolean('sms_sent').notNullable().defaultTo(false);
      table.boolean('push_sent').notNullable().defaultTo(false);

      // Expiration
      table.timestamp('expires_at');

      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      table.check(`category IN ('VISIT', 'CARE_PLAN', 'INCIDENT', 'APPOINTMENT', 'MESSAGE', 'REMINDER', 'SYSTEM')`);
      table.check(`priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);
      table.check(`delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'DISMISSED')`);
      table.check(`related_entity_type IN ('VISIT', 'CARE_PLAN', 'INCIDENT', 'MESSAGE', 'APPOINTMENT') OR related_entity_type IS NULL`);
    });
  }

  // ============================================================================
  // Activity Feed
  // ============================================================================

  const hasActivityFeedTable = await knex.schema.hasTable('family_activity_feed');
  if (!hasActivityFeedTable) {
    await knex.schema.createTable('family_activity_feed', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

      // Activity details
      table.string('activity_type', 50).notNullable();
      table.string('title', 255).notNullable();
      table.text('description').notNullable();
      table.text('summary');

      // Related entities
      table.string('related_entity_type', 50).notNullable();
      table.uuid('related_entity_id').notNullable();

      // Metadata
      table.uuid('performed_by').references('id').inTable('users');
      table.string('performed_by_name', 255);
      table.timestamp('occurred_at').notNullable().defaultTo(knex.fn.now());

      // Display
      table.string('icon_type', 50);
      table.boolean('viewed_by_family').notNullable().defaultTo(false);
      table.timestamp('viewed_at');

      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      table.check(`activity_type IN ('VISIT_SCHEDULED', 'VISIT_STARTED', 'VISIT_COMPLETED', 'VISIT_CANCELLED', 'CARE_PLAN_UPDATED', 'GOAL_ACHIEVED', 'TASK_COMPLETED', 'NOTE_ADDED', 'INCIDENT_REPORTED', 'MESSAGE_RECEIVED', 'DOCUMENT_UPLOADED')`);
      table.check(`related_entity_type IN ('VISIT', 'CARE_PLAN', 'GOAL', 'TASK', 'NOTE', 'INCIDENT', 'MESSAGE', 'DOCUMENT')`);
    });
  }

  // ============================================================================
  // Messaging & Communication
  // ============================================================================

  const hasMessageThreadsTable = await knex.schema.hasTable('message_threads');
  if (!hasMessageThreadsTable) {
    await knex.schema.createTable('message_threads', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

      // Thread details
      table.string('subject', 255).notNullable();
      table.string('status', 20).notNullable().defaultTo('OPEN');
      table.string('priority', 20).notNullable().defaultTo('NORMAL');

      // Participants
      table.specificType('participants', 'uuid[]').notNullable();
      table.uuid('assigned_to_user_id').references('id').inTable('users');

      // Metadata
      table.timestamp('last_message_at').notNullable().defaultTo(knex.fn.now());
      table.integer('message_count').notNullable().defaultTo(0);
      table.integer('unread_count_family').notNullable().defaultTo(0);
      table.integer('unread_count_staff').notNullable().defaultTo(0);

      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      table.check(`status IN ('OPEN', 'CLOSED', 'ARCHIVED')`);
      table.check(`priority IN ('LOW', 'NORMAL', 'HIGH')`);
    });
  }

  const hasMessagesTable = await knex.schema.hasTable('messages');
  if (!hasMessagesTable) {
    await knex.schema.createTable('messages', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('thread_id').notNullable().references('id').inTable('message_threads').onDelete('CASCADE');
      table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

      // Sender
      table.uuid('sent_by').notNullable().references('id').inTable('users');
      table.string('sender_type', 20).notNullable();
      table.string('sender_name', 255).notNullable();

      // Content
      table.text('message_text').notNullable();
      table.specificType('attachment_urls', 'text[]');

      // Status
      table.string('status', 20).notNullable().defaultTo('SENT');
      table.timestamp('read_at');
      table.specificType('read_by', 'uuid[]');

      // Flags
      table.boolean('is_internal').notNullable().defaultTo(false);
      table.boolean('flagged_for_review').notNullable().defaultTo(false);
      table.text('flagged_reason');

      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      table.check(`sender_type IN ('FAMILY', 'STAFF')`);
      table.check(`status IN ('SENT', 'DELIVERED', 'READ')`);
    });
  }

  // ============================================================================
  // Visit Summaries for Family Transparency
  // ============================================================================

  const hasVisitSummariesTable = await knex.schema.hasTable('family_visit_summaries');
  if (!hasVisitSummariesTable) {
    await knex.schema.createTable('family_visit_summaries', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('visit_id').notNullable().references('id').inTable('visits').onDelete('CASCADE');
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
      table.specificType('family_member_ids', 'uuid[]').notNullable();

      // Visit details
      table.timestamp('scheduled_start_time').notNullable();
      table.timestamp('scheduled_end_time').notNullable();
      table.timestamp('actual_start_time');
      table.timestamp('actual_end_time');

      // Care provided
      table.string('caregiver_name', 255).notNullable();
      table.string('caregiver_photo_url', 500);
      table.jsonb('tasks_completed').notNullable().defaultTo('[]');
      table.text('visit_notes');

      // Status
      table.string('status', 50).notNullable();
      table.text('cancellation_reason');

      // Visibility
      table.boolean('visible_to_family').notNullable().defaultTo(true);
      table.timestamp('published_at');
      table.boolean('viewed_by_family').notNullable().defaultTo(false);
      table.timestamp('viewed_at');

      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      table.check(`status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')`);
    });
  }

  // ============================================================================
  // Care Plan Progress Reports
  // ============================================================================

  const hasProgressReportsTable = await knex.schema.hasTable('care_plan_progress_reports');
  if (!hasProgressReportsTable) {
    await knex.schema.createTable('care_plan_progress_reports', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('care_plan_id').notNullable().references('id').inTable('care_plans').onDelete('CASCADE');
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');
      table.specificType('family_member_ids', 'uuid[]').notNullable();

      // Report period
      table.timestamp('report_period_start').notNullable();
      table.timestamp('report_period_end').notNullable();
      table.string('report_type', 20).notNullable();

      // Progress summary
      table.integer('goals_total').notNullable().defaultTo(0);
      table.integer('goals_achieved').notNullable().defaultTo(0);
      table.integer('goals_in_progress').notNullable().defaultTo(0);
      table.integer('goals_at_risk').notNullable().defaultTo(0);

      // Goal details
      table.jsonb('goal_progress').notNullable().defaultTo('[]');

      // Narrative summary
      table.text('overall_summary').notNullable();
      table.text('concerns_noted');
      table.text('recommendations_for_family');

      // Metadata
      table.uuid('prepared_by').notNullable().references('id').inTable('users');
      table.string('prepared_by_name', 255).notNullable();
      table.timestamp('published_at');

      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
      table.uuid('branch_id').notNullable().references('id').inTable('branches').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      table.check(`report_type IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'AD_HOC')`);
    });
  }

  // ============================================================================
  // Consent & Authorization
  // ============================================================================

  const hasFamilyConsentTable = await knex.schema.hasTable('family_consent');
  if (!hasFamilyConsentTable) {
    await knex.schema.createTable('family_consent', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

      // Consent details
      table.string('consent_type', 50).notNullable();
      table.boolean('consent_given').notNullable();
      table.timestamp('consent_date').notNullable();
      table.timestamp('expires_at');

      // Legal
      table.uuid('signed_by_client_id').references('id').inTable('clients');
      table.uuid('signed_by_guardian_id').references('id').inTable('family_members');
      table.string('document_url', 500);

      // Revocation
      table.timestamp('revoked_at');
      table.uuid('revoked_by').references('id').inTable('users');
      table.text('revoked_reason');

      table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

      // Audit fields
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable().references('id').inTable('users');

      table.check(`consent_type IN ('PORTAL_ACCESS', 'INFORMATION_SHARING', 'HIPAA_AUTHORIZATION', 'PHOTO_SHARING')`);
    });
  }

  // ============================================================================
  // Indexes for Performance
  // ============================================================================

  // Family members indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_members_client ON family_members(client_id) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_members_org_branch ON family_members(organization_id, branch_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_members_invitation ON family_members(invitation_status, invitation_sent_at)');

  // Portal invitations indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_portal_invitations_family_member ON portal_invitations(family_member_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_portal_invitations_code ON portal_invitations(invitation_code)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_portal_invitations_status_expires ON portal_invitations(status, expires_at)');

  // Notifications indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_notifications_family_member ON family_notifications(family_member_id, delivery_status)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_notifications_unread ON family_notifications(family_member_id) WHERE delivery_status IN (\'PENDING\', \'SENT\', \'DELIVERED\')');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_notifications_created ON family_notifications(created_at DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_notifications_expires ON family_notifications(expires_at) WHERE expires_at IS NOT NULL');

  // Activity feed indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_activity_feed_family_member ON family_activity_feed(family_member_id, occurred_at DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_activity_feed_client ON family_activity_feed(client_id, occurred_at DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_activity_feed_unviewed ON family_activity_feed(family_member_id) WHERE viewed_by_family = false');

  // Message threads indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_message_threads_family_member ON message_threads(family_member_id, status)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_message_threads_client ON message_threads(client_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_message_threads_assigned ON message_threads(assigned_to_user_id) WHERE status = \'OPEN\'');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON message_threads(last_message_at DESC)');

  // Messages indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_family_member ON messages(family_member_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(thread_id) WHERE status != \'READ\'');

  // Visit summaries indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_visit_summaries_visit ON family_visit_summaries(visit_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_visit_summaries_client ON family_visit_summaries(client_id, scheduled_start_time DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_visit_summaries_published ON family_visit_summaries(published_at DESC) WHERE visible_to_family = true');

  // Progress reports indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_care_plan_progress_reports_care_plan ON care_plan_progress_reports(care_plan_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_care_plan_progress_reports_client ON care_plan_progress_reports(client_id, report_period_end DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_care_plan_progress_reports_published ON care_plan_progress_reports(published_at DESC)');

  // Consent indexes
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_consent_family_member ON family_consent(family_member_id, consent_type)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_consent_client ON family_consent(client_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_family_consent_active ON family_consent(family_member_id) WHERE consent_given = true AND revoked_at IS NULL');

  // ============================================================================
  // Triggers for updated_at
  // ============================================================================

  const tables = [
    'family_members',
    'portal_invitations',
    'family_notifications',
    'family_activity_feed',
    'message_threads',
    'messages',
    'family_visit_summaries',
    'care_plan_progress_reports',
    'family_consent'
  ];

  for (const tableName of tables) {
    await knex.raw(`
      DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};
      CREATE TRIGGER update_${tableName}_updated_at
        BEFORE UPDATE ON ${tableName}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  // ============================================================================
  // Table Comments
  // ============================================================================

  await knex.raw("COMMENT ON TABLE family_members IS 'Family members with portal access to view client care information'");
  await knex.raw("COMMENT ON TABLE portal_invitations IS 'Portal access invitations sent to family members'");
  await knex.raw("COMMENT ON TABLE family_notifications IS 'Notifications sent to family members about care updates'");
  await knex.raw("COMMENT ON TABLE family_activity_feed IS 'Activity feed showing care updates for family members'");
  await knex.raw("COMMENT ON TABLE message_threads IS 'Message threads between family members and care team'");
  await knex.raw("COMMENT ON TABLE messages IS 'Individual messages in family-staff communication threads'");
  await knex.raw("COMMENT ON TABLE family_visit_summaries IS 'Visit summaries shared with family members for transparency'");
  await knex.raw("COMMENT ON TABLE care_plan_progress_reports IS 'Care plan progress reports for family members'");
  await knex.raw("COMMENT ON TABLE family_consent IS 'Consent and authorization records for information sharing'");
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'family_consent',
    'care_plan_progress_reports',
    'family_visit_summaries',
    'messages',
    'message_threads',
    'family_activity_feed',
    'family_notifications',
    'portal_invitations',
    'family_members'
  ];

  // Drop triggers
  for (const tableName of tables) {
    await knex.raw(`DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName}`);
  }

  // Drop tables in reverse order
  for (const tableName of tables) {
    await knex.schema.dropTableIfExists(tableName);
  }
}
