/**
 * Anthropic Claude Provider
 *
 * Implementation of AIProvider for Anthropic's Claude models.
 * This is the primary provider for safety-critical features due to
 * Claude's reliability and the legal defensibility of using a well-established
 * commercial AI provider for healthcare applications.
 *
 * @module @folkcare/core/ai/providers
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type {
  AIProvider,
  AIProviderType,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateJSONOptions,
  GenerateJSONResult,
  GenerateEmbeddingResult,
  ModelTier,
} from '../types.js';

/**
 * Model mapping for Anthropic Claude
 */
const ANTHROPIC_MODELS: Record<ModelTier, string> = {
  fast: 'claude-3-5-haiku-latest',
  balanced: 'claude-sonnet-4-20250514',
  powerful: 'claude-opus-4-20250514',
};

/**
 * Default options for text generation
 */
const DEFAULT_OPTIONS: Required<Omit<GenerateTextOptions, 'systemPrompt' | 'stopSequences'>> = {
  modelTier: 'balanced',
  maxTokens: 4096,
  temperature: 0.7,
};

/**
 * Anthropic Claude AI Provider
 *
 * Provides access to Claude models through the Anthropic API.
 * Best used for:
 * - Safety-critical healthcare features (medication, risk assessment)
 * - High-quality text generation
 * - Complex reasoning tasks
 */
export class AnthropicProvider implements AIProvider {
  readonly type: AIProviderType = 'anthropic';
  readonly name = 'Anthropic Claude';

  private client: Anthropic | null = null;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (this.apiKey !== undefined && this.apiKey !== '') {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  /**
   * Check if the provider is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Get available models for each tier
   */
  getAvailableModels(): Record<ModelTier, string> {
    return { ...ANTHROPIC_MODELS };
  }

  /**
   * Generate text from a prompt
   */
  async generateText(
    prompt: string,
    options?: GenerateTextOptions
  ): Promise<GenerateTextResult> {
    if (this.client === null) {
      throw new Error('Anthropic provider not configured - missing API key');
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const model = ANTHROPIC_MODELS[opts.modelTier];
    const startTime = Date.now();

    const response = await this.client.messages.create({
      model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      system: opts.systemPrompt,
      stop_sequences: opts.stopSequences,
      messages: [{ role: 'user', content: prompt }],
    });

    const latencyMs = Date.now() - startTime;

    // Extract text from response
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model,
      provider: this.type,
      latencyMs,
    };
  }

  /**
   * Generate structured JSON from a prompt
   */
  async generateJSON<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateJSONOptions
  ): Promise<GenerateJSONResult<T>> {
    const retryAttempts = options?.retryAttempts ?? 2;
    let currentPrompt = prompt;

    // Add JSON instruction to system prompt
    const systemPrompt = [
      options?.systemPrompt,
      'You must respond with valid JSON only. No markdown, no explanations, just the JSON object.',
    ]
      .filter(Boolean)
      .join('\n\n');

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      const result = await this.generateText(currentPrompt, {
        ...options,
        systemPrompt,
        // Lower temperature for JSON to improve consistency
        temperature: options?.temperature ?? 0.3,
      });

      try {
        // Try to extract JSON from the response
        const jsonText = this.extractJSON(result.text);
        const parsed = JSON.parse(jsonText) as unknown;
        const validated = schema.parse(parsed);

        return {
          data: validated,
          rawText: result.text,
          usage: result.usage,
          model: result.model,
          provider: result.provider,
          latencyMs: result.latencyMs,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If we have retries left, try again with error feedback
        if (attempt < retryAttempts) {
          currentPrompt = `${prompt}\n\nPrevious attempt failed with: ${lastError.message}\nPlease provide valid JSON that matches the expected schema.`;
        }
      }
    }

    throw new Error(`Failed to generate valid JSON after ${retryAttempts + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Generate embedding vector for text
   * Note: Anthropic doesn't have a native embedding API, so we throw an error
   * suggesting to use a different provider for embeddings
   */
  async generateEmbedding(_text: string): Promise<GenerateEmbeddingResult> {
    throw new Error(
      'Anthropic does not provide an embedding API. Use Cloudflare or OpenAI for embeddings.'
    );
  }

  /**
   * Extract JSON from a response that may contain markdown or extra text
   * Uses string manipulation instead of regex to avoid ReDoS vulnerabilities
   */
  private extractJSON(text: string): string {
    const trimmed = text.trim();

    // Try to find JSON in code blocks first (```json ... ``` or ``` ... ```)
    const codeBlockStart = trimmed.indexOf('```');
    if (codeBlockStart !== -1) {
      const afterStart = trimmed.indexOf('\n', codeBlockStart);
      if (afterStart !== -1) {
        const codeBlockEnd = trimmed.indexOf('```', afterStart);
        if (codeBlockEnd !== -1) {
          const content = trimmed.slice(afterStart + 1, codeBlockEnd).trim();
          if (content !== '') {
            return content;
          }
        }
      }
    }

    // Try to find JSON object directly (first { to last })
    const objectStart = trimmed.indexOf('{');
    const objectEnd = trimmed.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd > objectStart) {
      return trimmed.slice(objectStart, objectEnd + 1);
    }

    // Try to find JSON array directly (first [ to last ])
    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      return trimmed.slice(arrayStart, arrayEnd + 1);
    }

    // Return as-is and let JSON.parse fail with a clear error
    return trimmed;
  }
}

/**
 * Create an Anthropic provider instance
 */
export function createAnthropicProvider(apiKey?: string): AnthropicProvider {
  return new AnthropicProvider(apiKey);
}
