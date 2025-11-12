import { Knex } from 'knex';

/**
 * Migration: Create security_events table
 *
 * Creates a table to track security events and incidents for monitoring and auditing
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('security_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Event details
    table.string('type', 100).notNullable().index();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable().index();

    // User context
    table.uuid('user_id').nullable().index();
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');

    // Request context
    table.string('ip_address', 45).notNullable(); // IPv6 max length
    table.text('user_agent').notNullable();

    // Additional details (JSONB for flexible storage)
    table.jsonb('details').notNullable().defaultTo('{}');

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).index();

    // Indexes for common queries
    table.index(['severity', 'created_at'], 'idx_security_events_severity_created_at');
    table.index(['user_id', 'created_at'], 'idx_security_events_user_created_at');
  });

  // Create an index on the details JSONB column for common queries
  await knex.raw(`
    CREATE INDEX idx_security_events_details_gin ON security_events USING gin (details);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('security_events');
}
