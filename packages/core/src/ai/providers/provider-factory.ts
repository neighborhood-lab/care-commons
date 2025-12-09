/**
 * AI Provider Factory
 *
 * Creates and manages AI providers based on configuration and feature requirements.
 * Handles provider selection for different feature categories, ensuring safety-critical
 * features use appropriate providers (Claude) while allowing cost optimization for
 * other features.
 *
 * @module @folkcare/core/ai/providers
 */

import type {
  AIProvider,
  AIProviderType,
  AIProviderConfig,
  AIFeatureCategory,
} from '../types.js';
import { SAFETY_CRITICAL_FEATURES } from '../types.js';
import { createAnthropicProvider } from './anthropic-provider.js';
import { createCloudflareProvider } from './cloudflare-provider.js';

/**
 * Default provider configuration
 * Uses Anthropic as default for safety, Cloudflare for cost-sensitive features
 */
const DEFAULT_CONFIG: AIProviderConfig = {
  defaultProvider: 'anthropic',
  featureProviders: {
    safetyCritical: 'anthropic', // Always Claude for safety
    analysis: 'cloudflare', // Cost-effective for analysis
    generation: 'anthropic', // Quality for user-facing content
    embeddings: 'cloudflare', // Cloudflare has embeddings, Anthropic doesn't
  },
};

/**
 * AI Provider Factory
 *
 * Central factory for creating and managing AI providers.
 * Implements provider selection based on feature category and configuration.
 */
export class AIProviderFactory {
  private config: AIProviderConfig;
  private providers: Map<AIProviderType, AIProvider> = new Map();

  constructor(config?: Partial<AIProviderConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeProviders();
  }

  /**
   * Initialize configured providers
   */
  private initializeProviders(): void {
    // Always try to initialize Anthropic (primary provider)
    const anthropic = createAnthropicProvider(this.config.anthropic?.apiKey);
    if (anthropic.isAvailable()) {
      this.providers.set('anthropic', anthropic);
    }

    // Initialize Cloudflare if configured
    const cloudflare = createCloudflareProvider(
      this.config.cloudflare?.accountId,
      this.config.cloudflare?.apiToken
    );
    if (cloudflare.isAvailable()) {
      this.providers.set('cloudflare', cloudflare);
    }

    // Log available providers
    const available = Array.from(this.providers.keys());
    if (available.length === 0) {
      console.warn('AIProviderFactory: No AI providers available. Check environment variables.');
    } else {
      console.log(`AIProviderFactory: Available providers: ${available.join(', ')}`);
    }
  }

  /**
   * Get a provider by type
   */
  getProvider(type: AIProviderType): AIProvider {
    const provider = this.providers.get(type);
    if (provider === undefined) {
      const availableList = Array.from(this.providers.keys()).join(', ');
      const displayList = availableList === '' ? 'none' : availableList;
      throw new Error(
        `AI provider '${type}' is not available. ` +
          `Available providers: ${displayList}`
      );
    }
    return provider;
  }

  /**
   * Get the default provider
   */
  getDefaultProvider(): AIProvider {
    return this.getProvider(this.config.defaultProvider);
  }

  /**
   * Get provider for a specific feature category
   */
  getProviderForCategory(category: AIFeatureCategory): AIProvider {
    const providerType =
      this.config.featureProviders?.[category] ?? this.config.defaultProvider;

    // Try requested provider first
    if (this.providers.has(providerType)) {
      const provider = this.providers.get(providerType);
      if (provider !== undefined) {
        return provider;
      }
    }

    // Fall back to default
    if (this.providers.has(this.config.defaultProvider)) {
      console.warn(
        `AIProviderFactory: Requested provider '${providerType}' for category '${category}' ` +
          `not available, falling back to '${this.config.defaultProvider}'`
      );
      const defaultProvider = this.providers.get(this.config.defaultProvider);
      if (defaultProvider !== undefined) {
        return defaultProvider;
      }
    }

    // Fall back to any available provider
    const anyProvider = this.providers.values().next().value as AIProvider | undefined;
    if (anyProvider !== undefined) {
      console.warn(
        `AIProviderFactory: Neither requested nor default provider available for category '${category}', ` +
          `using '${anyProvider.type}'`
      );
      return anyProvider;
    }

    throw new Error(`No AI providers available for category '${category}'`);
  }

  /**
   * Get provider for a specific feature
   * Safety-critical features always use the safetyCritical provider
   */
  getProviderForFeature(featureName: string): AIProvider {
    // Check if this is a safety-critical feature
    if (this.isSafetyCriticalFeature(featureName)) {
      return this.getProviderForCategory('safetyCritical');
    }

    // Determine category based on feature name patterns
    const category = this.categorizeFeature(featureName);
    return this.getProviderForCategory(category);
  }

  /**
   * Check if a feature is safety-critical
   */
  isSafetyCriticalFeature(featureName: string): boolean {
    const normalizedName = featureName.toLowerCase().replace(/[\s_]/g, '-');
    return SAFETY_CRITICAL_FEATURES.some(
      (sf) => normalizedName.includes(sf) || sf.includes(normalizedName)
    );
  }

  /**
   * Categorize a feature based on its name
   */
  private categorizeFeature(featureName: string): AIFeatureCategory {
    const name = featureName.toLowerCase();

    // Embedding/search features
    if (name.includes('embed') || name.includes('search') || name.includes('vector')) {
      return 'embeddings';
    }

    // Analysis features
    if (name.includes('analys') || name.includes('sentiment') || name.includes('score')) {
      return 'analysis';
    }

    if (name.includes('extract') || name.includes('detect')) {
      return 'analysis';
    }

    // Generation features (user-facing content)
    if (name.includes('generat') || name.includes('summar') || name.includes('report')) {
      return 'generation';
    }

    if (name.includes('note') || name.includes('plan')) {
      return 'generation';
    }

    // Default to generation (higher quality for unknown features)
    return 'generation';
  }

  /**
   * List all available providers
   */
  listAvailableProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if any providers are available
   */
  hasAvailableProviders(): boolean {
    return this.providers.size > 0;
  }

  /**
   * Get provider health status
   */
  getProviderStatus(): Record<AIProviderType, { available: boolean; name: string }> {
    const status: Record<string, { available: boolean; name: string }> = {};

    for (const [type, provider] of this.providers) {
      status[type] = {
        available: provider.isAvailable(),
        name: provider.name,
      };
    }

    return status as Record<AIProviderType, { available: boolean; name: string }>;
  }
}

/**
 * Singleton factory instance
 */
let defaultFactory: AIProviderFactory | null = null;

/**
 * Get the default factory instance
 */
export function getAIProviderFactory(): AIProviderFactory {
  if (defaultFactory === null) {
    defaultFactory = new AIProviderFactory();
  }
  return defaultFactory;
}

/**
 * Create a new factory with custom configuration
 */
export function createAIProviderFactory(config?: Partial<AIProviderConfig>): AIProviderFactory {
  return new AIProviderFactory(config);
}

/**
 * Reset the default factory (useful for testing)
 */
export function resetAIProviderFactory(): void {
  defaultFactory = null;
}

/**
 * Convenience function to get a provider for a feature
 */
export function getProviderForFeature(featureName: string): AIProvider {
  return getAIProviderFactory().getProviderForFeature(featureName);
}

/**
 * Convenience function to get a provider for a category
 */
export function getProviderForCategory(category: AIFeatureCategory): AIProvider {
  return getAIProviderFactory().getProviderForCategory(category);
}
