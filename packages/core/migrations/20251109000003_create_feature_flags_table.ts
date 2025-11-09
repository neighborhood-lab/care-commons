import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create feature_flags table for per-organization feature control
  await knex.schema.createTable('feature_flags', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization reference (many features per organization)
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Feature identification
    table.string('feature_key', 100).notNullable(); // e.g., 'advanced_scheduling', 'mobile_app', 'family_portal'
    table.string('feature_name', 200).notNullable(); // Human-readable name
    table.text('description'); // Feature description

    // Feature status
    table.boolean('is_enabled').notNullable().defaultTo(false);
    table.timestamp('enabled_at');
    table.uuid('enabled_by').references('id').inTable('users');

    // Feature configuration
    table.jsonb('configuration'); // Feature-specific configuration options
    table.jsonb('limits'); // Usage limits (e.g., max users, max storage, max API calls)

    // Rollout control
    table.integer('rollout_percentage').defaultTo(100); // For gradual rollout (0-100)
    table.specificType('rollout_user_ids', 'UUID[]').defaultTo('{}'); // Specific users for beta testing
    table.specificType('rollout_branch_ids', 'UUID[]').defaultTo('{}'); // Specific branches

    // Billing integration
    table.string('billing_tier', 50); // e.g., 'FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'
    table.decimal('monthly_cost', 10, 2); // Additional monthly cost for this feature
    table.boolean('requires_upgrade').notNullable().defaultTo(false);

    // Dependencies
    table.specificType('depends_on', 'VARCHAR(100)[]').defaultTo('{}'); // Required feature keys
    table.specificType('conflicts_with', 'VARCHAR(100)[]').defaultTo('{}'); // Incompatible features

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.unique(['organization_id', 'feature_key']); // One feature per organization
    table.check('rollout_percentage >= 0 AND rollout_percentage <= 100');
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_feature_flags_org_id ON feature_flags(organization_id)');
  await knex.raw('CREATE INDEX idx_feature_flags_feature_key ON feature_flags(feature_key)');
  await knex.raw('CREATE INDEX idx_feature_flags_enabled ON feature_flags(organization_id, is_enabled) WHERE is_enabled = true');
  await knex.raw('CREATE INDEX idx_feature_flags_billing_tier ON feature_flags(billing_tier)');

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_feature_flags_updated_at
      BEFORE UPDATE ON feature_flags
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE feature_flags IS 'Per-organization feature flags for granular feature control'");
  await knex.raw("COMMENT ON COLUMN feature_flags.feature_key IS 'Unique identifier for the feature (e.g., advanced_scheduling)'");
  await knex.raw("COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users who see this feature (0-100) for gradual rollout'");
  await knex.raw("COMMENT ON COLUMN feature_flags.configuration IS 'JSON configuration specific to this feature'");
  await knex.raw("COMMENT ON COLUMN feature_flags.limits IS 'Usage limits for this feature (e.g., max API calls, max storage)'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags');
  await knex.schema.dropTableIfExists('feature_flags');
}
