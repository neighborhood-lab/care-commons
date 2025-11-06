import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('type', 50).notNullable(); // 'info', 'success', 'warning', 'error'
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.string('action_url', 500);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('read_at');
    table.timestamp('deleted_at');
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_notifications_user_org ON notifications(user_id, organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_notifications_is_read ON notifications(is_read, created_at DESC) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE deleted_at IS NULL AND is_read = false');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}
