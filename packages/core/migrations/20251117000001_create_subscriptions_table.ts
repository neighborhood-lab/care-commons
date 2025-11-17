import { type Knex } from 'knex';

/**
 * Migration: Create subscriptions and billing_usage tables for Stripe integration
 * 
 * This migration adds tables to track:
 * - Organization subscriptions (Stripe-based)
 * - Monthly billing usage tracking
 * - Subscription lifecycle events
 */

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================
  
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    
    // Stripe identifiers
    table.string('stripe_customer_id', 255).notNullable();
    table.string('stripe_subscription_id', 255).notNullable();
    table.string('stripe_price_id', 255);
    
    // Plan details
    table.string('plan_name', 100).notNullable();
    table.string('billing_interval', 50).notNullable().defaultTo('month');
    table.decimal('plan_amount', 10, 2).notNullable();
    table.string('currency', 3).notNullable().defaultTo('USD');
    
    // Limits
    table.integer('client_limit').notNullable();
    table.integer('caregiver_limit').notNullable();
    table.integer('visit_limit');
    
    // Status
    table.string('status', 50).notNullable();
    table.jsonb('status_history').notNullable().defaultTo('[]');
    
    // Billing cycle
    table.timestamp('current_period_start').notNullable();
    table.timestamp('current_period_end').notNullable();
    table.timestamp('trial_start');
    table.timestamp('trial_end');
    table.boolean('cancel_at_period_end').notNullable().defaultTo(false);
    table.timestamp('canceled_at');
    table.timestamp('ended_at');
    
    // Payment
    table.string('payment_method_id', 255);
    table.jsonb('payment_method_details');
    table.timestamp('last_invoice_date');
    table.string('last_invoice_status', 50);
    
    // Metadata
    table.jsonb('metadata');
    table.text('cancellation_reason');
    table.text('notes');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    
    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
  });

  // Add constraints
  await knex.raw(`
    ALTER TABLE subscriptions ADD CONSTRAINT chk_subscription_plan_name CHECK (
      plan_name IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM')
    )
  `);
  
  await knex.raw(`
    ALTER TABLE subscriptions ADD CONSTRAINT chk_subscription_billing_interval CHECK (
      billing_interval IN ('month', 'year')
    )
  `);
  
  await knex.raw(`
    ALTER TABLE subscriptions ADD CONSTRAINT chk_subscription_status CHECK (
      status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 
                 'canceled', 'unpaid', 'paused')
    )
  `);
  
  await knex.raw('ALTER TABLE subscriptions ADD CONSTRAINT chk_plan_amount CHECK (plan_amount >= 0)');
  await knex.raw('ALTER TABLE subscriptions ADD CONSTRAINT chk_client_limit CHECK (client_limit > 0)');
  await knex.raw('ALTER TABLE subscriptions ADD CONSTRAINT chk_caregiver_limit CHECK (caregiver_limit > 0)');
  await knex.raw('ALTER TABLE subscriptions ADD CONSTRAINT chk_visit_limit CHECK (visit_limit IS NULL OR visit_limit > 0)');
  await knex.raw('ALTER TABLE subscriptions ADD CONSTRAINT chk_subscription_period CHECK (current_period_start < current_period_end)');

  // Indexes
  await knex.raw('CREATE UNIQUE INDEX idx_subscriptions_organization ON subscriptions(organization_id)');
  await knex.raw('CREATE UNIQUE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id)');
  await knex.raw('CREATE UNIQUE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id)');
  await knex.raw('CREATE INDEX idx_subscriptions_status ON subscriptions(status, current_period_end)');
  await knex.raw(`
    CREATE INDEX idx_subscriptions_active ON subscriptions(organization_id) 
    WHERE status IN ('active', 'trialing')
  `);
  await knex.raw(`
    CREATE INDEX idx_subscriptions_expiring ON subscriptions(current_period_end) 
    WHERE status = 'active' AND cancel_at_period_end = true
  `);

  // ============================================================================
  // BILLING USAGE
  // ============================================================================
  
  await knex.schema.createTable('billing_usage', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable();
    table.uuid('subscription_id').notNullable();
    
    // Period
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.string('period_type', 50).notNullable().defaultTo('monthly');
    
    // Usage counts
    table.integer('client_count').notNullable().defaultTo(0);
    table.integer('caregiver_count').notNullable().defaultTo(0);
    table.integer('visit_count').notNullable().defaultTo(0);
    table.integer('user_count').notNullable().defaultTo(0);
    
    // Peak usage
    table.integer('peak_client_count').notNullable().defaultTo(0);
    table.integer('peak_caregiver_count').notNullable().defaultTo(0);
    table.date('peak_recorded_date');
    
    // Limits and overages
    table.integer('client_limit').notNullable();
    table.integer('caregiver_limit').notNullable();
    table.integer('visit_limit');
    
    table.integer('client_overage').notNullable().defaultTo(0);
    table.integer('caregiver_overage').notNullable().defaultTo(0);
    table.integer('visit_overage').notNullable().defaultTo(0);
    
    table.decimal('overage_charges', 10, 2).notNullable().defaultTo(0);
    table.decimal('total_charges', 10, 2).notNullable().defaultTo(0);
    
    // Status
    table.string('status', 50).notNullable().defaultTo('ACTIVE');
    table.boolean('is_billed').notNullable().defaultTo(false);
    table.date('billed_date');
    
    // Snapshots (for auditing)
    table.jsonb('daily_snapshots').notNullable().defaultTo('[]');
    
    // Metadata
    table.text('notes');
    
    // Standard entity fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    
    // Foreign keys
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('RESTRICT');
    table.foreign('subscription_id').references('id').inTable('subscriptions').onDelete('RESTRICT');
  });

  // Add constraints
  await knex.raw(`
    ALTER TABLE billing_usage ADD CONSTRAINT chk_usage_period_type CHECK (
      period_type IN ('daily', 'weekly', 'monthly', 'yearly')
    )
  `);
  
  await knex.raw(`
    ALTER TABLE billing_usage ADD CONSTRAINT chk_usage_status CHECK (
      status IN ('ACTIVE', 'BILLED', 'ARCHIVED')
    )
  `);
  
  await knex.raw('ALTER TABLE billing_usage ADD CONSTRAINT chk_usage_period CHECK (period_start <= period_end)');
  await knex.raw('ALTER TABLE billing_usage ADD CONSTRAINT chk_client_count CHECK (client_count >= 0)');
  await knex.raw('ALTER TABLE billing_usage ADD CONSTRAINT chk_caregiver_count CHECK (caregiver_count >= 0)');
  await knex.raw('ALTER TABLE billing_usage ADD CONSTRAINT chk_visit_count CHECK (visit_count >= 0)');
  await knex.raw('ALTER TABLE billing_usage ADD CONSTRAINT chk_user_count CHECK (user_count >= 0)');
  await knex.raw('ALTER TABLE billing_usage ADD CONSTRAINT chk_overage_charges CHECK (overage_charges >= 0)');
  await knex.raw('ALTER TABLE billing_usage ADD CONSTRAINT chk_total_charges CHECK (total_charges >= 0)');

  // Indexes
  await knex.raw('CREATE INDEX idx_usage_organization ON billing_usage(organization_id, period_start DESC)');
  await knex.raw('CREATE INDEX idx_usage_subscription ON billing_usage(subscription_id, period_start DESC)');
  await knex.raw('CREATE INDEX idx_usage_period ON billing_usage(period_start, period_end, status)');
  await knex.raw(`
    CREATE INDEX idx_usage_unbilled ON billing_usage(organization_id, period_end) 
    WHERE is_billed = false AND status = 'ACTIVE'
  `);
  await knex.raw(`
    CREATE INDEX idx_usage_overage ON billing_usage(organization_id) 
    WHERE overage_charges > 0
  `);
  await knex.raw(`
    CREATE UNIQUE INDEX idx_usage_period_unique ON billing_usage(organization_id, period_start, period_end)
  `);

  // ============================================================================
  // TRIGGERS
  // ============================================================================

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_subscription_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_subscriptions_updated_at
        BEFORE UPDATE ON subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION update_subscription_updated_at();
  `);

  await knex.raw(`
    CREATE TRIGGER trigger_billing_usage_updated_at
        BEFORE UPDATE ON billing_usage
        FOR EACH ROW
        EXECUTE FUNCTION update_subscription_updated_at();
  `);

  // ============================================================================
  // COMMENTS
  // ============================================================================

  await knex.raw(`COMMENT ON TABLE subscriptions IS 'Stripe subscription management for multi-tenant organizations'`);
  await knex.raw(`COMMENT ON TABLE billing_usage IS 'Monthly usage tracking for billing and overage calculations'`);
  await knex.raw(`COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)'`);
  await knex.raw(`COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe Subscription ID (sub_xxx)'`);
  await knex.raw(`COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'If true, subscription will cancel at end of billing period'`);
  await knex.raw(`COMMENT ON COLUMN billing_usage.overage_charges IS 'Additional charges for usage beyond plan limits'`);
  await knex.raw(`COMMENT ON COLUMN billing_usage.daily_snapshots IS 'Array of daily usage snapshots for audit trail'`);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS trigger_billing_usage_updated_at ON billing_usage');
  await knex.raw('DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions');
  await knex.raw('DROP FUNCTION IF EXISTS update_subscription_updated_at');
  
  // Drop tables
  await knex.schema.dropTableIfExists('billing_usage');
  await knex.schema.dropTableIfExists('subscriptions');
}
