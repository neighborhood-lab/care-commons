/**
 * AI Usage Service
 *
 * Business logic for AI usage tracking and reporting.
 *
 * @module @folkcare/core/ai/usage
 */

import type { Knex } from 'knex';
import type { AIProviderType, ModelTier } from '../types.js';
import type {
  AIUsageRecord,
  CreateAIUsageInput,
  OrganizationUsageSummary,
  AIValueMetrics,
  UsageTimePeriod,
} from './types.js';
import { AIUsageRepository, createAIUsageRepository } from './ai-usage-repository.js';
import {
  calculateManualCostCents,
  calculateHoursAutomated,
  FEATURE_TIME_SAVINGS,
} from './cost-calculator.js';

/**
 * AI Usage Service
 *
 * Provides high-level operations for AI usage tracking:
 * - Log AI API calls
 * - Query usage statistics
 * - Calculate value metrics
 */
export class AIUsageService {
  private repository: AIUsageRepository;

  constructor(db: Knex) {
    this.repository = createAIUsageRepository(db);
  }

  /**
   * Log an AI API call
   *
   * This should be called after every AI inference to track usage.
   */
  async logUsage(input: CreateAIUsageInput): Promise<AIUsageRecord> {
    // Create the detailed record
    const record = await this.repository.create(input);

    // Update the daily summary (fire-and-forget, don't block)
    this.repository.updateDailySummary(input).catch((error) => {
      console.error('Failed to update AI usage daily summary:', error);
    });

    return record;
  }

  /**
   * Log a successful AI call
   */
  async logSuccess(
    organizationId: string,
    featureName: string,
    provider: AIProviderType,
    model: string,
    modelTier: ModelTier,
    inputTokens: number,
    outputTokens: number,
    latencyMs?: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<AIUsageRecord> {
    return this.logUsage({
      organizationId,
      userId,
      featureName,
      provider,
      model,
      modelTier,
      inputTokens,
      outputTokens,
      latencyMs,
      success: true,
      metadata,
    });
  }

  /**
   * Log a failed AI call
   */
  async logFailure(
    organizationId: string,
    featureName: string,
    provider: AIProviderType,
    model: string,
    modelTier: ModelTier,
    errorMessage: string,
    inputTokens: number = 0,
    outputTokens: number = 0,
    latencyMs?: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<AIUsageRecord> {
    return this.logUsage({
      organizationId,
      userId,
      featureName,
      provider,
      model,
      modelTier,
      inputTokens,
      outputTokens,
      latencyMs,
      success: false,
      errorMessage,
      metadata,
    });
  }

  /**
   * Get usage summary for an organization
   */
  async getUsageSummary(
    organizationId: string,
    period: UsageTimePeriod = 'month'
  ): Promise<OrganizationUsageSummary> {
    const { startDate, endDate } = this.getPeriodDates(period);

    const [stats, byFeature, byProvider] = await Promise.all([
      this.repository.getTotalStats(organizationId, startDate, endDate),
      this.repository.getFeatureUsage(organizationId, startDate, endDate),
      this.repository.getProviderUsage(organizationId, startDate, endDate),
    ]);

    return {
      organizationId,
      periodStart: startDate,
      periodEnd: endDate,
      totalRequests: stats.totalRequests,
      totalInputTokens: stats.totalInputTokens,
      totalOutputTokens: stats.totalOutputTokens,
      totalTokens: stats.totalTokens,
      totalCostCents: stats.totalCostCents,
      avgLatencyMs: stats.avgLatencyMs,
      successRate: stats.successRate,
      byFeature,
      byProvider,
    };
  }

  /**
   * Get value metrics showing AI vs manual cost savings
   */
  async getValueMetrics(
    organizationId: string,
    period: UsageTimePeriod = 'month',
    hourlyRateCents: number = 3000 // $30/hour default
  ): Promise<AIValueMetrics> {
    const { startDate, endDate } = this.getPeriodDates(period);

    const [stats, byFeature] = await Promise.all([
      this.repository.getTotalStats(organizationId, startDate, endDate),
      this.repository.getFeatureUsage(organizationId, startDate, endDate),
    ]);

    // Calculate manual equivalent cost
    let totalManualCostCents = 0;
    let totalHoursAutomated = 0;

    const topFeatures = byFeature.map((feature) => {
      const manualCost = calculateManualCostCents(
        feature.featureName,
        feature.requestCount,
        hourlyRateCents
      );
      const hoursAutomated = calculateHoursAutomated(
        feature.featureName,
        feature.requestCount
      );

      totalManualCostCents += manualCost;
      totalHoursAutomated += hoursAutomated;

      return {
        featureName: feature.featureName,
        requestCount: feature.requestCount,
        hoursAutomated,
        savingsCents: Math.max(0, manualCost - feature.totalCostCents),
      };
    });

    const aiCostCents = stats.totalCostCents;
    const savingsCents = Math.max(0, totalManualCostCents - aiCostCents);
    const savingsPercentage =
      totalManualCostCents > 0
        ? Math.round((savingsCents / totalManualCostCents) * 100)
        : 0;

    return {
      organizationId,
      periodStart: startDate,
      periodEnd: endDate,
      aiCostCents,
      estimatedManualCostCents: totalManualCostCents,
      savingsCents,
      savingsPercentage,
      hoursAutomated: Number(totalHoursAutomated.toFixed(1)),
      topFeatures: topFeatures.slice(0, 10), // Top 10 features
    };
  }

  /**
   * Get recent usage records for an organization
   */
  async getRecentUsage(
    organizationId: string,
    options?: {
      limit?: number;
      featureName?: string;
      provider?: AIProviderType;
    }
  ): Promise<AIUsageRecord[]> {
    return this.repository.getByOrganization(organizationId, {
      limit: options?.limit ?? 50,
      featureName: options?.featureName,
      provider: options?.provider,
    });
  }

  /**
   * Get available features and their time savings
   */
  getFeatureTimeSavings(): Record<string, number> {
    return { ...FEATURE_TIME_SAVINGS };
  }

  /**
   * Calculate period start and end dates
   */
  private getPeriodDates(period: UsageTimePeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }
}

/**
 * Create an AI usage service instance
 */
export function createAIUsageService(db: Knex): AIUsageService {
  return new AIUsageService(db);
}
