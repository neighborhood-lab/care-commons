import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create invite_tokens table for email-based team member invitations
  await knex.schema.createTable('invite_tokens', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Token and organization
    table.string('token', 255).notNullable().unique();
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    
    // Invitee information
    table.string('email', 255).notNullable();
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.specificType('roles', 'VARCHAR(50)[]').notNullable().defaultTo('{}');
    table.specificType('branch_ids', 'UUID[]').defaultTo('{}');
    
    // Token metadata
    table.timestamp('expires_at').notNullable();
    table.string('status', 50).notNullable().defaultTo('PENDING');
    table.uuid('accepted_user_id').references('id').inTable('users');
    table.timestamp('accepted_at');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    
    // Constraints
    table.check(`status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')`);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_invite_tokens_token ON invite_tokens(token) WHERE status = \'PENDING\'');
  await knex.raw('CREATE INDEX idx_invite_tokens_organization ON invite_tokens(organization_id)');
  await knex.raw('CREATE INDEX idx_invite_tokens_email ON invite_tokens(email) WHERE status = \'PENDING\'');
  await knex.raw('CREATE INDEX idx_invite_tokens_status ON invite_tokens(status)');
  await knex.raw('CREATE INDEX idx_invite_tokens_expires_at ON invite_tokens(expires_at) WHERE status = \'PENDING\'');

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_invite_tokens_updated_at 
      BEFORE UPDATE ON invite_tokens
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE invite_tokens IS 'Email-based invitation tokens for team member registration'");
  await knex.raw("COMMENT ON COLUMN invite_tokens.token IS 'Unique cryptographically secure token for invitation link'");
  await knex.raw("COMMENT ON COLUMN invite_tokens.expires_at IS 'Token expiration timestamp (typically 7 days from creation)'");
  await knex.raw("COMMENT ON COLUMN invite_tokens.status IS 'Token lifecycle status: PENDING, ACCEPTED, EXPIRED, REVOKED'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_invite_tokens_updated_at ON invite_tokens');
  await knex.schema.dropTableIfExists('invite_tokens');
}
