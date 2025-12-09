/**
 * AI Usage Tracking Types
 *
 * @module @folkcare/core/ai/usage
 */

import type { AIProviderType, ModelTier } from '../types.js';

/**
 * AI usage record for a single API call
 */
export interface AIUsageRecord {
  id: string;
  organizationId: string;
  userId?: string | null;
  featureName: string;
  provider: AIProviderType;
  model: string;
  modelTier: ModelTier;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostCents: number;
  latencyMs?: number | null;
  success: boolean;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Input for creating a usage record
 */
export interface CreateAIUsageInput {
  organizationId: string;
  userId?: string;
  featureName: string;
  provider: AIProviderType;
  model: string;
  modelTier: ModelTier;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Daily summary record for dashboard queries
 */
export interface AIUsageDailySummary {
  id: string;
  organizationId: string;
  date: string; // YYYY-MM-DD format
  featureName: string;
  provider: AIProviderType;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostCents: number;
  avgLatencyMs?: number | null;
  successCount: number;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization usage summary (aggregated)
 */
export interface OrganizationUsageSummary {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostCents: number;
  avgLatencyMs: number;
  successRate: number;
  byFeature: FeatureUsageSummary[];
  byProvider: ProviderUsageSummary[];
}

/**
 * Usage summary per feature
 */
export interface FeatureUsageSummary {
  featureName: string;
  requestCount: number;
  totalTokens: number;
  totalCostCents: number;
  avgLatencyMs: number;
  successRate: number;
}

/**
 * Usage summary per provider
 */
export interface ProviderUsageSummary {
  provider: AIProviderType;
  requestCount: number;
  totalTokens: number;
  totalCostCents: number;
  avgLatencyMs: number;
}

/**
 * Cost estimate configuration per model
 */
export interface ModelCostConfig {
  provider: AIProviderType;
  model: string;
  inputCostPer1kTokens: number; // In cents
  outputCostPer1kTokens: number; // In cents
}

/**
 * Value metrics showing AI vs manual cost
 */
export interface AIValueMetrics {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  aiCostCents: number;
  estimatedManualCostCents: number;
  savingsCents: number;
  savingsPercentage: number;
  hoursAutomated: number;
  topFeatures: Array<{
    featureName: string;
    requestCount: number;
    hoursAutomated: number;
    savingsCents: number;
  }>;
}

/**
 * Time period for queries
 */
export type UsageTimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
