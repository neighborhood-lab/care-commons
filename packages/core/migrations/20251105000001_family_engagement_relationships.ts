import type { Knex } from 'knex';

/**
 * Migration: Family Engagement - Relationships & Permissions
 *
 * This migration creates the database schema for the Family Engagement Platform,
 * enabling family members to access care information, communicate with staff,
 * and stay informed about their loved ones' care progress.
 *
 * Tables:
 * - family_members: Profile information for family members
 * - family_client_relationships: Links family members to clients they're associated with
 * - family_permissions: Fine-grained access control for what families can view/do
 * - family_access_log: Audit trail of family member access
 * - transparency_settings: Organization and client-level transparency configuration
 */

export async function up(knex: Knex): Promise<void> {
  // ==========================================
  // 1. FAMILY MEMBERS TABLE
  // ==========================================
  await knex.schema.createTable('family_members', (table) => {
    // Primary key and organization
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // Identity
    table.string('first_name', 100).notNullable();
    table.string('middle_name', 100);
    table.string('last_name', 100).notNullable();
    table.string('preferred_name', 100);
    table.string('suffix', 20); // Jr., Sr., III, etc.

    // Contact information
    table.string('email', 255).notNullable();
    table.jsonb('primary_phone'); // { number, type, preferred_time }
    table.jsonb('alternate_phone');
    table.string('preferred_contact_method', 50).defaultTo('EMAIL'); // EMAIL, SMS, PHONE, APP
    table.jsonb('communication_preferences'); // { language, timezone, quiet_hours, notification_frequency }

    // Address (for mailings, emergency contact)
    table.jsonb('address');

    // Account & authentication
    table.string('auth_user_id').unique(); // References external auth system (e.g., Auth0, Cognito)
    table.boolean('account_active').defaultTo(true);
    table.timestamp('account_activated_at');
    table.timestamp('last_login_at');
    table.string('account_status', 50).defaultTo('PENDING_ACTIVATION'); // PENDING_ACTIVATION, ACTIVE, SUSPENDED, DEACTIVATED

    // Portal preferences
    table.jsonb('portal_preferences'); // { theme, dashboard_layout, default_view }

    // Security
    table.boolean('requires_two_factor').defaultTo(false);
    table.timestamp('password_changed_at');
    table.timestamp('terms_accepted_at');
    table.string('terms_version', 20);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.timestamp('deleted_at');
    table.uuid('deleted_by').references('id').inTable('users');

    // Indexes
    table.index(['organization_id'], 'idx_family_members_org');
    table.index(['email'], 'idx_family_members_email');
    table.index(['account_status'], 'idx_family_members_status');
  });

  await knex.raw("COMMENT ON TABLE family_members IS 'Family member profiles for accessing the family portal'");
  await knex.raw("COMMENT ON COLUMN family_members.auth_user_id IS 'External authentication system user ID (Auth0, Cognito, etc.)'");

  // ==========================================
  // 2. FAMILY-CLIENT RELATIONSHIPS TABLE
  // ==========================================
  await knex.schema.createTable('family_client_relationships', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Relationship details
    table.string('relationship_type', 100).notNullable(); // PARENT, CHILD, SPOUSE, SIBLING, GUARDIAN, POA, AUTHORIZED_REP, OTHER
    table.string('relationship_description', 255); // Free text for OTHER
    table.boolean('is_primary_contact').defaultTo(false);
    table.boolean('is_emergency_contact').defaultTo(false);

    // Legal authority
    table.boolean('has_legal_authority').defaultTo(false);
    table.string('legal_authority_type', 100); // POA_HEALTHCARE, POA_FINANCIAL, GUARDIAN, CONSERVATOR, NONE
    table.jsonb('legal_documents'); // Array of { type, document_id, expiration_date, scope }
    table.date('legal_authority_verified_date');
    table.uuid('legal_authority_verified_by').references('id').inTable('users');

    // Consent and permissions
    table.boolean('hipaa_authorized').defaultTo(false);
    table.date('hipaa_authorization_date');
    table.jsonb('hipaa_authorization_scope'); // Specific types of info they can access
    table.uuid('hipaa_consent_document_id'); // Reference to stored signed consent form

    // Involvement level
    table.string('involvement_level', 50).defaultTo('OBSERVER'); // OBSERVER, ACTIVE, PRIMARY_DECISION_MAKER, EMERGENCY_ONLY
    table.text('notes'); // Staff notes about the family member's role

    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE'); // ACTIVE, SUSPENDED, REVOKED, EXPIRED
    table.date('effective_date').notNullable();
    table.date('expiration_date'); // For temporary relationships
    table.text('status_reason'); // Why suspended/revoked

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.timestamp('deleted_at');
    table.uuid('deleted_by').references('id').inTable('users');

    // Constraints
    table.unique(['family_member_id', 'client_id', 'organization_id'], { predicate: knex.whereNull('deleted_at') });

    // Indexes
    table.index(['organization_id'], 'idx_family_rel_org');
    table.index(['family_member_id'], 'idx_family_rel_member');
    table.index(['client_id'], 'idx_family_rel_client');
    table.index(['status'], 'idx_family_rel_status');
    table.index(['is_primary_contact'], 'idx_family_rel_primary');
  });

  await knex.raw("COMMENT ON TABLE family_client_relationships IS 'Links family members to clients with relationship details and legal authority'");
  await knex.raw("COMMENT ON COLUMN family_client_relationships.involvement_level IS 'How involved the family member is in care decisions'");

  // ==========================================
  // 3. FAMILY PERMISSIONS TABLE
  // ==========================================
  await knex.schema.createTable('family_permissions', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('relationship_id').notNullable().references('id').inTable('family_client_relationships').onDelete('CASCADE');

    // Permission categories - Care Information
    table.boolean('can_view_care_plan').defaultTo(false);
    table.boolean('can_view_visit_schedule').defaultTo(false);
    table.boolean('can_view_visit_notes').defaultTo(false);
    table.boolean('can_view_progress_updates').defaultTo(false);
    table.boolean('can_view_tasks').defaultTo(false);
    table.boolean('can_view_goals').defaultTo(false);

    // Permission categories - Medical Information
    table.boolean('can_view_medications').defaultTo(false);
    table.boolean('can_view_medical_history').defaultTo(false);
    table.boolean('can_view_vital_signs').defaultTo(false);
    table.boolean('can_view_assessments').defaultTo(false);
    table.boolean('can_view_diagnoses').defaultTo(false);

    // Permission categories - Billing & Financial
    table.boolean('can_view_invoices').defaultTo(false);
    table.boolean('can_view_payment_history').defaultTo(false);
    table.boolean('can_make_payments').defaultTo(false);

    // Permission categories - Communication
    table.boolean('can_send_messages').defaultTo(false);
    table.boolean('can_receive_messages').defaultTo(true);
    table.boolean('can_view_message_history').defaultTo(false);
    table.boolean('can_request_callback').defaultTo(false);

    // Permission categories - Scheduling & Requests
    table.boolean('can_view_caregiver_info').defaultTo(false);
    table.boolean('can_request_schedule_changes').defaultTo(false);
    table.boolean('can_cancel_visits').defaultTo(false);
    table.boolean('can_rate_visits').defaultTo(false);

    // Permission categories - Documents
    table.boolean('can_view_documents').defaultTo(false);
    table.boolean('can_upload_documents').defaultTo(false);
    table.boolean('can_sign_documents').defaultTo(false);

    // Permission categories - Incidents & Concerns
    table.boolean('can_view_incident_reports').defaultTo(false);
    table.boolean('can_submit_concerns').defaultTo(true);

    // Notification preferences (what they want to be notified about)
    table.boolean('notify_visit_start').defaultTo(true);
    table.boolean('notify_visit_end').defaultTo(true);
    table.boolean('notify_visit_missed').defaultTo(true);
    table.boolean('notify_schedule_changes').defaultTo(true);
    table.boolean('notify_care_plan_updates').defaultTo(true);
    table.boolean('notify_new_messages').defaultTo(true);
    table.boolean('notify_medication_changes').defaultTo(false);
    table.boolean('notify_incidents').defaultTo(true);
    table.boolean('notify_progress_updates').defaultTo(true);

    // Permission metadata
    table.timestamp('effective_date').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expiration_date'); // For temporary elevated permissions
    table.text('permission_notes'); // Why certain permissions granted/denied

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');

    // Constraints
    table.unique(['relationship_id'], 'unique_permissions_per_relationship');

    // Indexes
    table.index(['organization_id'], 'idx_family_perm_org');
    table.index(['relationship_id'], 'idx_family_perm_rel');
  });

  await knex.raw("COMMENT ON TABLE family_permissions IS 'Fine-grained access control for family members'");
  await knex.raw("COMMENT ON COLUMN family_permissions.notify_visit_start IS 'Send notification when caregiver checks in'");

  // ==========================================
  // 4. FAMILY ACCESS LOG TABLE
  // ==========================================
  await knex.schema.createTable('family_access_log', (table) => {
    // Primary key and relationships
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members');
    table.uuid('client_id').references('id').inTable('clients'); // May be null for org-level actions

    // Access details
    table.string('action_type', 100).notNullable(); // VIEW, DOWNLOAD, SEND_MESSAGE, REQUEST, UPDATE, etc.
    table.string('resource_type', 100).notNullable(); // CARE_PLAN, VISIT_NOTE, MESSAGE, DOCUMENT, etc.
    table.uuid('resource_id'); // ID of the specific resource accessed
    table.jsonb('action_details'); // Additional context about the action

    // Access metadata
    table.timestamp('accessed_at').notNullable().defaultTo(knex.fn.now());
    table.string('ip_address', 45); // IPv6 compatible
    table.string('user_agent', 500);
    table.string('device_type', 50); // WEB, MOBILE_IOS, MOBILE_ANDROID
    table.string('session_id', 255);

    // Result
    table.string('result', 50).notNullable(); // SUCCESS, DENIED, ERROR
    table.text('error_message'); // If denied or error

    // Indexes
    table.index(['organization_id', 'accessed_at'], 'idx_family_log_org_date');
    table.index(['family_member_id', 'accessed_at'], 'idx_family_log_member_date');
    table.index(['client_id', 'accessed_at'], 'idx_family_log_client_date');
    table.index(['action_type'], 'idx_family_log_action');
    table.index(['resource_type'], 'idx_family_log_resource');
  });

  await knex.raw("COMMENT ON TABLE family_access_log IS 'Comprehensive audit trail of all family member portal activity'");
  await knex.raw("COMMENT ON COLUMN family_access_log.result IS 'Whether the access attempt succeeded or was denied'");

  // ==========================================
  // 5. TRANSPARENCY SETTINGS TABLE
  // ==========================================
  await knex.schema.createTable('transparency_settings', (table) => {
    // Primary key and scope
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').references('id').inTable('clients'); // Null = org-level defaults

    // General transparency settings
    table.boolean('enable_family_portal').defaultTo(true);
    table.boolean('allow_family_registration').defaultTo(true);
    table.boolean('require_staff_approval').defaultTo(true); // For new family member registrations

    // Default visibility settings (org-level) or overrides (client-level)
    table.boolean('default_show_care_plan').defaultTo(true);
    table.boolean('default_show_visit_schedule').defaultTo(true);
    table.boolean('default_show_visit_notes').defaultTo(false); // May contain sensitive staff notes
    table.boolean('default_show_progress_updates').defaultTo(true);
    table.boolean('default_show_medications').defaultTo(false); // HIPAA sensitive
    table.boolean('default_show_vital_signs').defaultTo(false); // HIPAA sensitive
    table.boolean('default_show_invoices').defaultTo(false);

    // Communication settings
    table.boolean('enable_messaging').defaultTo(true);
    table.boolean('enable_family_to_staff_messages').defaultTo(true);
    table.boolean('enable_staff_to_family_messages').defaultTo(true);
    table.boolean('require_message_moderation').defaultTo(false);
    table.integer('message_response_sla_hours').defaultTo(24); // Expected response time

    // Notification settings
    table.boolean('auto_notify_visit_start').defaultTo(true);
    table.boolean('auto_notify_visit_end').defaultTo(true);
    table.boolean('auto_notify_visit_missed').defaultTo(true);
    table.boolean('auto_notify_schedule_changes').defaultTo(true);
    table.boolean('auto_notify_incidents').defaultTo(true);

    // Progress update frequency
    table.string('progress_update_frequency', 50).defaultTo('WEEKLY'); // DAILY, WEEKLY, BIWEEKLY, MONTHLY, NEVER
    table.integer('progress_update_day_of_week'); // 0-6 for weekly, null for other frequencies
    table.time('progress_update_time'); // Preferred time of day for automated updates

    // Privacy and data retention
    table.integer('message_retention_days').defaultTo(365); // How long to keep messages
    table.integer('access_log_retention_days').defaultTo(730); // How long to keep access logs
    table.boolean('redact_staff_names').defaultTo(false); // Hide staff names from family
    table.boolean('redact_caregiver_details').defaultTo(false); // Hide caregiver personal details

    // Custom messaging
    table.text('welcome_message'); // Shown when family member first logs in
    table.text('privacy_notice'); // Custom privacy notice for the organization
    table.jsonb('custom_settings'); // Extensible for future settings

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');

    // Constraints - only one settings record per org (default) or per client (override)
    table.unique(['organization_id'], { predicate: knex.whereNull('client_id') });
    table.unique(['organization_id', 'client_id'], { predicate: knex.whereNotNull('client_id') });

    // Indexes
    table.index(['organization_id'], 'idx_transparency_org');
    table.index(['client_id'], 'idx_transparency_client');
  });

  await knex.raw("COMMENT ON TABLE transparency_settings IS 'Organization and client-level configuration for family portal transparency'");
  await knex.raw("COMMENT ON COLUMN transparency_settings.client_id IS 'NULL for org-level defaults, populated for client-specific overrides'");
  await knex.raw("COMMENT ON COLUMN transparency_settings.progress_update_frequency IS 'How often families receive automated progress updates'");

  // ==========================================
  // TRIGGER: Auto-update updated_at
  // ==========================================
  await knex.raw(`
    CREATE TRIGGER update_family_members_updated_at
      BEFORE UPDATE ON family_members
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_family_client_relationships_updated_at
      BEFORE UPDATE ON family_client_relationships
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_family_permissions_updated_at
      BEFORE UPDATE ON family_permissions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_transparency_settings_updated_at
      BEFORE UPDATE ON transparency_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS update_transparency_settings_updated_at ON transparency_settings');
  await knex.raw('DROP TRIGGER IF EXISTS update_family_permissions_updated_at ON family_permissions');
  await knex.raw('DROP TRIGGER IF EXISTS update_family_client_relationships_updated_at ON family_client_relationships');
  await knex.raw('DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members');

  // Drop tables in reverse order (respecting foreign keys)
  await knex.schema.dropTableIfExists('transparency_settings');
  await knex.schema.dropTableIfExists('family_access_log');
  await knex.schema.dropTableIfExists('family_permissions');
  await knex.schema.dropTableIfExists('family_client_relationships');
  await knex.schema.dropTableIfExists('family_members');
}
