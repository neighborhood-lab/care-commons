import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add OAuth and security fields to users table
  await knex.schema.alterTable('users', (table) => {
    // OAuth provider fields
    table.string('oauth_provider', 50); // 'GOOGLE', 'MICROSOFT', etc.
    table.string('oauth_provider_id', 255); // Provider's unique user ID
    table.string('oauth_email_verified', 10); // 'true' or 'false' as string
    table.string('oauth_picture_url', 500); // Profile picture URL
    table.string('oauth_locale', 10); // User locale from OAuth
    table.timestamp('oauth_last_verified_at'); // When OAuth was last verified

    // Security enhancements
    table.integer('token_version').notNullable().defaultTo(1); // For token invalidation
    table.string('password_hash', 255).nullable().alter(); // Make nullable (OAuth users may not have password)
    table.timestamp('last_password_change_at'); // Track password changes
    table.integer('failed_login_attempts').notNullable().defaultTo(0).alter(); // Ensure not null
    
    // Rate limiting for login attempts
    table.timestamp('last_failed_login_at');
    table.string('last_login_ip', 45); // IPv4 or IPv6
    table.text('last_login_user_agent');
  });

  // Create indexes for performance
  await knex.raw('CREATE INDEX idx_users_oauth_provider ON users(oauth_provider, oauth_provider_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_users_token_version ON users(id, token_version) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_users_failed_logins ON users(failed_login_attempts) WHERE failed_login_attempts > 0 AND deleted_at IS NULL');

  // Create auth_events table for HIPAA-compliant audit logging
  const authEventsExists = await knex.schema.hasTable('auth_events');
  if (!authEventsExists) {
    await knex.schema.createTable('auth_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE'); // Nullable for failed logins
    table.string('event_type', 50).notNullable(); // 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', etc.
    table.string('auth_method', 50).notNullable(); // 'PASSWORD', 'GOOGLE_OAUTH', etc.
    table.string('email', 255); // Email attempted (for failed logins)
    table.string('ip_address', 45);
    table.text('user_agent');
    table.jsonb('metadata').defaultTo('{}'); // Additional context
    table.string('result', 20).notNullable(); // 'SUCCESS', 'FAILED', etc.
    table.text('failure_reason'); // Why auth failed
  });

    // Indexes for auth_events
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_auth_events_user ON auth_events(user_id, timestamp DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_auth_events_timestamp ON auth_events(timestamp DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_auth_events_type ON auth_events(event_type, timestamp DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_auth_events_email ON auth_events(email, timestamp DESC) WHERE result = \'FAILED\'');
  }

  // Create refresh_tokens table for secure token management
  const refreshTokensExists = await knex.schema.hasTable('refresh_tokens');
  if (!refreshTokensExists) {
    await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('token_hash').notNullable(); // Hashed refresh token
    table.integer('token_version').notNullable(); // Match user's token_version
    table.timestamp('issued_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.timestamp('revoked_at'); // When token was revoked
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('last_used_at'); // Track token usage
  });

    // Indexes for refresh_tokens
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked_at IS NULL');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked_at IS NULL');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL');
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop new tables
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('auth_events');

  // Remove indexes from users table
  await knex.raw('DROP INDEX IF EXISTS idx_users_oauth_provider');
  await knex.raw('DROP INDEX IF EXISTS idx_users_token_version');
  await knex.raw('DROP INDEX IF EXISTS idx_users_failed_logins');

  // Remove new columns from users table
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('oauth_provider');
    table.dropColumn('oauth_provider_id');
    table.dropColumn('oauth_email_verified');
    table.dropColumn('oauth_picture_url');
    table.dropColumn('oauth_locale');
    table.dropColumn('oauth_last_verified_at');
    table.dropColumn('token_version');
    table.dropColumn('last_password_change_at');
    table.dropColumn('last_failed_login_at');
    table.dropColumn('last_login_ip');
    table.dropColumn('last_login_user_agent');
  });

  // Restore password_hash to NOT NULL
  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255).notNullable().alter();
  });
}
