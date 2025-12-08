import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create webhooks table for webhook configurations
  await knex.schema.createTable('webhooks', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization reference
    table
      .uuid('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');

    // Webhook configuration
    table.string('name', 100).notNullable();
    table.text('url').notNullable();
    table.text('secret').notNullable(); // HMAC signing secret
    table.jsonb('events').notNullable(); // Array of event types to subscribe to
    table.text('description');
    table.jsonb('headers'); // Custom headers to include with webhook requests

    // Status
    table
      .enum('status', ['active', 'inactive', 'suspended'], {
        useNative: true,
        enumName: 'webhook_status',
      })
      .notNullable()
      .defaultTo('active');

    // Retry policy
    table.jsonb('retry_policy').notNullable().defaultTo(
      JSON.stringify({
        maxRetries: 3,
        retryDelayMs: 5000,
        exponentialBackoff: true,
      })
    );

    // Statistics
    table.integer('success_count').notNullable().defaultTo(0);
    table.integer('failure_count').notNullable().defaultTo(0);
    table.timestamp('last_triggered_at');

    // Soft delete
    table.boolean('is_deleted').notNullable().defaultTo(false);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Create webhook_deliveries table for delivery tracking
  await knex.schema.createTable('webhook_deliveries', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Webhook reference
    table
      .uuid('webhook_id')
      .notNullable()
      .references('id')
      .inTable('webhooks')
      .onDelete('CASCADE');

    // Event information
    table.string('event_type', 100).notNullable();
    table.uuid('event_id').notNullable(); // Unique ID for the event
    table.jsonb('payload').notNullable(); // The webhook payload

    // Delivery status
    table
      .enum('status', ['pending', 'delivered', 'failed', 'retrying'], {
        useNative: true,
        enumName: 'webhook_delivery_status',
      })
      .notNullable()
      .defaultTo('pending');

    // Retry tracking
    table.integer('attempts').notNullable().defaultTo(0);
    table.timestamp('last_attempt_at');
    table.timestamp('next_retry_at');

    // Response information
    table.integer('response_status');
    table.text('response_body');
    table.integer('response_time_ms');
    table.text('error_message');

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('delivered_at');
  });

  // Indexes for performance
  await knex.raw(
    'CREATE INDEX idx_webhooks_org_id ON webhooks(organization_id) WHERE is_deleted = false'
  );
  await knex.raw(
    'CREATE INDEX idx_webhooks_status ON webhooks(status) WHERE is_deleted = false'
  );
  await knex.raw(
    'CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id)'
  );
  await knex.raw(
    'CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status)'
  );
  await knex.raw(
    'CREATE INDEX idx_webhook_deliveries_event_id ON webhook_deliveries(event_id)'
  );
  await knex.raw(
    'CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = \'retrying\''
  );
  await knex.raw(
    'CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC)'
  );

  // GIN index for events array search
  await knex.raw(
    'CREATE INDEX idx_webhooks_events ON webhooks USING GIN (events)'
  );

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_webhooks_updated_at
      BEFORE UPDATE ON webhooks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments for documentation
  await knex.raw(
    "COMMENT ON TABLE webhooks IS 'Webhook configurations for external integrations'"
  );
  await knex.raw(
    "COMMENT ON COLUMN webhooks.secret IS 'HMAC secret for signing webhook payloads'"
  );
  await knex.raw(
    "COMMENT ON COLUMN webhooks.events IS 'JSON array of event types this webhook subscribes to'"
  );
  await knex.raw(
    "COMMENT ON TABLE webhook_deliveries IS 'Delivery history and status for webhook events'"
  );
  await knex.raw(
    "COMMENT ON COLUMN webhook_deliveries.event_id IS 'Unique identifier for the triggering event'"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks'
  );
  await knex.schema.dropTableIfExists('webhook_deliveries');
  await knex.schema.dropTableIfExists('webhooks');
  await knex.raw('DROP TYPE IF EXISTS webhook_delivery_status');
  await knex.raw('DROP TYPE IF EXISTS webhook_status');
}
