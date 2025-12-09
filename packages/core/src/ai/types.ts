/**
 * AI Provider Abstraction Layer - Types
 *
 * Common types for all AI providers to ensure consistent interfaces
 * across different AI backends (Anthropic Claude, Cloudflare Workers AI, etc.)
 */

import type { ZodType } from 'zod';

/**
 * Available AI providers
 */
export type AIProviderType = 'anthropic' | 'cloudflare' | 'ollama';

/**
 * Model size categories for provider selection
 */
export type ModelSize = 'small' | 'medium' | 'large';

/**
 * Feature categories for determining provider requirements
 */
export type FeatureCategory =
  | 'safety_critical'      // Medication interactions, hospitalization risk - requires high accuracy
  | 'clinical_analysis'    // Patient assessments, care plan effectiveness
  | 'documentation'        // Note summarization, auto-fill, quality checks
  | 'scheduling'           // Optimization, matching, predictions
  | 'analytics'            // Forecasting, churn prediction, quality metrics
  | 'general';             // Non-critical features

/**
 * Options for text generation
 */
export interface GenerateTextOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

/**
 * Options for JSON generation with schema validation
 */
export interface GenerateJSONOptions<T> extends GenerateTextOptions {
  schema: ZodType<T>;
  retryOnParseError?: boolean;
  maxRetries?: number;
}

/**
 * Response from text generation
 */
export interface TextGenerationResult {
  text: string;
  finishReason: 'stop' | 'max_tokens' | 'error';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  provider: AIProviderType;
  model: string;
}

/**
 * Response from JSON generation
 */
export interface JSONGenerationResult<T> extends TextGenerationResult {
  data: T;
  parseAttempts: number;
}

/**
 * Response from embedding generation
 */
export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  provider: AIProviderType;
  model: string;
}

/**
 * AI Provider interface that all implementations must follow
 */
export interface IAIProvider {
  readonly name: AIProviderType;
  readonly isAvailable: boolean;

  /**
   * Generate text from a prompt
   */
  generateText(prompt: string, options?: GenerateTextOptions): Promise<TextGenerationResult>;

  /**
   * Generate JSON output that conforms to a Zod schema
   */
  generateJSON<T>(prompt: string, options: GenerateJSONOptions<T>): Promise<JSONGenerationResult<T>>;

  /**
   * Generate embeddings for text (for semantic search, similarity)
   */
  generateEmbedding(text: string): Promise<EmbeddingResult>;

  /**
   * Check if the provider is properly configured
   */
  checkHealth(): Promise<boolean>;
}

/**
 * Configuration for the AI provider factory
 */
export interface AIProviderConfig {
  defaultProvider: AIProviderType;
  featureProviders?: Partial<Record<FeatureCategory, AIProviderType>>;
  anthropic?: {
    apiKey: string;
    model?: string;
    defaultMaxTokens?: number;
    defaultTemperature?: number;
  };
  cloudflare?: {
    accountId: string;
    apiToken: string;
    model?: string;
  };
  ollama?: {
    baseUrl?: string;
    model?: string;
  };
}

/**
 * Metrics for AI usage tracking
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
  timestamp: Date;
  organizationId?: string;
}
