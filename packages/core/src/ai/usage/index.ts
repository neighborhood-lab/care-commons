/**
 * AI Usage Tracking
 *
 * Exports for AI usage tracking functionality.
 *
 * @module @folkcare/core/ai/usage
 */

// Types
export type {
  AIUsageRecord,
  CreateAIUsageInput,
  AIUsageDailySummary,
  OrganizationUsageSummary,
  FeatureUsageSummary,
  ProviderUsageSummary,
  ModelCostConfig,
  AIValueMetrics,
  UsageTimePeriod,
} from './types.js';

// Cost calculator
export {
  getModelCost,
  calculateCostCents,
  calculateManualCostCents,
  calculateHoursAutomated,
  FEATURE_TIME_SAVINGS,
} from './cost-calculator.js';

// Repository
export {
  AIUsageRepository,
  createAIUsageRepository,
} from './ai-usage-repository.js';

// Service
export {
  AIUsageService,
  createAIUsageService,
} from './ai-usage-service.js';
