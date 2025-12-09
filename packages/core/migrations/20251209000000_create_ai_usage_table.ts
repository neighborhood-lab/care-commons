/**
 * Migration: Create ai_usage table
 *
 * Tracks AI inference usage per organization for cost visibility and quota management.
 * Each AI operation (text generation, JSON generation, embeddings) logs usage here.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_usage', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Organization reference (required for multi-tenant tracking)
    table
      .uuid('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE');

    // Feature identification
    table.string('feature_name', 100).notNullable().comment('Feature that triggered the AI call (e.g., "visit-note-summary")');
    table.string('category', 50).notNullable().comment('Feature category (safety_critical, clinical_analysis, documentation, etc.)');

    // Provider and model info
    table.string('provider', 50).notNullable().comment('AI provider (anthropic, cloudflare, ollama)');
    table.string('model', 100).notNullable().comment('Model used (e.g., claude-3-5-haiku, llama-3.2-3b)');

    // Token usage
    table.integer('input_tokens').notNullable().defaultTo(0).comment('Number of input tokens');
    table.integer('output_tokens').notNullable().defaultTo(0).comment('Number of output tokens');

    // Cost tracking (in cents for precision)
    table.integer('estimated_cost_cents').notNullable().defaultTo(0).comment('Estimated cost in cents');

    // Performance metrics
    table.integer('latency_ms').comment('Response latency in milliseconds');
    table.boolean('success').notNullable().defaultTo(true).comment('Whether the request succeeded');
    table.text('error_message').comment('Error message if request failed');

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for efficient querying
    table.index('organization_id');
    table.index(['organization_id', 'created_at']);
    table.index(['organization_id', 'feature_name']);
    table.index(['organization_id', 'provider']);
    table.index('created_at');
    table.index('category');
  });

  // Add comment to table
  await knex.raw(`
    COMMENT ON TABLE ai_usage IS
    'Tracks AI inference usage per organization for cost visibility, quota management, and value demonstration.';
  `);

  // Create a view for monthly usage summaries
  await knex.raw(`
    CREATE VIEW ai_usage_monthly_summary AS
    SELECT
      organization_id,
      date_trunc('month', created_at) AS month,
      feature_name,
      provider,
      COUNT(*) AS request_count,
      SUM(input_tokens) AS total_input_tokens,
      SUM(output_tokens) AS total_output_tokens,
      SUM(estimated_cost_cents) AS total_cost_cents,
      AVG(latency_ms)::integer AS avg_latency_ms,
      COUNT(*) FILTER (WHERE success = false) AS error_count
    FROM ai_usage
    GROUP BY organization_id, date_trunc('month', created_at), feature_name, provider;
  `);

  await knex.raw(`
    COMMENT ON VIEW ai_usage_monthly_summary IS
    'Aggregated monthly AI usage metrics per organization, feature, and provider.';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS ai_usage_monthly_summary');
  await knex.schema.dropTableIfExists('ai_usage');
}
