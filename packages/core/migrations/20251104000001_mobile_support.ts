import type { Knex } from 'knex';

/**
 * Mobile Support Migration
 * 
 * Adds database tables and fields to support mobile app functionality:
 * - Mobile device registration and tracking
 * - Push notification tokens
 * - Offline sync metadata
 * - Mobile-specific user preferences
 */
export async function up(knex: Knex): Promise<void> {
  // Mobile devices table
  await knex.schema.createTable('mobile_devices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    // Device identification
    table.string('device_id', 255).notNullable().unique(); // Unique device identifier
    table.string('device_name', 255); // User-friendly device name
    table.string('device_type', 50).notNullable(); // iOS, Android
    table.string('os_version', 50);
    table.string('app_version', 50).notNullable();
    
    // Device info
    table.string('manufacturer', 100);
    table.string('model', 100);
    table.jsonb('device_capabilities'); // Camera, GPS, biometric, etc.
    
    // Push notifications
    table.string('push_token', 500); // FCM or APNs token
    table.string('push_provider', 50); // 'FCM' or 'APNs'
    table.boolean('push_enabled').defaultTo(true);
    table.timestamp('push_token_updated_at');
    
    // Registration & status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.timestamp('registered_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_seen_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_sync_at');
    
    // Security
    table.boolean('is_trusted').defaultTo(false);
    table.timestamp('trusted_at');
    table.uuid('trusted_by');
    table.jsonb('security_flags'); // Jailbreak detection, etc.
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    
    // Constraints
    table.check(`device_type IN ('iOS', 'Android')`);
    table.check(`status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')`);
    table.check(`push_provider IN ('FCM', 'APNs', NULL)`);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('trusted_by').references('id').inTable('users');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for mobile_devices
  await knex.raw('CREATE INDEX idx_mobile_devices_user ON mobile_devices(user_id, status)');
  await knex.raw('CREATE INDEX idx_mobile_devices_organization ON mobile_devices(organization_id)');
  await knex.raw('CREATE INDEX idx_mobile_devices_device_id ON mobile_devices(device_id) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_mobile_devices_push_token ON mobile_devices(push_token) WHERE push_enabled = true AND status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_mobile_devices_last_seen ON mobile_devices(last_seen_at DESC) WHERE status = \'ACTIVE\'');

  // Sync metadata table
  await knex.schema.createTable('sync_metadata', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('device_id').notNullable();
    table.uuid('user_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    // Sync tracking
    table.string('entity_type', 100).notNullable(); // visits, tasks, clients, etc.
    table.uuid('entity_id').notNullable();
    table.string('operation', 50).notNullable(); // CREATE, UPDATE, DELETE
    table.timestamp('client_timestamp').notNullable(); // When change happened on device
    table.timestamp('server_timestamp').notNullable().defaultTo(knex.fn.now());
    
    // Change tracking
    table.jsonb('change_data'); // The actual change payload
    table.string('change_hash', 64); // SHA-256 hash for conflict detection
    
    // Sync status
    table.string('sync_status', 50).notNullable().defaultTo('PENDING');
    table.jsonb('conflict_data'); // If conflicts occurred
    table.text('sync_error');
    table.integer('retry_count').defaultTo(0);
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    
    // Constraints
    table.check(`operation IN ('CREATE', 'UPDATE', 'DELETE')`);
    table.check(`sync_status IN ('PENDING', 'SYNCED', 'CONFLICT', 'ERROR', 'IGNORED')`);
    table.check(`retry_count >= 0 AND retry_count <= 10`);
    
    // Foreign keys
    table.foreign('device_id').references('id').inTable('mobile_devices').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for sync_metadata
  await knex.raw('CREATE INDEX idx_sync_device ON sync_metadata(device_id, client_timestamp DESC)');
  await knex.raw('CREATE INDEX idx_sync_user ON sync_metadata(user_id, entity_type, client_timestamp DESC)');
  await knex.raw('CREATE INDEX idx_sync_entity ON sync_metadata(entity_type, entity_id, server_timestamp DESC)');
  await knex.raw('CREATE INDEX idx_sync_pending ON sync_metadata(organization_id, sync_status, client_timestamp) WHERE sync_status = \'PENDING\'');
  await knex.raw('CREATE INDEX idx_sync_conflicts ON sync_metadata(organization_id, entity_type) WHERE sync_status = \'CONFLICT\'');

  // Push notifications table
  await knex.schema.createTable('push_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('device_id');
    table.uuid('user_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    // Notification details
    table.string('notification_type', 100).notNullable(); // VISIT_REMINDER, TASK_ASSIGNED, etc.
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.jsonb('data'); // Additional payload data
    
    // Targeting
    table.string('priority', 50).notNullable().defaultTo('NORMAL');
    table.timestamp('scheduled_for');
    
    // Delivery tracking
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('read_at');
    table.string('provider_message_id', 255);
    table.text('delivery_error');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    
    // Constraints
    table.check(`priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')`);
    table.check(`status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED')`);
    table.check(`notification_type IN (
      'VISIT_REMINDER', 'VISIT_STARTED', 'VISIT_CANCELLED',
      'TASK_ASSIGNED', 'TASK_DUE', 'TASK_COMPLETED',
      'SCHEDULE_UPDATED', 'MESSAGE_RECEIVED',
      'SYSTEM_ALERT', 'COMPLIANCE_WARNING'
    )`);
    
    // Foreign keys
    table.foreign('device_id').references('id').inTable('mobile_devices').onDelete('SET NULL');
    table.foreign('user_id').references('id').inTable('users');
    table.foreign('organization_id').references('id').inTable('organizations');
    table.foreign('created_by').references('id').inTable('users');
    table.foreign('updated_by').references('id').inTable('users');
  });

  // Indexes for push_notifications
  await knex.raw('CREATE INDEX idx_push_device ON push_notifications(device_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_push_user ON push_notifications(user_id, status, created_at DESC)');
  await knex.raw('CREATE INDEX idx_push_pending ON push_notifications(status, scheduled_for) WHERE status = \'PENDING\'');
  await knex.raw('CREATE INDEX idx_push_type ON push_notifications(notification_type, organization_id, created_at DESC)');

  // Triggers for updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_mobile_devices_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_mobile_devices_updated_at
      BEFORE UPDATE ON mobile_devices
      FOR EACH ROW
      EXECUTE FUNCTION update_mobile_devices_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_sync_metadata_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_sync_metadata_updated_at
      BEFORE UPDATE ON sync_metadata
      FOR EACH ROW
      EXECUTE FUNCTION update_sync_metadata_updated_at()
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_push_notifications_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      NEW.version = OLD.version + 1;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_push_notifications_updated_at
      BEFORE UPDATE ON push_notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_push_notifications_updated_at()
  `);

  // Add mobile-specific fields to existing tables
  await knex.schema.alterTable('users', (table) => {
    table.jsonb('mobile_preferences').defaultTo('{}'); // App settings, notifications, etc.
    table.boolean('mobile_access_enabled').defaultTo(true);
    table.timestamp('last_mobile_login');
  });

  await knex.schema.alterTable('visits', (table) => {
    table.uuid('mobile_device_id'); // Track which device was used
    table.foreign('mobile_device_id').references('id').inTable('mobile_devices').onDelete('SET NULL');
  });

  await knex.raw('CREATE INDEX idx_visits_mobile_device ON visits(mobile_device_id) WHERE mobile_device_id IS NOT NULL');

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE mobile_devices IS 'Registered mobile devices for field staff app access'");
  await knex.raw("COMMENT ON TABLE sync_metadata IS 'Offline sync tracking for mobile device data changes'");
  await knex.raw("COMMENT ON TABLE push_notifications IS 'Push notification delivery tracking'");
  
  await knex.raw("COMMENT ON COLUMN mobile_devices.device_id IS 'Unique device identifier (UUID generated by app)'");
  await knex.raw("COMMENT ON COLUMN mobile_devices.push_token IS 'FCM or APNs push notification token'");
  await knex.raw("COMMENT ON COLUMN mobile_devices.security_flags IS 'JSONB: Jailbreak detection, root access, etc.'");
  await knex.raw("COMMENT ON COLUMN sync_metadata.change_hash IS 'SHA-256 hash for conflict detection during sync'");
  await knex.raw("COMMENT ON COLUMN sync_metadata.conflict_data IS 'JSONB: Details if sync conflict occurred'");
}

export async function down(knex: Knex): Promise<void> {
  // Remove added columns from existing tables
  await knex.schema.alterTable('visits', (table) => {
    table.dropForeign(['mobile_device_id']);
    table.dropColumn('mobile_device_id');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('mobile_preferences');
    table.dropColumn('mobile_access_enabled');
    table.dropColumn('last_mobile_login');
  });

  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS trigger_push_notifications_updated_at ON push_notifications');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_sync_metadata_updated_at ON sync_metadata');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_mobile_devices_updated_at ON mobile_devices');
  
  await knex.raw('DROP FUNCTION IF EXISTS update_push_notifications_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_sync_metadata_updated_at()');
  await knex.raw('DROP FUNCTION IF EXISTS update_mobile_devices_updated_at()');

  // Drop tables
  await knex.schema.dropTableIfExists('push_notifications');
  await knex.schema.dropTableIfExists('sync_metadata');
  await knex.schema.dropTableIfExists('mobile_devices');
}
