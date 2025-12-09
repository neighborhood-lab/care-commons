/**
 * AI Provider Abstraction Layer
 *
 * Unified interface for AI operations across different providers:
 * - Anthropic Claude (paid, high accuracy, safety-critical)
 * - Cloudflare Workers AI (free, good for non-critical features)
 * - Ollama (self-hosted, for on-prem deployments)
 *
 * Usage:
 * ```typescript
 * import { getAIService, FeatureCategory } from '@folkcare/core';
 *
 * const ai = getAIService();
 *
 * // Text generation
 * const result = await ai.generateText(
 *   'Summarize this patient note...',
 *   { maxTokens: 500 },
 *   { category: 'documentation', feature: 'note-summary' }
 * );
 *
 * // JSON generation with schema
 * const parsed = await ai.generateJSON(
 *   'Extract medication information...',
 *   { schema: MedicationSchema },
 *   { category: 'safety_critical', feature: 'medication-extraction' }
 * );
 * ```
 */

// Types
export type {
  AIProviderType,
  ModelSize,
  FeatureCategory,
  GenerateTextOptions,
  GenerateJSONOptions,
  TextGenerationResult,
  JSONGenerationResult,
  EmbeddingResult,
  IAIProvider,
  AIProviderConfig,
  AIUsageMetrics,
} from './types.js';

// Main service
export {
  AIService,
  createAIServiceFromEnv,
  getAIService,
  resetAIService,
  type AIServiceOptions,
} from './ai-service.js';

// Individual providers (for advanced use cases)
export {
  AnthropicProvider,
  createAnthropicProvider,
  type AnthropicProviderConfig,
} from './providers/anthropic-provider.js';

export {
  CloudflareProvider,
  createCloudflareProvider,
  type CloudflareProviderConfig,
} from './providers/cloudflare-provider.js';

export {
  OllamaProvider,
  createOllamaProvider,
  type OllamaProviderConfig,
} from './providers/ollama-provider.js';
