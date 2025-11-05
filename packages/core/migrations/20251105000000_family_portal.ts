import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Family Members table
  await knex.schema.createTable('family_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.string('authorized_contact_id').notNullable(); // References JSONB array in clients

    // Account credentials
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();

    // Profile
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('relationship', 100).notNullable();
    table.string('phone', 20);

    // Access control
    table
      .string('status', 50)
      .notNullable()
      .defaultTo('INVITED')
      .checkIn(['INVITED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED']);
    table.specificType('permissions', 'VARCHAR(100)[]').notNullable().defaultTo('{}');
    table
      .string('access_level', 20)
      .notNullable()
      .defaultTo('STANDARD')
      .checkIn(['BASIC', 'STANDARD', 'FULL']);

    // Preferences
    table.jsonb('preferences').notNullable().defaultTo(
      JSON.stringify({
        language: 'en',
        timezone: 'America/New_York',
        theme: 'auto',
      })
    );
    table.jsonb('notification_settings').notNullable().defaultTo(
      JSON.stringify({
        email: {
          enabled: true,
          careUpdates: true,
          visitReminders: true,
          emergencyAlerts: true,
          chatMessages: false,
        },
        sms: { enabled: false, emergencyOnly: true },
        push: { enabled: false, careUpdates: false, chatMessages: false },
      })
    );

    // Security
    table.timestamp('last_login_at');
    table.timestamp('last_password_change_at');
    table.string('password_reset_token', 255);
    table.timestamp('password_reset_expires');

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.timestamp('deleted_at');

    // Constraints
    table.unique(['organization_id', 'email']);
    table.index(['client_id']);
    table.index(['email']);
    table.index(['status']);
  });

  // Family Invitations table
  await knex.schema.createTable('family_invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.string('authorized_contact_id').notNullable();

    // Invitation details
    table.string('email', 255).notNullable();
    table.string('token', 255).notNullable().unique();
    table.timestamp('expires_at').notNullable();

    // Status
    table
      .string('status', 50)
      .notNullable()
      .defaultTo('PENDING')
      .checkIn(['PENDING', 'SENT', 'ACCEPTED', 'EXPIRED', 'REVOKED']);
    table.timestamp('sent_at');
    table.timestamp('accepted_at');
    table.timestamp('revoked_at');

    // Proposed permissions
    table.specificType('proposed_permissions', 'VARCHAR(100)[]').notNullable().defaultTo('{}');
    table
      .string('proposed_access_level', 20)
      .notNullable()
      .defaultTo('STANDARD')
      .checkIn(['BASIC', 'STANDARD', 'FULL']);

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['email']);
    table.index(['token']);
    table.index(['status']);
    table.index(['expires_at']);
  });

  // Family Sessions table
  await knex.schema.createTable('family_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('family_member_id')
      .notNullable()
      .references('id')
      .inTable('family_members')
      .onDelete('CASCADE');

    // Session tokens
    table.string('token', 500).notNullable().unique();
    table.string('refresh_token', 500);

    // Session info
    table.string('ip_address', 50).notNullable();
    table.string('user_agent', 500);
    table.jsonb('device_info');

    // Timing
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.timestamp('last_activity_at').notNullable().defaultTo(knex.fn.now());

    // Status
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('revoked_at');
    table.string('revoked_reason', 255);

    // Indexes
    table.index(['family_member_id']);
    table.index(['token']);
    table.index(['is_active']);
    table.index(['expires_at']);
  });

  // Chat Conversations table
  await knex.schema.createTable('chat_conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('family_member_id')
      .notNullable()
      .references('id')
      .inTable('family_members')
      .onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Conversation details
    table.string('title', 200);
    table.text('summary');

    // Message tracking
    table.integer('message_count').notNullable().defaultTo(0);
    table.timestamp('last_message_at');

    // Status
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('archived_at');

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['family_member_id']);
    table.index(['client_id']);
    table.index(['is_active']);
    table.index(['created_at']);
  });

  // Chat Messages table
  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('conversation_id')
      .notNullable()
      .references('id')
      .inTable('chat_conversations')
      .onDelete('CASCADE');
    table
      .uuid('family_member_id')
      .notNullable()
      .references('id')
      .inTable('family_members')
      .onDelete('CASCADE');

    // Message content
    table.string('role', 20).notNullable().checkIn(['user', 'assistant', 'system']);
    table.text('content').notNullable();

    // Metadata
    table.integer('tokens');
    table.string('model', 100);

    // Context used
    table.jsonb('context_used');

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('edited_at');
    table.timestamp('deleted_at');

    // Indexes
    table.index(['conversation_id', 'created_at']);
    table.index(['family_member_id']);
    table.index(['role']);
  });

  // Family Notifications table
  await knex.schema.createTable('family_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('family_member_id')
      .notNullable()
      .references('id')
      .inTable('family_members')
      .onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients');

    // Notification details
    table.string('type', 50).notNullable();
    table.string('category', 50).notNullable();
    table.string('title', 200).notNullable();
    table.text('message').notNullable();

    // Priority and actions
    table
      .string('priority', 20)
      .notNullable()
      .defaultTo('MEDIUM')
      .checkIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
    table.boolean('action_required').notNullable().defaultTo(false);
    table.string('action_url', 500);
    table.string('action_label', 50);

    // Delivery channels
    table.specificType('channels', 'VARCHAR(20)[]').notNullable().defaultTo('{"IN_APP"}');

    // Status
    table
      .string('status', 20)
      .notNullable()
      .defaultTo('PENDING')
      .checkIn(['PENDING', 'SENT', 'READ', 'DISMISSED', 'FAILED']);
    table.timestamp('sent_at');
    table.timestamp('read_at');
    table.timestamp('dismissed_at');

    // Related entity
    table.jsonb('related_entity');

    // Audit
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at');

    // Indexes
    table.index(['family_member_id', 'status']);
    table.index(['client_id']);
    table.index(['type']);
    table.index(['category']);
    table.index(['priority']);
    table.index(['created_at']);
  });

  console.log('✅ Family Portal tables created successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order (respecting foreign keys)
  await knex.schema.dropTableIfExists('family_notifications');
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_conversations');
  await knex.schema.dropTableIfExists('family_sessions');
  await knex.schema.dropTableIfExists('family_invitations');
  await knex.schema.dropTableIfExists('family_members');

  console.log('✅ Family Portal tables dropped successfully');
}
