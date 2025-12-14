/**
 * Video Check-in Capability Migration
 *
 * Creates tables for optional video calls between families and patients
 * during visits, allowing remote family members to connect.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // Video Calls Table
  // ============================================================================
  await knex.schema.createTable('video_calls', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Call identification
    table.string('session_id', 255).notNullable().unique();

    // Context
    table.uuid('client_id').notNullable();
    table.uuid('visit_id');

    // Call details
    table.string('call_type', 30).notNullable();
    table.string('status', 20).notNullable().defaultTo('SCHEDULED');
    table.string('title', 255);

    // Scheduling
    table.timestamp('scheduled_start_time');
    table.timestamp('scheduled_end_time');
    table.timestamp('actual_start_time');
    table.timestamp('actual_end_time');
    table.integer('duration_minutes');

    // Recurrence
    table.boolean('is_recurring').notNullable().defaultTo(false);
    table.uuid('recurring_schedule_id');
    table.string('recurrence_rule', 500);

    // Host info
    table.uuid('host_user_id').notNullable();
    table.string('host_role', 20).notNullable();

    // Connection details
    table.string('room_url', 2000);
    table.string('join_code', 50);
    table.boolean('password_protected').notNullable().defaultTo(false);
    table.string('room_password', 100);

    // Technical info
    table.string('provider', 50).notNullable().defaultTo('daily');
    table.integer('max_participants').notNullable().defaultTo(10);
    table.boolean('recording_enabled').notNullable().defaultTo(false);
    table.string('recording_url', 2000);

    // Quality metrics
    table.string('quality_rating', 20);
    table.integer('average_latency');
    table.decimal('packet_loss', 5, 2);

    // Notes
    table.text('notes');
    table.text('family_visible_notes');

    // Organization context
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('client_id');
    table.index('visit_id');
    table.index(['status', 'organization_id']);
    table.index('host_user_id');
    table.index('scheduled_start_time');
    table.index('recurring_schedule_id');
    table.index('is_deleted');
  });

  // ============================================================================
  // Video Call Participants Table
  // ============================================================================
  await knex.schema.createTable('video_call_participants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('video_call_id').notNullable();
    table.uuid('user_id').notNullable();
    table.string('role', 20).notNullable();
    table.string('status', 20).notNullable().defaultTo('INVITED');

    // Family member link
    table.uuid('family_member_id');

    // Connection
    table.timestamp('invited_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('joined_at');
    table.timestamp('left_at');
    table.integer('connection_duration_seconds');

    // Device info
    table.string('device_type', 20);
    table.string('browser_type', 50);

    // Quality feedback
    table.string('quality_rating', 20);
    table.text('feedback_notes');

    // Technical issues
    table.boolean('had_technical_issues').notNullable().defaultTo(false);
    table.text('technical_issue_notes');

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('video_call_id');
    table.index('user_id');
    table.index(['video_call_id', 'user_id']);
    table.index('family_member_id');
    table.index('is_deleted');
  });

  // ============================================================================
  // Recurring Video Schedules Table
  // ============================================================================
  await knex.schema.createTable('recurring_video_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('client_id').notNullable();

    // Schedule details
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('recurrence_rule', 500).notNullable();
    table.integer('duration').notNullable();

    // Active dates
    table.date('start_date').notNullable();
    table.date('end_date');
    table.boolean('is_active').notNullable().defaultTo(true);

    // Default participants
    table.jsonb('default_participants').notNullable().defaultTo('[]');

    // Settings
    table.boolean('auto_create_session').notNullable().defaultTo(true);
    table.specificType('reminder_minutes_before', 'integer[]').defaultTo('{30,5}');
    table.integer('max_participants').notNullable().defaultTo(10);
    table.boolean('recording_enabled').notNullable().defaultTo(false);

    // Created by
    table.uuid('created_by_user_id').notNullable();

    // Organization context
    table.uuid('organization_id').notNullable();
    table.uuid('branch_id').notNullable();

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('client_id');
    table.index(['is_active', 'organization_id']);
    table.index('created_by_user_id');
    table.index('is_deleted');
  });

  // ============================================================================
  // Video Call Invitations Table
  // ============================================================================
  await knex.schema.createTable('video_call_invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('video_call_id').notNullable();
    table.uuid('participant_id').notNullable();

    // Recipient info
    table.uuid('recipient_user_id');
    table.string('recipient_email', 255).notNullable();
    table.string('recipient_phone', 50);
    table.string('recipient_name', 255).notNullable();

    // Invitation details
    table.string('invitation_type', 20).notNullable();
    table.timestamp('sent_at').notNullable();
    table.timestamp('opened_at');
    table.timestamp('responded_at');
    table.string('response', 20);

    // Join info
    table.string('join_url', 2000).notNullable();
    table.string('join_code', 50).notNullable();
    table.timestamp('expires_at').notNullable();

    // Reminders
    table.integer('reminders_sent').notNullable().defaultTo(0);
    table.timestamp('last_reminder_at');

    // Entity fields
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').notNullable().defaultTo(1);
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Indexes
    table.index('video_call_id');
    table.index('participant_id');
    table.index('recipient_user_id');
    table.index('recipient_email');
    table.index('is_deleted');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('video_call_invitations');
  await knex.schema.dropTableIfExists('recurring_video_schedules');
  await knex.schema.dropTableIfExists('video_call_participants');
  await knex.schema.dropTableIfExists('video_calls');
}
