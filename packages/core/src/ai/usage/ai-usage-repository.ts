/**
 * AI Usage Repository
 *
 * Database access layer for AI usage tracking.
 *
 * @module @folkcare/core/ai/usage
 */

import type { Knex } from 'knex';
import type { AIProviderType } from '../types.js';
import type {
  AIUsageRecord,
  CreateAIUsageInput,
  AIUsageDailySummary,
  FeatureUsageSummary,
  ProviderUsageSummary,
} from './types.js';
import { calculateCostCents } from './cost-calculator.js';

/**
 * Database row type for ai_usage table
 */
interface AIUsageRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  feature_name: string;
  provider: string;
  model: string;
  model_tier: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_cents: number;
  latency_ms: number | null;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

/**
 * Database row type for ai_usage_daily_summary table
 */
interface AIUsageDailySummaryRow {
  id: string;
  organization_id: string;
  date: string;
  feature_name: string;
  provider: string;
  request_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost_cents: number;
  avg_latency_ms: number | null;
  success_count: number;
  error_count: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Aggregate query result for feature usage
 */
interface FeatureUsageQueryResult {
  feature_name: string;
  request_count: string;
  total_tokens: string;
  total_cost_cents: string;
  avg_latency_ms: string | null;
  success_count: string;
  error_count: string;
}

/**
 * Aggregate query result for provider usage
 */
interface ProviderUsageQueryResult {
  provider: string;
  request_count: string;
  total_tokens: string;
  total_cost_cents: string;
  avg_latency_ms: string | null;
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateString(date: Date): string {
  const isoString = date.toISOString();
  const datePart = isoString.split('T')[0];
  return datePart ?? isoString.slice(0, 10);
}

/**
 * AI Usage Repository
 */
export class AIUsageRepository {
  constructor(private db: Knex) {}

  /**
   * Create a new usage record
   */
  async create(input: CreateAIUsageInput): Promise<AIUsageRecord> {
    const totalTokens = input.inputTokens + input.outputTokens;
    const estimatedCostCents = calculateCostCents(
      input.provider,
      input.model,
      input.inputTokens,
      input.outputTokens
    );

    const [row] = await this.db('ai_usage')
      .insert({
        organization_id: input.organizationId,
        user_id: input.userId ?? null,
        feature_name: input.featureName,
        provider: input.provider,
        model: input.model,
        model_tier: input.modelTier,
        input_tokens: input.inputTokens,
        output_tokens: input.outputTokens,
        total_tokens: totalTokens,
        estimated_cost_cents: estimatedCostCents,
        latency_ms: input.latencyMs ?? null,
        success: input.success ?? true,
        error_message: input.errorMessage ?? null,
        metadata: input.metadata !== undefined ? JSON.stringify(input.metadata) : null,
      })
      .returning('*');

    return this.mapRowToRecord(row);
  }

  /**
   * Update daily summary incrementally
   */
  async updateDailySummary(input: CreateAIUsageInput): Promise<void> {
    const today = formatDateString(new Date());
    const totalTokens = input.inputTokens + input.outputTokens;
    const estimatedCostCents = calculateCostCents(
      input.provider,
      input.model,
      input.inputTokens,
      input.outputTokens
    );

    // Upsert the daily summary
    await this.db.raw(`
      INSERT INTO ai_usage_daily_summary (
        organization_id, date, feature_name, provider,
        request_count, total_input_tokens, total_output_tokens, total_tokens,
        total_cost_cents, avg_latency_ms, success_count, error_count
      )
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (organization_id, date, feature_name, provider)
      DO UPDATE SET
        request_count = ai_usage_daily_summary.request_count + 1,
        total_input_tokens = ai_usage_daily_summary.total_input_tokens + EXCLUDED.total_input_tokens,
        total_output_tokens = ai_usage_daily_summary.total_output_tokens + EXCLUDED.total_output_tokens,
        total_tokens = ai_usage_daily_summary.total_tokens + EXCLUDED.total_tokens,
        total_cost_cents = ai_usage_daily_summary.total_cost_cents + EXCLUDED.total_cost_cents,
        avg_latency_ms = CASE
          WHEN EXCLUDED.avg_latency_ms IS NOT NULL THEN
            (COALESCE(ai_usage_daily_summary.avg_latency_ms, 0) * ai_usage_daily_summary.request_count + EXCLUDED.avg_latency_ms)
            / (ai_usage_daily_summary.request_count + 1)
          ELSE ai_usage_daily_summary.avg_latency_ms
        END,
        success_count = ai_usage_daily_summary.success_count + EXCLUDED.success_count,
        error_count = ai_usage_daily_summary.error_count + EXCLUDED.error_count,
        updated_at = NOW()
    `, [
      input.organizationId,
      today,
      input.featureName,
      input.provider,
      input.inputTokens,
      input.outputTokens,
      totalTokens,
      estimatedCostCents,
      input.latencyMs ?? null,
      input.success !== false ? 1 : 0,
      input.success === false ? 1 : 0,
    ]);
  }

  /**
   * Get usage records for an organization
   */
  async getByOrganization(
    organizationId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      featureName?: string;
      provider?: AIProviderType;
      limit?: number;
      offset?: number;
    }
  ): Promise<AIUsageRecord[]> {
    let query = this.db('ai_usage')
      .where('organization_id', organizationId)
      .orderBy('created_at', 'desc');

    if (options?.startDate !== undefined) {
      query = query.where('created_at', '>=', options.startDate);
    }
    if (options?.endDate !== undefined) {
      query = query.where('created_at', '<=', options.endDate);
    }
    if (options?.featureName !== undefined) {
      query = query.where('feature_name', options.featureName);
    }
    if (options?.provider !== undefined) {
      query = query.where('provider', options.provider);
    }

    query = query.limit(options?.limit ?? 100).offset(options?.offset ?? 0);

    const rows = await query;
    return rows.map((row: AIUsageRow) => this.mapRowToRecord(row));
  }

  /**
   * Get daily summaries for an organization
   */
  async getDailySummaries(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AIUsageDailySummary[]> {
    const rows = await this.db('ai_usage_daily_summary')
      .where('organization_id', organizationId)
      .whereBetween('date', [
        formatDateString(startDate),
        formatDateString(endDate),
      ])
      .orderBy('date', 'desc');

    return rows.map((row: AIUsageDailySummaryRow) => this.mapSummaryRowToRecord(row));
  }

  /**
   * Get aggregated feature usage for an organization
   */
  async getFeatureUsage(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FeatureUsageSummary[]> {
    const rows = await this.db('ai_usage_daily_summary')
      .select('feature_name')
      .sum('request_count as request_count')
      .sum('total_tokens as total_tokens')
      .sum('total_cost_cents as total_cost_cents')
      .avg('avg_latency_ms as avg_latency_ms')
      .sum('success_count as success_count')
      .sum('error_count as error_count')
      .where('organization_id', organizationId)
      .whereBetween('date', [
        formatDateString(startDate),
        formatDateString(endDate),
      ])
      .groupBy('feature_name')
      .orderBy('request_count', 'desc');

    return (rows as FeatureUsageQueryResult[]).map((row) => {
      const requestCount = Number(row.request_count);
      const successCount = Number(row.success_count);
      return {
        featureName: row.feature_name,
        requestCount,
        totalTokens: Number(row.total_tokens),
        totalCostCents: Number(row.total_cost_cents),
        avgLatencyMs: row.avg_latency_ms !== null ? Number(row.avg_latency_ms) : 0,
        successRate: requestCount > 0 ? successCount / requestCount : 1,
      };
    });
  }

  /**
   * Get aggregated provider usage for an organization
   */
  async getProviderUsage(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProviderUsageSummary[]> {
    const rows = await this.db('ai_usage_daily_summary')
      .select('provider')
      .sum('request_count as request_count')
      .sum('total_tokens as total_tokens')
      .sum('total_cost_cents as total_cost_cents')
      .avg('avg_latency_ms as avg_latency_ms')
      .where('organization_id', organizationId)
      .whereBetween('date', [
        formatDateString(startDate),
        formatDateString(endDate),
      ])
      .groupBy('provider')
      .orderBy('request_count', 'desc');

    return (rows as ProviderUsageQueryResult[]).map((row) => ({
      provider: row.provider as AIProviderType,
      requestCount: Number(row.request_count),
      totalTokens: Number(row.total_tokens),
      totalCostCents: Number(row.total_cost_cents),
      avgLatencyMs: row.avg_latency_ms !== null ? Number(row.avg_latency_ms) : 0,
    }));
  }

  /**
   * Get total usage stats for an organization
   */
  async getTotalStats(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostCents: number;
    avgLatencyMs: number;
    successRate: number;
  }> {
    const [result] = await this.db('ai_usage_daily_summary')
      .sum('request_count as total_requests')
      .sum('total_input_tokens as total_input_tokens')
      .sum('total_output_tokens as total_output_tokens')
      .sum('total_tokens as total_tokens')
      .sum('total_cost_cents as total_cost_cents')
      .avg('avg_latency_ms as avg_latency_ms')
      .sum('success_count as success_count')
      .sum('error_count as error_count')
      .where('organization_id', organizationId)
      .whereBetween('date', [
        formatDateString(startDate),
        formatDateString(endDate),
      ]);

    const totalRequests = Number(result?.total_requests ?? 0);
    const successCount = Number(result?.success_count ?? 0);

    return {
      totalRequests,
      totalInputTokens: Number(result?.total_input_tokens ?? 0),
      totalOutputTokens: Number(result?.total_output_tokens ?? 0),
      totalTokens: Number(result?.total_tokens ?? 0),
      totalCostCents: Number(result?.total_cost_cents ?? 0),
      avgLatencyMs: Number(result?.avg_latency_ms ?? 0),
      successRate: totalRequests > 0 ? successCount / totalRequests : 1,
    };
  }

  /**
   * Map database row to record
   */
  private mapRowToRecord(row: AIUsageRow): AIUsageRecord {
    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      featureName: row.feature_name,
      provider: row.provider as AIProviderType,
      model: row.model,
      modelTier: row.model_tier as 'fast' | 'balanced' | 'powerful',
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      totalTokens: row.total_tokens,
      estimatedCostCents: row.estimated_cost_cents,
      latencyMs: row.latency_ms,
      success: row.success,
      errorMessage: row.error_message,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Map summary row to record
   */
  private mapSummaryRowToRecord(row: AIUsageDailySummaryRow): AIUsageDailySummary {
    return {
      id: row.id,
      organizationId: row.organization_id,
      date: row.date,
      featureName: row.feature_name,
      provider: row.provider as AIProviderType,
      requestCount: row.request_count,
      totalInputTokens: row.total_input_tokens,
      totalOutputTokens: row.total_output_tokens,
      totalTokens: row.total_tokens,
      totalCostCents: row.total_cost_cents,
      avgLatencyMs: row.avg_latency_ms,
      successCount: row.success_count,
      errorCount: row.error_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

/**
 * Create an AI usage repository instance
 */
export function createAIUsageRepository(db: Knex): AIUsageRepository {
  return new AIUsageRepository(db);
}
