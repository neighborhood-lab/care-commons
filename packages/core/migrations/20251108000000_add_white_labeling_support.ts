import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create organization_branding table for white-label customization
  await knex.schema.createTable('organization_branding', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization reference (one-to-one)
    table.uuid('organization_id').notNullable().unique().references('id').inTable('organizations');

    // Brand identity
    table.string('logo_url', 500);
    table.string('favicon_url', 500);
    table.string('primary_color', 7).defaultTo('#3b82f6'); // Hex color
    table.string('secondary_color', 7).defaultTo('#10b981');
    table.string('accent_color', 7).defaultTo('#8b5cf6');
    table.string('brand_name', 200);
    table.text('tagline');

    // Custom domain
    table.string('custom_domain', 255);
    table.boolean('domain_verified').defaultTo(false);
    table.timestamp('domain_verified_at');

    // Email branding
    table.string('email_from_name', 200);
    table.string('email_from_address', 255);
    table.string('email_reply_to', 255);
    table.string('email_header_color', 7).defaultTo('#3b82f6');
    table.text('email_footer_text');

    // Legal
    table.text('terms_of_service_url');
    table.text('privacy_policy_url');
    table.text('custom_terms_content'); // Rich text/HTML

    // Feature flags (JSONB for flexibility)
    table.jsonb('feature_flags').defaultTo('{}');

    // Additional customization
    table.jsonb('theme_overrides').defaultTo('{}'); // CSS variables, fonts, etc.
    table.jsonb('settings').defaultTo('{}'); // Any other org-specific settings

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');

    // Soft delete
    table.timestamp('deleted_at');
    table.uuid('deleted_by').references('id').inTable('users');
  });

  // Create email_templates table for customizable notifications
  await knex.schema.createTable('email_templates', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization reference (null = system default template)
    table.uuid('organization_id').references('id').inTable('organizations');

    // Template identification
    table.string('template_key', 100).notNullable(); // e.g., 'WELCOME_EMAIL', 'VISIT_REMINDER'
    table.string('name', 200).notNullable();
    table.text('description');

    // Template content
    table.string('subject', 500).notNullable();
    table.text('html_body').notNullable(); // HTML with placeholders {{firstName}}
    table.text('text_body'); // Plain text fallback

    // Template metadata
    table.specificType('available_variables', 'TEXT[]').defaultTo('{}'); // List of {{var}} available
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_system_template').defaultTo(false); // Can't be deleted

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');

    // Soft delete
    table.timestamp('deleted_at');
    table.uuid('deleted_by').references('id').inTable('users');

    // Unique constraint: one template per key per organization
    table.unique(['organization_id', 'template_key', 'deleted_at']);
  });

  // Create organization_subscriptions table for billing
  await knex.schema.createTable('organization_subscriptions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization reference
    table.uuid('organization_id').notNullable().unique().references('id').inTable('organizations');

    // Subscription details
    table.string('plan_tier', 50).notNullable().defaultTo('FREE'); // FREE, BASIC, PROFESSIONAL, ENTERPRISE
    table.string('billing_cycle', 50).defaultTo('MONTHLY'); // MONTHLY, ANNUAL
    table.decimal('monthly_price', 10, 2).defaultTo(0);
    table.string('currency', 3).defaultTo('USD');

    // Limits
    table.integer('max_users').defaultTo(5);
    table.integer('max_clients').defaultTo(50);
    table.integer('max_caregivers').defaultTo(25);
    table.boolean('white_labeling_enabled').defaultTo(false);
    table.boolean('custom_domain_enabled').defaultTo(false);
    table.boolean('api_access_enabled').defaultTo(false);

    // Subscription lifecycle
    table.string('status', 50).notNullable().defaultTo('ACTIVE'); // ACTIVE, SUSPENDED, CANCELLED, TRIAL
    table.timestamp('trial_ends_at');
    table.timestamp('current_period_start').notNullable().defaultTo(knex.fn.now());
    table.timestamp('current_period_end');
    table.timestamp('cancelled_at');
    table.string('cancellation_reason', 500);

    // Payment integration
    table.string('stripe_customer_id', 255);
    table.string('stripe_subscription_id', 255);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');

    // Constraints
    table.check(`plan_tier IN ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM')`);
    table.check(`billing_cycle IN ('MONTHLY', 'ANNUAL')`);
    table.check(`status IN ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED', 'EXPIRED')`);
  });

  // Create organization_usage_metrics table for tracking
  await knex.schema.createTable('organization_usage_metrics', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization and period
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');
    table.date('metric_date').notNullable(); // Daily metrics

    // User metrics
    table.integer('active_users').defaultTo(0);
    table.integer('total_users').defaultTo(0);
    table.integer('new_users').defaultTo(0);

    // Client/Caregiver metrics
    table.integer('active_clients').defaultTo(0);
    table.integer('active_caregivers').defaultTo(0);
    table.integer('total_clients').defaultTo(0);
    table.integer('total_caregivers').defaultTo(0);

    // Activity metrics
    table.integer('visits_scheduled').defaultTo(0);
    table.integer('visits_completed').defaultTo(0);
    table.integer('evv_records_created').defaultTo(0);
    table.integer('invoices_generated').defaultTo(0);
    table.decimal('total_billable_hours', 10, 2).defaultTo(0);
    table.decimal('total_revenue', 12, 2).defaultTo(0);

    // API usage (if applicable)
    table.integer('api_calls').defaultTo(0);
    table.integer('storage_mb').defaultTo(0);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Unique constraint: one record per org per date
    table.unique(['organization_id', 'metric_date']);
  });

  // Add indexes for performance
  await knex.raw('CREATE INDEX idx_org_branding_org_id ON organization_branding(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_org_branding_domain ON organization_branding(custom_domain) WHERE custom_domain IS NOT NULL AND deleted_at IS NULL');

  await knex.raw('CREATE INDEX idx_email_templates_org ON email_templates(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_email_templates_key ON email_templates(template_key, organization_id) WHERE is_active = true AND deleted_at IS NULL');

  await knex.raw('CREATE INDEX idx_org_subscriptions_org ON organization_subscriptions(organization_id)');
  await knex.raw('CREATE INDEX idx_org_subscriptions_status ON organization_subscriptions(status)');
  await knex.raw('CREATE INDEX idx_org_subscriptions_stripe ON organization_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL');

  await knex.raw('CREATE INDEX idx_usage_metrics_org_date ON organization_usage_metrics(organization_id, metric_date DESC)');
  await knex.raw('CREATE INDEX idx_usage_metrics_date ON organization_usage_metrics(metric_date DESC)');

  // Triggers for updated_at
  await knex.raw(`
    CREATE TRIGGER update_organization_branding_updated_at
      BEFORE UPDATE ON organization_branding
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_email_templates_updated_at
      BEFORE UPDATE ON email_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_organization_subscriptions_updated_at
      BEFORE UPDATE ON organization_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_organization_usage_metrics_updated_at
      BEFORE UPDATE ON organization_usage_metrics
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE organization_branding IS 'White-label branding configuration per organization'");
  await knex.raw("COMMENT ON TABLE email_templates IS 'Customizable email templates with organization-specific overrides'");
  await knex.raw("COMMENT ON TABLE organization_subscriptions IS 'Subscription plans and billing information'");
  await knex.raw("COMMENT ON TABLE organization_usage_metrics IS 'Daily usage metrics for billing and analytics'");
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS update_organization_branding_updated_at ON organization_branding');
  await knex.raw('DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates');
  await knex.raw('DROP TRIGGER IF EXISTS update_organization_subscriptions_updated_at ON organization_subscriptions');
  await knex.raw('DROP TRIGGER IF EXISTS update_organization_usage_metrics_updated_at ON organization_usage_metrics');

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('organization_usage_metrics');
  await knex.schema.dropTableIfExists('organization_subscriptions');
  await knex.schema.dropTableIfExists('email_templates');
  await knex.schema.dropTableIfExists('organization_branding');
}
