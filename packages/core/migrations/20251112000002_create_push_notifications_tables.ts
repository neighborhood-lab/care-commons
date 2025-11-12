/**
 * Migration: Create Push Notifications Tables
 * 
 * Creates tables for push notification infrastructure:
 * - push_tokens: Store device tokens for push delivery
 * - push_notification_deliveries: Track notification delivery status
 * 
 * This enables real-time alerts for caregivers (visit reminders, schedule changes, urgent alerts).
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create push_tokens table
  await knex.schema.createTable('push_tokens', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign keys
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Device information
    table.string('device_token', 255).notNullable().unique();
    table.enum('device_type', ['ios', 'android']).notNullable();
    table.string('device_name', 100).nullable();
    
    // Status tracking
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_used_at').notNullable().defaultTo(knex.fn.now());
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('user_id'); // Get tokens for user
    table.index(['user_id', 'is_active']); // Get active tokens for user
    table.index('device_token'); // Lookup by token
  });

  // Create push_notification_deliveries table
  await knex.schema.createTable('push_notification_deliveries', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign keys
    table.uuid('notification_id').notNullable().references('id').inTable('notifications').onDelete('CASCADE');
    table.uuid('push_token_id').notNullable().references('id').inTable('push_tokens').onDelete('CASCADE');
    
    // Expo push notification tracking
    table.string('expo_ticket_id', 255).nullable(); // Tracking ID from Expo
    table.enum('status', ['queued', 'sent', 'delivered', 'failed', 'error']).notNullable().defaultTo('queued');
    table.text('error_message').nullable();
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('notification_id'); // Get deliveries for a notification
    table.index('push_token_id'); // Get deliveries for a token
    table.index(['status', 'created_at']); // Query failed/pending deliveries
    table.index('expo_ticket_id'); // Lookup by Expo ticket
  });

  // Create updated_at trigger for push_tokens
  await knex.raw(`
    CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create updated_at trigger for push_notification_deliveries
  await knex.raw(`
    CREATE TRIGGER update_push_notification_deliveries_updated_at
    BEFORE UPDATE ON push_notification_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add table comments for HIPAA compliance audit trail
  await knex.raw(`
    COMMENT ON TABLE push_tokens IS 'Stores device tokens for push notifications (HIPAA: audit trail of notification delivery capability)';
    COMMENT ON TABLE push_notification_deliveries IS 'Tracks push notification delivery status for audit trail (HIPAA: proof of notification attempts)';
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS update_push_notification_deliveries_updated_at ON push_notification_deliveries');
  await knex.raw('DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens');
  
  // Drop tables in reverse order (respecting foreign keys)
  await knex.schema.dropTableIfExists('push_notification_deliveries');
  await knex.schema.dropTableIfExists('push_tokens');
}
