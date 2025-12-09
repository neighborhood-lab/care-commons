/**
 * AI Usage Repository
 *
 * Data access layer for AI usage tracking.
 * Stores and retrieves AI inference metrics per organization.
 */

import type { Knex } from 'knex';
import type { AIFeatureCategory, AIProviderType } from './types.js';

/**
 * AI usage metrics for logging
 */
export interface AIUsageMetrics {
  provider: AIProviderType;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  organizationId?: string;
}

export interface AIUsageRecord {
  id: string;
  organizationId: string;
  featureName: string;
  category: AIFeatureCategory;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostCents: number;
  latencyMs: number | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: Date;
}

export interface AIUsageSummary {
  organizationId: string;
  month: Date;
  featureName: string;
  provider: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostCents: number;
  avgLatencyMs: number;
  errorCount: number;
}

export interface AIUsageFilter {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  featureName?: string;
  category?: AIFeatureCategory;
  provider?: string;
  success?: boolean;
}

export interface CostBreakdown {
  provider: string;
  model: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostCents: number;
}

export interface FeatureUsage {
  featureName: string;
  category: AIFeatureCategory;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostCents: number;
  avgLatencyMs: number;
  successRate: number;
}

/**
 * Cost rates per 1K tokens (in cents)
 * These are approximate and should be updated as pricing changes
 */
const COST_RATES: Record<string, { input: number; output: number }> = {
  // Anthropic Claude 3.5 Haiku
  'claude-3-5-haiku-20241022': { input: 0.1, output: 0.5 },
  // Cloudflare is free tier
  '@cf/meta/llama-3.2-3b-instruct': { input: 0, output: 0 },
  // Ollama is self-hosted (no cost)
  'llama3.2:3b': { input: 0, output: 0 },
};

export class AIUsageRepository {
  constructor(private db: Knex) {}

  /**
   * Calculate estimated cost in cents
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const rates = COST_RATES[model];
    if (rates === undefined) {
      // Default to 0 for unknown models
      return 0;
    }
    const inputCost = (inputTokens / 1000) * rates.input;
    const outputCost = (outputTokens / 1000) * rates.output;
    return Math.round(inputCost + outputCost);
  }

  /**
   * Record AI usage from metrics callback
   */
  async recordUsage(metrics: AIUsageMetrics, category: AIFeatureCategory): Promise<string> {
    const estimatedCostCents = this.calculateCost(
      metrics.model,
      metrics.inputTokens,
      metrics.outputTokens
    );

    const [record] = await this.db('ai_usage')
      .insert({
        organization_id: metrics.organizationId,
        feature_name: metrics.feature,
        category,
        provider: metrics.provider,
        model: metrics.model,
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        estimated_cost_cents: estimatedCostCents,
        latency_ms: metrics.latencyMs,
        success: metrics.success,
        error_message: metrics.error ?? null,
      })
      .returning('id');

    return record.id as string;
  }

  /**
   * Get usage records with filtering
   */
  async getUsage(filter: AIUsageFilter, limit = 100, offset = 0): Promise<AIUsageRecord[]> {
    let query = this.db('ai_usage')
      .where('organization_id', filter.organizationId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (filter.startDate !== undefined) {
      query = query.where('created_at', '>=', filter.startDate);
    }
    if (filter.endDate !== undefined) {
      query = query.where('created_at', '<=', filter.endDate);
    }
    if (filter.featureName !== undefined) {
      query = query.where('feature_name', filter.featureName);
    }
    if (filter.category !== undefined) {
      query = query.where('category', filter.category);
    }
    if (filter.provider !== undefined) {
      query = query.where('provider', filter.provider);
    }
    if (filter.success !== undefined) {
      query = query.where('success', filter.success);
    }

    const rows = await query;
    return rows.map((row) => this.mapToRecord(row));
  }

  /**
   * Get monthly usage summary
   */
  async getMonthlySummary(organizationId: string, months = 6): Promise<AIUsageSummary[]> {
    const rows = await this.db('ai_usage_monthly_summary')
      .where('organization_id', organizationId)
      .where('month', '>=', this.db.raw("NOW() - INTERVAL '? months'", [months]))
      .orderBy('month', 'desc')
      .orderBy('feature_name');

    return rows.map((row) => ({
      organizationId: row.organization_id as string,
      month: new Date(row.month as string),
      featureName: row.feature_name as string,
      provider: row.provider as string,
      requestCount: Number(row.request_count),
      totalInputTokens: Number(row.total_input_tokens),
      totalOutputTokens: Number(row.total_output_tokens),
      totalCostCents: Number(row.total_cost_cents),
      avgLatencyMs: Number(row.avg_latency_ms),
      errorCount: Number(row.error_count),
    }));
  }

  /**
   * Get cost breakdown by provider/model for a time range
   */
  async getCostBreakdown(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostBreakdown[]> {
    const rows = await this.db('ai_usage')
      .where('organization_id', organizationId)
      .whereBetween('created_at', [startDate, endDate])
      .groupBy('provider', 'model')
      .select(
        'provider',
        'model',
        this.db.raw('COUNT(*) as request_count'),
        this.db.raw('SUM(input_tokens) as total_input_tokens'),
        this.db.raw('SUM(output_tokens) as total_output_tokens'),
        this.db.raw('SUM(estimated_cost_cents) as total_cost_cents')
      )
      .orderBy('total_cost_cents', 'desc');

    return rows.map((row) => ({
      provider: row.provider as string,
      model: row.model as string,
      requestCount: Number(row.request_count),
      totalInputTokens: Number(row.total_input_tokens),
      totalOutputTokens: Number(row.total_output_tokens),
      totalCostCents: Number(row.total_cost_cents),
    }));
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsage(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FeatureUsage[]> {
    const rows = await this.db('ai_usage')
      .where('organization_id', organizationId)
      .whereBetween('created_at', [startDate, endDate])
      .groupBy('feature_name', 'category')
      .select(
        'feature_name',
        'category',
        this.db.raw('COUNT(*) as request_count'),
        this.db.raw('SUM(input_tokens) as total_input_tokens'),
        this.db.raw('SUM(output_tokens) as total_output_tokens'),
        this.db.raw('SUM(estimated_cost_cents) as total_cost_cents'),
        this.db.raw('AVG(latency_ms)::integer as avg_latency_ms'),
        this.db.raw('COUNT(*) FILTER (WHERE success = true)::float / COUNT(*)::float as success_rate')
      )
      .orderBy('request_count', 'desc');

    return rows.map((row) => ({
      featureName: row.feature_name as string,
      category: row.category as AIFeatureCategory,
      requestCount: Number(row.request_count),
      totalInputTokens: Number(row.total_input_tokens),
      totalOutputTokens: Number(row.total_output_tokens),
      totalCostCents: Number(row.total_cost_cents),
      avgLatencyMs: Number.isNaN(Number(row.avg_latency_ms)) ? 0 : Number(row.avg_latency_ms),
      successRate: Number.isNaN(Number(row.success_rate)) ? 0 : Number(row.success_rate),
    }));
  }

  /**
   * Get total usage statistics for current month
   */
  async getCurrentMonthStats(organizationId: string): Promise<{
    requestCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostCents: number;
    avgLatencyMs: number;
    errorCount: number;
  }> {
    const [row] = await this.db('ai_usage')
      .where('organization_id', organizationId)
      .whereRaw("created_at >= date_trunc('month', NOW())")
      .select(
        this.db.raw('COUNT(*) as request_count'),
        this.db.raw('COALESCE(SUM(input_tokens), 0) as total_input_tokens'),
        this.db.raw('COALESCE(SUM(output_tokens), 0) as total_output_tokens'),
        this.db.raw('COALESCE(SUM(estimated_cost_cents), 0) as total_cost_cents'),
        this.db.raw('COALESCE(AVG(latency_ms), 0)::integer as avg_latency_ms'),
        this.db.raw('COUNT(*) FILTER (WHERE success = false) as error_count')
      );

    return {
      requestCount: Number(row.request_count),
      totalInputTokens: Number(row.total_input_tokens),
      totalOutputTokens: Number(row.total_output_tokens),
      totalCostCents: Number(row.total_cost_cents),
      avgLatencyMs: Number(row.avg_latency_ms),
      errorCount: Number(row.error_count),
    };
  }

  /**
   * Map database row to AIUsageRecord
   */
  private mapToRecord(row: Record<string, unknown>): AIUsageRecord {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      featureName: row.feature_name as string,
      category: row.category as AIFeatureCategory,
      provider: row.provider as string,
      model: row.model as string,
      inputTokens: Number(row.input_tokens),
      outputTokens: Number(row.output_tokens),
      estimatedCostCents: Number(row.estimated_cost_cents),
      latencyMs: row.latency_ms !== null && row.latency_ms !== undefined ? Number(row.latency_ms) : null,
      success: row.success as boolean,
      errorMessage: row.error_message as string | null,
      createdAt: new Date(row.created_at as string),
    };
  }
}

/**
 * Factory function to create AI usage repository
 */
export function createAIUsageRepository(db: Knex): AIUsageRepository {
  return new AIUsageRepository(db);
}
