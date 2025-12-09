/**
 * Migration: Create AI Usage Tracking Table
 *
 * Tracks AI inference usage per organization for:
 * - Cost visibility and transparency
 * - Value demonstration (AI savings vs manual processes)
 * - Future pricing tier support
 *
 * @see Issue #1043
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create ai_usage table
  await knex.schema.createTable('ai_usage', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('feature_name').notNullable(); // e.g., 'visit-note-summary', 'medication-interaction-check'
    table.text('provider').notNullable(); // e.g., 'anthropic', 'cloudflare'
    table.text('model').notNullable(); // e.g., 'claude-sonnet-4-20250514', '@cf/meta/llama-3.2-3b-instruct'
    table.text('model_tier').notNullable(); // 'fast', 'balanced', 'powerful'
    table.integer('input_tokens').notNullable().defaultTo(0);
    table.integer('output_tokens').notNullable().defaultTo(0);
    table.integer('total_tokens').notNullable().defaultTo(0);
    table.integer('estimated_cost_cents').notNullable().defaultTo(0); // Cost in cents (0.01 USD)
    table.integer('latency_ms').nullable(); // Response time in milliseconds
    table.boolean('success').notNullable().defaultTo(true);
    table.text('error_message').nullable();
    table.jsonb('metadata').nullable(); // Additional context (e.g., resource_id, resource_type)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Indexes for common queries
    table.index('organization_id');
    table.index('feature_name');
    table.index('provider');
    table.index('created_at');
    table.index(['organization_id', 'created_at']); // For org-specific time-range queries
    table.index(['organization_id', 'feature_name']); // For org-specific feature queries
  });

  // Create ai_usage_daily_summary materialized view for efficient dashboard queries
  await knex.raw(`
    CREATE TABLE ai_usage_daily_summary (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      feature_name TEXT NOT NULL,
      provider TEXT NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0,
      total_input_tokens INTEGER NOT NULL DEFAULT 0,
      total_output_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      total_cost_cents INTEGER NOT NULL DEFAULT 0,
      avg_latency_ms INTEGER,
      success_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(organization_id, date, feature_name, provider)
    )
  `);

  // Create indexes on summary table
  await knex.raw(`
    CREATE INDEX idx_ai_usage_daily_summary_org_date
    ON ai_usage_daily_summary(organization_id, date)
  `);

  await knex.raw(`
    CREATE INDEX idx_ai_usage_daily_summary_date
    ON ai_usage_daily_summary(date)
  `);

  // Add comment explaining the table
  await knex.raw(`
    COMMENT ON TABLE ai_usage IS 'Tracks AI inference usage per organization for cost visibility, value demonstration, and future pricing tier support. Each row represents one AI API call.'
  `);

  await knex.raw(`
    COMMENT ON TABLE ai_usage_daily_summary IS 'Aggregated daily AI usage statistics per organization, feature, and provider. Updated incrementally by the application.'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_usage_daily_summary');
  await knex.schema.dropTableIfExists('ai_usage');
}
