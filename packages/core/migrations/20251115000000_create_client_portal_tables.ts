/**
 * Client Portal Migration
 *
 * Creates tables for client self-service portal:
 * - Client portal access and credentials
 * - Visit ratings and feedback
 * - Schedule change requests
 * - Video call session metadata
 * - Care plan access logs
 *
 * WCAG 2.1 AA accessibility requirements tracked in application layer.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // Client Portal Access
  // ============================================================================

  /**
   * Client portal credentials and access settings
   * Links clients to authentication system with portal-specific preferences
   */
  await knex.schema.createTable('client_portal_access', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable()
      .references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('organization_id').notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('branch_id').notNullable()
      .references('id').inTable('branches').onDelete('CASCADE');

    // Access control
    table.enum('status', [
      'PENDING_ACTIVATION', // Invitation sent
      'ACTIVE',             // Portal access enabled
      'SUSPENDED',          // Temporarily disabled
      'REVOKED',            // Permanently disabled
    ]).notNullable().defaultTo('PENDING_ACTIVATION');

    table.boolean('portal_enabled').notNullable().defaultTo(true);
    table.timestamp('last_login_at').nullable();
    table.string('last_login_ip', 45).nullable(); // IPv6 support
    table.integer('login_count').notNullable().defaultTo(0);

    // Invitation
    table.string('invitation_code', 128).unique().nullable();
    table.timestamp('invitation_sent_at').nullable();
    table.timestamp('invitation_expires_at').nullable();
    table.timestamp('activated_at').nullable();

    // Accessibility preferences
    table.jsonb('accessibility_preferences').notNullable().defaultTo('{}');
    // Example: { fontSize: 'large', highContrast: true, voiceControl: false }

    // Notification preferences
    table.jsonb('notification_preferences').notNullable().defaultTo('{}');
    // Example: { visitReminders: true, caregiverChanges: true, method: 'EMAIL' }

    // Security
    table.boolean('password_reset_required').notNullable().defaultTo(false);
    table.timestamp('password_changed_at').nullable();
    table.integer('failed_login_attempts').notNullable().defaultTo(0);
    table.timestamp('locked_until').nullable();

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
    table.integer('version').notNullable().defaultTo(1);

    // Indexes
    table.index('client_id');
    table.index('organization_id');
    table.index(['status', 'portal_enabled']);
    table.index('invitation_code');
  });

  // ============================================================================
  // Visit Ratings
  // ============================================================================

  /**
   * Client ratings and feedback for completed visits
   * Enables clients to rate caregiver performance and visit quality
   */
  await knex.schema.createTable('client_visit_ratings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable()
      .references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('visit_id').notNullable()
      .references('id').inTable('visits').onDelete('CASCADE');
    table.uuid('caregiver_id').notNullable()
      .references('id').inTable('caregivers').onDelete('CASCADE');
    table.uuid('organization_id').notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');

    // Rating (1-5 stars)
    table.integer('overall_rating').notNullable()
      .checkBetween([1, 5]);

    // Specific dimensions (optional, 1-5 stars)
    table.integer('professionalism_rating').nullable()
      .checkBetween([1, 5]);
    table.integer('punctuality_rating').nullable()
      .checkBetween([1, 5]);
    table.integer('quality_of_care_rating').nullable()
      .checkBetween([1, 5]);
    table.integer('communication_rating').nullable()
      .checkBetween([1, 5]);

    // Feedback
    table.text('positive_feedback').nullable();
    table.text('improvement_feedback').nullable();
    table.text('additional_comments').nullable();

    // Flags
    table.boolean('would_request_again').nullable();
    table.boolean('flagged_for_review').notNullable().defaultTo(false);
    table.text('flag_reason').nullable();

    // Metadata
    table.timestamp('rated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_anonymous').notNullable().defaultTo(false);
    table.boolean('visible_to_caregiver').notNullable().defaultTo(true);

    // Response from coordinator (optional)
    table.text('coordinator_response').nullable();
    table.timestamp('coordinator_responded_at').nullable();
    table.uuid('coordinator_id').nullable()
      .references('id').inTable('users').onDelete('SET NULL');

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();

    // Indexes
    table.index('client_id');
    table.index('visit_id');
    table.index('caregiver_id');
    table.index('overall_rating');
    table.index('flagged_for_review');
    table.index('rated_at');

    // Unique constraint: one rating per visit
    table.unique(['client_id', 'visit_id']);
  });

  // ============================================================================
  // Schedule Change Requests
  // ============================================================================

  /**
   * Client-initiated requests to change visit schedules
   * Workflow: Client requests → Coordinator reviews → Approve/Deny
   */
  await knex.schema.createTable('client_schedule_change_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable()
      .references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('visit_id').nullable()
      .references('id').inTable('visits').onDelete('SET NULL');
    table.uuid('organization_id').notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('branch_id').notNullable()
      .references('id').inTable('branches').onDelete('CASCADE');

    // Request type
    table.enum('request_type', [
      'RESCHEDULE',  // Change date/time
      'CANCEL',      // Cancel a visit
      'ADD',         // Add a new visit
      'RECURRING',   // Change recurring pattern
    ]).notNullable();

    // Current visit details (for RESCHEDULE/CANCEL)
    table.timestamp('current_start_time').nullable();
    table.timestamp('current_end_time').nullable();

    // Requested changes
    table.timestamp('requested_start_time').nullable();
    table.timestamp('requested_end_time').nullable();
    table.text('requested_reason').notNullable();
    table.integer('priority').notNullable().defaultTo(1)
      .checkBetween([1, 5]); // 1 = low, 5 = urgent

    // Status
    table.enum('status', [
      'PENDING',     // Awaiting coordinator review
      'APPROVED',    // Approved and scheduled
      'DENIED',      // Request denied
      'CANCELLED',   // Client cancelled request
    ]).notNullable().defaultTo('PENDING');

    // Coordinator response
    table.uuid('reviewed_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('reviewed_at').nullable();
    table.text('review_notes').nullable();
    table.text('denial_reason').nullable();

    // Resulting action
    table.uuid('new_visit_id').nullable()
      .references('id').inTable('visits').onDelete('SET NULL');
    table.boolean('change_applied').notNullable().defaultTo(false);
    table.timestamp('applied_at').nullable();

    // Notification tracking
    table.boolean('client_notified').notNullable().defaultTo(false);
    table.timestamp('client_notified_at').nullable();

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();

    // Indexes
    table.index('client_id');
    table.index('visit_id');
    table.index('status');
    table.index(['status', 'created_at']);
    table.index('request_type');
  });

  // ============================================================================
  // Video Call Sessions
  // ============================================================================

  /**
   * Video call session metadata for client-coordinator communication
   * Integration with video platforms (Zoom, Twilio, etc.) tracked here
   */
  await knex.schema.createTable('client_video_call_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable()
      .references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('coordinator_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('branch_id').notNullable()
      .references('id').inTable('branches').onDelete('CASCADE');

    // Session details
    table.enum('call_type', [
      'SCHEDULED',     // Pre-scheduled call
      'ON_DEMAND',     // Immediate call request
      'SUPPORT',       // Technical support call
    ]).notNullable();

    table.enum('status', [
      'SCHEDULED',     // Scheduled but not started
      'ACTIVE',        // Call in progress
      'COMPLETED',     // Successfully completed
      'CANCELLED',     // Cancelled before starting
      'NO_SHOW',       // Scheduled but not joined
      'FAILED',        // Technical failure
    ]).notNullable().defaultTo('SCHEDULED');

    // Scheduling
    table.timestamp('scheduled_start').nullable();
    table.timestamp('scheduled_end').nullable();

    // Actual timing
    table.timestamp('actual_start').nullable();
    table.timestamp('actual_end').nullable();
    table.integer('duration_minutes').nullable();

    // Platform integration
    table.string('platform', 50).nullable(); // 'ZOOM', 'TWILIO', 'JITSI', etc.
    table.string('external_session_id', 255).nullable();
    table.string('client_join_url', 500).nullable();
    table.string('coordinator_join_url', 500).nullable();
    table.text('platform_metadata').nullable(); // JSON metadata

    // Purpose and notes
    table.text('call_purpose').nullable();
    table.text('coordinator_notes').nullable();
    table.text('client_notes').nullable();

    // Quality metrics
    table.integer('client_rating').nullable()
      .checkBetween([1, 5]);
    table.text('client_feedback').nullable();
    table.jsonb('quality_metrics').nullable();
    // Example: { audioQuality: 4, videoQuality: 5, connectionStable: true }

    // Accessibility
    table.boolean('captions_enabled').notNullable().defaultTo(false);
    table.boolean('sign_language_interpreter').notNullable().defaultTo(false);
    table.string('language_preference', 10).nullable();

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();

    // Indexes
    table.index('client_id');
    table.index('coordinator_id');
    table.index('status');
    table.index('scheduled_start');
    table.index(['client_id', 'status', 'scheduled_start']);
  });

  // ============================================================================
  // Care Plan Access Logs
  // ============================================================================

  /**
   * Audit trail for client access to care plans
   * Tracks when clients view their care plans (compliance and analytics)
   */
  await knex.schema.createTable('client_care_plan_access_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable()
      .references('id').inTable('clients').onDelete('CASCADE');
    table.uuid('care_plan_id').notNullable()
      .references('id').inTable('care_plans').onDelete('CASCADE');
    table.uuid('organization_id').notNullable()
      .references('id').inTable('organizations').onDelete('CASCADE');

    // Access details
    table.timestamp('accessed_at').notNullable().defaultTo(knex.fn.now());
    table.string('access_type', 50).notNullable(); // 'VIEW', 'DOWNLOAD', 'PRINT'
    table.string('client_ip', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.string('device_type', 50).nullable(); // 'DESKTOP', 'MOBILE', 'TABLET'

    // Session context
    table.uuid('portal_session_id').nullable();
    table.integer('time_spent_seconds').nullable();
    table.boolean('fully_read').notNullable().defaultTo(false);

    // Accessibility features used
    table.jsonb('accessibility_features').nullable();
    // Example: { textToSpeech: true, largeFont: true, highContrast: false }

    // Indexes
    table.index('client_id');
    table.index('care_plan_id');
    table.index('accessed_at');
    table.index(['client_id', 'accessed_at']);
  });

  // ============================================================================
  // Client Portal Sessions
  // ============================================================================

  /**
   * Active portal sessions for security and analytics
   * Tracks user sessions for security monitoring and concurrent login prevention
   */
  await knex.schema.createTable('client_portal_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_portal_access_id').notNullable()
      .references('id').inTable('client_portal_access').onDelete('CASCADE');
    table.uuid('client_id').notNullable()
      .references('id').inTable('clients').onDelete('CASCADE');

    // Session details
    table.string('session_token', 255).unique().notNullable();
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.timestamp('last_activity_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('ended_at').nullable();

    // Device/location
    table.string('ip_address', 45).notNullable();
    table.string('user_agent', 500).nullable();
    table.string('device_type', 50).nullable();
    table.jsonb('device_info').nullable();

    // Status
    table.enum('status', [
      'ACTIVE',
      'EXPIRED',
      'TERMINATED',
      'LOGGED_OUT',
    ]).notNullable().defaultTo('ACTIVE');

    // Indexes
    table.index('session_token');
    table.index('client_id');
    table.index(['client_id', 'status']);
    table.index('expires_at');
  });

  // ============================================================================
  // Client Preferences
  // ============================================================================

  /**
   * Client portal preferences and settings
   * Stores user preferences for portal customization and UX
   */
  await knex.schema.createTable('client_portal_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable().unique()
      .references('id').inTable('clients').onDelete('CASCADE');

    // Display preferences
    table.string('theme', 20).notNullable().defaultTo('LIGHT'); // LIGHT, DARK, HIGH_CONTRAST
    table.string('font_size', 20).notNullable().defaultTo('MEDIUM'); // SMALL, MEDIUM, LARGE, X_LARGE
    table.boolean('animations_enabled').notNullable().defaultTo(true);
    table.string('language', 10).notNullable().defaultTo('en');

    // Accessibility
    table.boolean('screen_reader_mode').notNullable().defaultTo(false);
    table.boolean('keyboard_navigation_only').notNullable().defaultTo(false);
    table.boolean('reduced_motion').notNullable().defaultTo(false);
    table.boolean('voice_control_enabled').notNullable().defaultTo(false);

    // Notification settings
    table.boolean('email_notifications').notNullable().defaultTo(true);
    table.boolean('sms_notifications').notNullable().defaultTo(false);
    table.boolean('push_notifications').notNullable().defaultTo(true);
    table.jsonb('notification_schedule').nullable();
    // Example: { quietHoursStart: '22:00', quietHoursEnd: '08:00', timezone: 'America/New_York' }

    // Dashboard customization
    table.jsonb('dashboard_layout').nullable();
    table.jsonb('widget_preferences').nullable();

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Index
    table.index('client_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('client_portal_preferences');
  await knex.schema.dropTableIfExists('client_portal_sessions');
  await knex.schema.dropTableIfExists('client_care_plan_access_logs');
  await knex.schema.dropTableIfExists('client_video_call_sessions');
  await knex.schema.dropTableIfExists('client_schedule_change_requests');
  await knex.schema.dropTableIfExists('client_visit_ratings');
  await knex.schema.dropTableIfExists('client_portal_access');
}
