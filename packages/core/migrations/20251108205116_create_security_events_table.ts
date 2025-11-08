import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create security_events table for logging security-related events
  await knex.schema.createTable('security_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('type', 100).notNullable(); // e.g., 'failed_login', 'unauthorized_access', 'suspicious_activity'
    table.string('severity', 20).notNullable(); // 'low', 'medium', 'high', 'critical'
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('ip_address', 45).notNullable(); // IPv6 max length
    table.text('user_agent').notNullable();
    table.jsonb('details').defaultTo('{}'); // Additional event details
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // Create indexes for efficient querying
  await knex.raw('CREATE INDEX idx_security_events_type ON security_events(type)');
  await knex.raw('CREATE INDEX idx_security_events_severity ON security_events(severity)');
  await knex.raw('CREATE INDEX idx_security_events_user_id ON security_events(user_id) WHERE user_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_security_events_created_at ON security_events(created_at)');
  await knex.raw('CREATE INDEX idx_security_events_ip_address ON security_events(ip_address)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('security_events');
}
