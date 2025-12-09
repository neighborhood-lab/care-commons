/**
 * AI Provider Abstraction Layer - Types
 *
 * Defines interfaces for AI providers allowing the system to switch between
 * different providers (Anthropic Claude, Cloudflare Workers AI, OpenAI, Ollama)
 * based on configuration.
 *
 * @module @folkcare/core/ai
 */

import type { z } from 'zod';

/**
 * Model tier indicating capability level
 * - fast: Quick responses, lower cost (e.g., Haiku, Llama 1B)
 * - balanced: Good balance of speed/quality (e.g., Sonnet, Llama 8B)
 * - powerful: Highest quality, higher cost (e.g., Opus, Llama 70B)
 */
export type ModelTier = 'fast' | 'balanced' | 'powerful';

/**
 * AI provider type identifier
 */
export type AIProviderType = 'anthropic' | 'cloudflare' | 'openai' | 'ollama';

/**
 * Options for text generation
 */
export interface GenerateTextOptions {
  /** Model tier to use (provider will select appropriate model) */
  modelTier?: ModelTier;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Temperature for response variability (0-1, lower = more deterministic) */
  temperature?: number;
  /** System prompt to set AI behavior/role */
  systemPrompt?: string;
  /** Stop sequences to end generation */
  stopSequences?: string[];
}

/**
 * Options for structured JSON generation
 */
export interface GenerateJSONOptions extends GenerateTextOptions {
  /** Retry attempts if JSON parsing fails */
  retryAttempts?: number;
}

/**
 * Result from text generation
 */
export interface GenerateTextResult {
  /** Generated text content */
  text: string;
  /** Token usage statistics */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  /** Model actually used */
  model: string;
  /** Provider that handled the request */
  provider: AIProviderType;
  /** Response time in milliseconds */
  latencyMs: number;
}

/**
 * Result from JSON generation
 */
export interface GenerateJSONResult<T> {
  /** Parsed JSON data */
  data: T;
  /** Raw text response (for debugging) */
  rawText: string;
  /** Token usage statistics */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  /** Model actually used */
  model: string;
  /** Provider that handled the request */
  provider: AIProviderType;
  /** Response time in milliseconds */
  latencyMs: number;
}

/**
 * Result from embedding generation
 */
export interface GenerateEmbeddingResult {
  /** Embedding vector */
  embedding: number[];
  /** Model used */
  model: string;
  /** Provider that handled the request */
  provider: AIProviderType;
  /** Dimensions of the embedding */
  dimensions: number;
}

/**
 * AI Provider interface
 *
 * All AI providers must implement this interface to be used interchangeably.
 * Providers handle the translation between this common interface and their
 * specific APIs.
 */
export interface AIProvider {
  /** Provider type identifier */
  readonly type: AIProviderType;

  /** Human-readable provider name */
  readonly name: string;

  /**
   * Generate text from a prompt
   * @param prompt - The user prompt to send
   * @param options - Generation options
   * @returns Generated text result
   */
  generateText(prompt: string, options?: GenerateTextOptions): Promise<GenerateTextResult>;

  /**
   * Generate structured JSON from a prompt
   * @param prompt - The user prompt (should instruct JSON output)
   * @param schema - Zod schema for validation and type inference
   * @param options - Generation options
   * @returns Parsed and validated JSON result
   */
  generateJSON<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateJSONOptions
  ): Promise<GenerateJSONResult<T>>;

  /**
   * Generate embedding vector for text
   * @param text - Text to embed
   * @returns Embedding result with vector
   */
  generateEmbedding(text: string): Promise<GenerateEmbeddingResult>;

  /**
   * Check if the provider is available and configured
   * @returns true if provider can be used
   */
  isAvailable(): boolean;

  /**
   * Get available models for this provider
   * @returns Map of model tier to model identifier
   */
  getAvailableModels(): Record<ModelTier, string>;
}

/**
 * Configuration for provider selection
 */
export interface AIProviderConfig {
  /** Default provider to use */
  defaultProvider: AIProviderType;

  /** Provider-specific feature overrides */
  featureProviders?: {
    /** Provider for safety-critical features (medication, hospitalization risk) */
    safetyCritical?: AIProviderType;
    /** Provider for analysis features (sentiment, quality scoring) */
    analysis?: AIProviderType;
    /** Provider for content generation (reports, summaries) */
    generation?: AIProviderType;
    /** Provider for embeddings/search */
    embeddings?: AIProviderType;
  };

  /** Anthropic-specific config */
  anthropic?: {
    apiKey?: string;
  };

  /** Cloudflare-specific config */
  cloudflare?: {
    accountId?: string;
    apiToken?: string;
  };

  /** OpenAI-specific config */
  openai?: {
    apiKey?: string;
    organization?: string;
  };

  /** Ollama-specific config (for self-hosted) */
  ollama?: {
    baseUrl?: string;
  };
}

/**
 * Feature categories for provider selection
 */
export type AIFeatureCategory = 'safetyCritical' | 'analysis' | 'generation' | 'embeddings';

/**
 * Default model tiers for different use cases
 */
export const DEFAULT_MODEL_TIERS: Record<AIFeatureCategory, ModelTier> = {
  safetyCritical: 'balanced', // Need reliability, not just speed
  analysis: 'fast', // Quick analysis is usually sufficient
  generation: 'balanced', // Good quality for user-facing content
  embeddings: 'fast', // Embeddings don't need large models
};

/**
 * Safety-critical features that should prefer Claude (legal defensibility)
 */
export const SAFETY_CRITICAL_FEATURES = [
  'medication-interaction',
  'hospitalization-risk',
  'vitals-anomaly',
  'compliance-checking',
] as const;

export type SafetyCriticalFeature = (typeof SAFETY_CRITICAL_FEATURES)[number];
