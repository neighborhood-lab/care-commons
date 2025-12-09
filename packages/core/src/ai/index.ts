/**
 * AI Provider Abstraction Layer
 *
 * Provides a unified interface for AI capabilities across different providers.
 * Supports Anthropic Claude (primary), Cloudflare Workers AI (cost-effective),
 * and is extensible to OpenAI and Ollama for self-hosted deployments.
 *
 * ## Usage
 *
 * ```typescript
 * import { getProviderForFeature, getProviderForCategory } from '@folkcare/core/ai';
 *
 * // Get provider for a specific feature (auto-categorizes)
 * const provider = getProviderForFeature('visit-note-summary');
 *
 * // Generate text
 * const result = await provider.generateText('Summarize this visit...', {
 *   modelTier: 'balanced',
 *   temperature: 0.5,
 * });
 *
 * // Generate structured JSON
 * const schema = z.object({ summary: z.string(), keyPoints: z.array(z.string()) });
 * const jsonResult = await provider.generateJSON(prompt, schema);
 *
 * // Get provider for a category
 * const analysisProvider = getProviderForCategory('analysis');
 * ```
 *
 * ## Provider Selection
 *
 * The factory automatically selects providers based on feature category:
 * - **safetyCritical**: Always Anthropic Claude (medication, risk assessment)
 * - **analysis**: Cloudflare (cost-effective for sentiment, scoring)
 * - **generation**: Anthropic (quality for user-facing content)
 * - **embeddings**: Cloudflare (has embedding API, Anthropic doesn't)
 *
 * ## Configuration
 *
 * Set environment variables:
 * - `ANTHROPIC_API_KEY`: For Claude access
 * - `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`: For Workers AI
 *
 * Or pass config to the factory:
 *
 * ```typescript
 * import { createAIProviderFactory } from '@folkcare/core/ai';
 *
 * const factory = createAIProviderFactory({
 *   defaultProvider: 'cloudflare', // For cost-sensitive self-hosters
 *   featureProviders: {
 *     safetyCritical: 'anthropic', // Still use Claude for safety
 *   },
 * });
 * ```
 *
 * @module @folkcare/core/ai
 */

// Types
export type {
  AIProvider,
  AIProviderType,
  AIProviderConfig,
  AIFeatureCategory,
  SafetyCriticalFeature,
  ModelTier,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateJSONOptions,
  GenerateJSONResult,
  GenerateEmbeddingResult,
} from './types.js';

export { DEFAULT_MODEL_TIERS, SAFETY_CRITICAL_FEATURES } from './types.js';

// Providers
export { AnthropicProvider, createAnthropicProvider } from './providers/anthropic-provider.js';
export { CloudflareProvider, createCloudflareProvider } from './providers/cloudflare-provider.js';

// Factory
export {
  AIProviderFactory,
  getAIProviderFactory,
  createAIProviderFactory,
  resetAIProviderFactory,
  getProviderForFeature,
  getProviderForCategory,
} from './providers/provider-factory.js';

// Usage tracking
export {
  AIUsageService,
  createAIUsageService,
  AIUsageRepository,
  createAIUsageRepository,
  calculateCostCents,
  calculateManualCostCents,
  calculateHoursAutomated,
  getModelCost,
  FEATURE_TIME_SAVINGS,
} from './usage/index.js';

export type {
  AIUsageRecord,
  CreateAIUsageInput,
  AIUsageDailySummary,
  OrganizationUsageSummary,
  FeatureUsageSummary,
  ProviderUsageSummary,
  AIValueMetrics,
  UsageTimePeriod,
} from './usage/index.js';
