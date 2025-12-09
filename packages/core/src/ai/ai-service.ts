/**
 * AI Service
 *
 * Central service for AI operations with provider abstraction.
 * Routes requests to appropriate providers based on feature category and configuration.
 */

import type {
  IAIProvider,
  AIProviderType,
  AIProviderConfig,
  FeatureCategory,
  GenerateTextOptions,
  GenerateJSONOptions,
  TextGenerationResult,
  JSONGenerationResult,
  EmbeddingResult,
  AIUsageMetrics,
} from './types.js';
import { AnthropicProvider } from './providers/anthropic-provider.js';
import { CloudflareProvider } from './providers/cloudflare-provider.js';
import { OllamaProvider } from './providers/ollama-provider.js';

/**
 * Default provider routing by feature category
 *
 * Safety-critical features should use Anthropic (highest accuracy)
 * Non-critical features can use Cloudflare (free) or Ollama (self-hosted)
 */
const DEFAULT_FEATURE_PROVIDERS: Record<FeatureCategory, AIProviderType> = {
  safety_critical: 'anthropic',    // Medication interactions, hospitalization risk
  clinical_analysis: 'anthropic',  // Patient assessments, care plan effectiveness
  documentation: 'anthropic',      // Note summarization, quality checks (can be migrated)
  scheduling: 'anthropic',         // Optimization, matching (can be migrated)
  analytics: 'anthropic',          // Forecasting, predictions (can be migrated)
  general: 'anthropic',            // Default fallback
};

export interface AIServiceOptions {
  feature?: string;
  category?: FeatureCategory;
  organizationId?: string;
  forceProvider?: AIProviderType;
}

export class AIService {
  private providers: Map<AIProviderType, IAIProvider> = new Map();
  private defaultProvider: AIProviderType;
  private featureProviders: Record<FeatureCategory, AIProviderType>;
  private metricsCallback?: (metrics: AIUsageMetrics) => void;

  constructor(config: AIProviderConfig) {
    this.defaultProvider = config.defaultProvider;
    this.featureProviders = {
      ...DEFAULT_FEATURE_PROVIDERS,
      ...config.featureProviders,
    };

    // Initialize configured providers
    if (config.anthropic?.apiKey !== undefined && config.anthropic.apiKey !== '') {
      this.providers.set('anthropic', new AnthropicProvider(config.anthropic));
    }

    if (config.cloudflare !== undefined &&
        config.cloudflare.accountId !== '' && config.cloudflare.apiToken !== '') {
      this.providers.set('cloudflare', new CloudflareProvider(config.cloudflare));
    }

    if (config.ollama !== undefined) {
      this.providers.set('ollama', new OllamaProvider(config.ollama));
    }

    // Validate default provider is available
    if (!this.providers.has(this.defaultProvider)) {
      const available = Array.from(this.providers.keys());
      if (available.length === 0) {
        throw new Error('No AI providers configured. At least one provider must be configured.');
      }
      // Fall back to first available provider
      this.defaultProvider = available[0] as AIProviderType;
      console.warn(`Configured default provider not available, falling back to: ${this.defaultProvider}`);
    }
  }

  /**
   * Set callback for tracking AI usage metrics
   */
  onMetrics(callback: (metrics: AIUsageMetrics) => void): void {
    this.metricsCallback = callback;
  }

  /**
   * Get the appropriate provider for a feature/category
   */
  private getProvider(options?: AIServiceOptions): IAIProvider {
    // Force provider takes precedence
    if (options?.forceProvider !== undefined) {
      const provider = this.providers.get(options.forceProvider);
      if (provider === undefined) {
        throw new Error(`Requested provider '${options.forceProvider}' is not configured`);
      }
      return provider;
    }

    // Route by category
    if (options?.category !== undefined) {
      const providerType = this.featureProviders[options.category];
      const provider = this.providers.get(providerType);
      if (provider !== undefined) {
        return provider;
      }
      // Fall through to default if category provider not available
    }

    // Use default provider
    const provider = this.providers.get(this.defaultProvider);
    if (provider === undefined) {
      throw new Error(`Default provider '${this.defaultProvider}' is not available`);
    }
    return provider;
  }

  /**
   * Generate text using the appropriate AI provider
   */
  async generateText(
    prompt: string,
    generateOptions?: GenerateTextOptions,
    serviceOptions?: AIServiceOptions
  ): Promise<TextGenerationResult> {
    const provider = this.getProvider(serviceOptions);
    const startTime = Date.now();

    try {
      const result = await provider.generateText(prompt, generateOptions);

      // Record metrics
      this.recordMetrics({
        provider: provider.name,
        model: result.model,
        feature: serviceOptions?.feature ?? 'unknown',
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
        latencyMs: Date.now() - startTime,
        success: true,
        timestamp: new Date(),
        organizationId: serviceOptions?.organizationId,
      });

      return result;
    } catch (e) {
      this.recordMetrics({
        provider: provider.name,
        model: 'unknown',
        feature: serviceOptions?.feature ?? 'unknown',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        success: false,
        error: (e as Error).message,
        timestamp: new Date(),
        organizationId: serviceOptions?.organizationId,
      });

      throw e;
    }
  }

  /**
   * Generate JSON output using the appropriate AI provider
   */
  async generateJSON<T>(
    prompt: string,
    generateOptions: GenerateJSONOptions<T>,
    serviceOptions?: AIServiceOptions
  ): Promise<JSONGenerationResult<T>> {
    const provider = this.getProvider(serviceOptions);
    const startTime = Date.now();

    try {
      const result = await provider.generateJSON(prompt, generateOptions);

      this.recordMetrics({
        provider: provider.name,
        model: result.model,
        feature: serviceOptions?.feature ?? 'unknown',
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
        latencyMs: Date.now() - startTime,
        success: true,
        timestamp: new Date(),
        organizationId: serviceOptions?.organizationId,
      });

      return result;
    } catch (e) {
      this.recordMetrics({
        provider: provider.name,
        model: 'unknown',
        feature: serviceOptions?.feature ?? 'unknown',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        success: false,
        error: (e as Error).message,
        timestamp: new Date(),
        organizationId: serviceOptions?.organizationId,
      });

      throw e;
    }
  }

  /**
   * Generate embeddings using the appropriate AI provider
   */
  async generateEmbedding(
    text: string,
    serviceOptions?: AIServiceOptions
  ): Promise<EmbeddingResult> {
    // For embeddings, prefer Cloudflare (free) or Ollama (local)
    // Anthropic doesn't support embeddings
    const preferredProviders: AIProviderType[] = ['cloudflare', 'ollama'];

    let provider: IAIProvider | undefined;

    if (serviceOptions?.forceProvider !== undefined) {
      provider = this.providers.get(serviceOptions.forceProvider);
    } else {
      for (const providerType of preferredProviders) {
        const p = this.providers.get(providerType);
        if (p !== undefined) {
          provider = p;
          break;
        }
      }
    }

    if (provider === undefined) {
      throw new Error('No embedding-capable provider is configured (need Cloudflare or Ollama)');
    }

    const startTime = Date.now();

    try {
      const result = await provider.generateEmbedding(text);

      this.recordMetrics({
        provider: provider.name,
        model: result.model,
        feature: serviceOptions?.feature ?? 'embedding',
        inputTokens: Math.ceil(text.length / 4), // Rough estimate
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        success: true,
        timestamp: new Date(),
        organizationId: serviceOptions?.organizationId,
      });

      return result;
    } catch (e) {
      this.recordMetrics({
        provider: provider.name,
        model: 'unknown',
        feature: serviceOptions?.feature ?? 'embedding',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        success: false,
        error: (e as Error).message,
        timestamp: new Date(),
        organizationId: serviceOptions?.organizationId,
      });

      throw e;
    }
  }

  /**
   * Check health of all configured providers
   */
  async checkHealth(): Promise<Record<AIProviderType, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.checkHealth();
      } catch {
        results[name] = false;
      }
    }

    return results as Record<AIProviderType, boolean>;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider for specific category
   */
  getProviderForCategory(category: FeatureCategory): AIProviderType {
    return this.featureProviders[category];
  }

  /**
   * Record usage metrics
   */
  private recordMetrics(metrics: AIUsageMetrics): void {
    if (this.metricsCallback !== undefined) {
      try {
        this.metricsCallback(metrics);
      } catch (e) {
        console.error('Failed to record AI metrics:', e);
      }
    }
  }
}

/**
 * Create AI service from environment variables
 */
export function createAIServiceFromEnv(): AIService {
  const config: AIProviderConfig = {
    defaultProvider: (process.env.AI_DEFAULT_PROVIDER as AIProviderType) ?? 'anthropic',
  };

  // Anthropic configuration
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey !== undefined && anthropicKey !== '') {
    const maxTokensStr = process.env.ANTHROPIC_MAX_TOKENS;
    const tempStr = process.env.ANTHROPIC_TEMPERATURE;
    config.anthropic = {
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL,
      defaultMaxTokens: maxTokensStr !== undefined && maxTokensStr !== ''
        ? parseInt(maxTokensStr, 10)
        : undefined,
      defaultTemperature: tempStr !== undefined && tempStr !== ''
        ? parseFloat(tempStr)
        : undefined,
    };
  }

  // Cloudflare configuration
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfToken = process.env.CLOUDFLARE_AI_TOKEN;
  if (cfAccountId !== undefined && cfAccountId !== '' &&
      cfToken !== undefined && cfToken !== '') {
    config.cloudflare = {
      accountId: cfAccountId,
      apiToken: cfToken,
      model: process.env.CLOUDFLARE_AI_MODEL,
    };
  }

  // Ollama configuration
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  if ((ollamaUrl !== undefined && ollamaUrl !== '') || process.env.OLLAMA_ENABLED === 'true') {
    config.ollama = {
      baseUrl: ollamaUrl,
      model: process.env.OLLAMA_MODEL,
    };
  }

  return new AIService(config);
}

// Singleton instance (lazy initialized)
let aiServiceInstance: AIService | null = null;

/**
 * Get or create the singleton AI service instance
 */
export function getAIService(): AIService {
  if (aiServiceInstance === null) {
    aiServiceInstance = createAIServiceFromEnv();
  }
  return aiServiceInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetAIService(): void {
  aiServiceInstance = null;
}
